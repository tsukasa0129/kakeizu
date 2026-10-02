// POST /extract — 戸籍の画像を Workers AI で読み取り、家系図用の JSON にする。
//   { images: [{ mediaType: "image/jpeg", data: "<base64>" }, ...] } → 200 { result: ExtractionResult } | 4xx/5xx { error }
//
// 2段階で読む（DeepSeek は画像を読めないため）:
//   1. 書き起こし: ビジョンモデル（Qwen 3.8 27B）が画像の文字をそのままテキストにする
//   2. 構造化:     DeepSeek V4 Pro が書き起こしを読み、スキーマどおりの JSON にする
// 画像はメモリ上で処理するだけで保存しない。

import { z } from 'zod';

import { ExtractionResult } from './extractionSchema';

const VISION_MODEL = '@cf/qwen/qwen3.8-27b';
// Pro は1ページの構造化に2分ほどかかったため、速い Flash を使う
const STRUCTURE_MODEL = '@cf/deepseek-ai/deepseek-v4-flash-0731';

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // per image, after base64 decoding
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const TRANSCRIBE_PROMPT = `あなたは日本の戸籍（戸籍謄本・全部事項証明書、除籍謄本、改製原戸籍謄本、明治・大正期の手書き戸籍を含む）を正確に書き起こす専門家です。
画像に書かれている文字を、要約や解釈をせずにすべてテキストに書き起こしてください。

書き起こしのルール:
- 本籍・筆頭者（戸主）・各人の欄・身分事項・父母欄・続柄・生年月日・従前戸籍など、書かれている順に書き写す。欄の区切りがわかるように改行し、各人の欄の前には「---」を入れる。
- 漢数字・大字（壱・弐・参・拾など）、旧字体・異体字は書類どおりの字で書く。
- 名前に×印がある、または消除の記載がある場合は「（×印あり）」と書き添える。
- 読めない文字は「〓」にし、推測で補わない。
- 複数ページの場合は「=== 1ページ目 ===」のようにページを区切る。
- 書き起こし以外の説明は書かない。`;

const STRUCTURE_PROMPT = `あなたは日本の戸籍を読み解く専門家です。
戸籍の画像を書き起こしたテキストを読み、家系図を作るための構造化データ（JSON）に変換してください。
書き起こしの「〓」は読めなかった文字です。

変換のルール:
- 書き起こしに書かれていることだけを出力し、推測で人物や日付を作らないこと。読めない・判断できない箇所は null にして warnings に日本語で理由を書く。
- 1つの戸籍が複数ページに分かれている場合は、1つの書類としてまとめる。
- documentType は「全部事項証明」「戸籍謄本」なら koseki_zenbu、「個人事項証明」「戸籍抄本」なら koseki_kojin、「除籍」なら joseki、「改製原戸籍」なら kaisei_genkoseki、それ以外は other。
- 戸籍に記載された各人（筆頭者・戸主・配偶者・子など）を persons に1人ずつ入れる。tempId は "p1", "p2" … とする。
- 父母欄の父・母の名前は fatherName / motherName に書かれたとおりに入れる。その父母が同じ書類に記載されている場合は fatherTempId / motherTempId でつなぐ。配偶者も同様に spouseTempId でつなぐ。
- 日付は書かれたとおり（漢数字・大字もそのまま）を *Text に、西暦に変換できるものは YYYY-MM-DD で *Iso に入れる。元年や改元日の境界に注意する（明治=1868, 大正=1912, 昭和=1926, 平成=1989, 令和=2019 が元年）。
- 名前に×印がある、または除籍の記載がある人は isRemoved を true にする。
- 「従前戸籍」「転籍」「入籍」「婚姻により〜から入籍」などに書かれた、ひとつ前の戸籍の本籍と筆頭者を previousRegisters に入れる。これは利用者が次に役所へ請求する戸籍になるので、正確に書き写すこと。
- 旧字体・異体字は、書き起こしどおりの字で書く。
- 性別は続柄（長男・二女・妻など）や記載から判断し、判断できない場合は unknown。
- 書き起こしが戸籍ではない場合は、persons を空にして warnings に「戸籍の書類ではないようです」と書く。`;

const { $schema: _draft, ...RESULT_JSON_SCHEMA } = z.toJSONSchema(ExtractionResult) as Record<string, unknown>;

type ImageInput = { mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; data: string };

export class ExtractError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function validateImages(body: unknown): ImageInput[] {
  const images = (body as { images?: unknown } | null)?.images;
  if (!Array.isArray(images) || images.length === 0) throw new ExtractError(400, '画像がありません');
  if (images.length > MAX_IMAGES) throw new ExtractError(400, `画像は最大${MAX_IMAGES}枚までです`);
  for (const img of images) {
    if (typeof img?.data !== 'string' || !ALLOWED_TYPES.has(img?.mediaType)) throw new ExtractError(400, '画像の形式が不正です');
    if ((img.data.length * 3) / 4 > MAX_IMAGE_BYTES) throw new ExtractError(400, '画像サイズが大きすぎます');
  }
  return images as ImageInput[];
}

/** Text of the first choice; throws a user-facing error when the model stopped early or returned nothing. */
function firstChoiceText(output: { choices?: { message?: { content?: unknown }; finish_reason?: string | null }[] }) {
  const choice = output.choices?.[0];
  if (choice?.finish_reason === 'length') {
    throw new ExtractError(422, '書類が長すぎて読み取りきれませんでした。ページを分けてお試しください。');
  }
  const content = choice?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new ExtractError(502, 'AIから結果が返ってきませんでした。もう一度お試しください。');
  return content;
}

async function runModel<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (e) {
    if (e instanceof ExtractError) throw e;
    console.error('workers ai error', e);
    throw new ExtractError(502, 'AIサービスでエラーが発生しました。しばらくしてからお試しください。');
  }
}

export async function extractKoseki(images: ImageInput[], ai: Ai) {
  const startedAt = Date.now();
  // 1. 書き起こし（ビジョンモデル）
  const transcription = firstChoiceText(
    await runModel(() =>
      ai.run(VISION_MODEL, {
        messages: [
          { role: 'system', content: TRANSCRIBE_PROMPT },
          {
            role: 'user',
            content: [
              ...images.flatMap((img, i) => [
                { type: 'text' as const, text: `${i + 1}ページ目:` },
                { type: 'image_url' as const, image_url: { url: `data:${img.mediaType};base64,${img.data}`, detail: 'high' as const } },
              ]),
              { type: 'text', text: 'この戸籍の画像を書き起こしてください。' },
            ],
          },
        ],
        // 書き写すだけなので推論は軽く（重くすると数分かかる）
        reasoning_effort: 'low',
        max_tokens: 16000,
      }),
    ),
  );

  const transcribedAt = Date.now();

  // 2. 構造化（DeepSeek）
  const json = firstChoiceText(
    await runModel(() =>
      ai.run(STRUCTURE_MODEL, {
        messages: [
          { role: 'system', content: STRUCTURE_PROMPT },
          { role: 'user', content: `戸籍の書き起こし:\n\n${transcription}` },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'koseki_extraction', schema: RESULT_JSON_SCHEMA, strict: true },
        },
        // 書き起こしを決まった形に整理するだけなので推論はしない（low でも1ページ1分以上かかった）
        reasoning_effort: 'none',
        max_tokens: 32000,
      }),
    ),
  );
  console.log(`extract: ${images.length} page(s), transcribe ${transcribedAt - startedAt}ms, structure ${Date.now() - transcribedAt}ms`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch {
    console.error('structure model returned non-JSON', json.slice(0, 500));
    throw new ExtractError(502, '読み取り結果を整理できませんでした。もう一度お試しください。');
  }
  const result = ExtractionResult.safeParse(parsed);
  if (!result.success) {
    console.error('structure model output does not match schema', result.error.message.slice(0, 500));
    throw new ExtractError(502, '読み取り結果を整理できませんでした。もう一度お試しください。');
  }
  return result.data;
}
