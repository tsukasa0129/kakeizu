// POST /extract — 戸籍の画像を AI で読み取り、家系図用の JSON にする。
//   { images: [{ mediaType: "image/jpeg", data: "<base64>" }, ...] } → { result: ExtractionResult } | { error }
//
// 使うモデルは wrangler.jsonc の EXTRACT_MODEL で切り替える（README の「AI 読み取り」に比較結果）。
// カンマ区切りで複数書くと、失敗したときに次のモデルで読み直す:
//   "workers-ai"     2段階。Qwen 3.8（ビジョン）で書き起こし → DeepSeek V4 Flash で構造化（DeepSeek は画像を読めないため）
//   "@cf/<model>"    Workers AI のビジョンモデル1回で、画像から直接 JSON にする
//   "<作者>/<model>" AI Gateway 経由の外部モデル（例: google/gemini-3.8-flash）。1回で画像から直接 JSON。
//                    Cloudflare の Unified Billing（前払いクレジット）で払うので、外部の API キーは不要
// 画像はメモリ上で処理するだけで保存しない。

import { z } from 'zod';

import { ExtractionResult } from './extractionSchema';

const TRANSCRIBE_MODEL = '@cf/qwen/qwen3.8-27b';
// Pro は1ページの構造化に2分ほどかかったため、速い Flash を使う
const STRUCTURE_MODEL = '@cf/deepseek-ai/deepseek-v4-flash-0731';

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // per image, after base64 decoding
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const EXPERT = '日本の戸籍（戸籍謄本・全部事項証明書、除籍謄本、改製原戸籍謄本、明治・大正期の手書き戸籍を含む）';

const TRANSCRIBE_PROMPT = `あなたは${EXPERT}を正確に書き起こす専門家です。
画像に書かれている文字を、要約や解釈をせずにすべてテキストに書き起こしてください。

書き起こしのルール:
- 本籍・筆頭者（戸主）・各人の欄・身分事項・父母欄・続柄・生年月日・従前戸籍など、書かれている順に書き写す。欄の区切りがわかるように改行し、各人の欄の前には「---」を入れる。
- 漢数字・大字（壱・弐・参・拾など）、旧字体・異体字は書類どおりの字で書く。
- 名前に×印がある、または消除の記載がある場合は「（×印あり）」と書き添える。
- 読めない文字は「〓」にし、推測で補わない。
- 複数ページの場合は「=== 1ページ目 ===」のようにページを区切る。
- 書き起こし以外の説明は書かない。`;

/** Rules for turning a koseki (as an image, or as a transcription of one) into the schema. */
const RULES = `- 書かれていることだけを出力し、推測で人物や日付を作らないこと。読めない・判断できない箇所は null にして warnings に日本語で理由を書く。
- 1つの戸籍が複数ページに分かれている場合は、1つの書類としてまとめる。
- documentType は書類の見出し（タイトル）で判断する。「全部事項証明」「戸籍謄本」なら koseki_zenbu、「個人事項証明」「戸籍抄本」なら koseki_kojin、「除籍謄本」なら joseki、「改製原戸籍」なら kaisei_genkoseki、見出しがない・わからないときは other。本文中の「除籍」（婚姻などで抜けた人の記載）では判断しない。
- 戸籍に記載された各人（筆頭者・戸主・配偶者・子など）を persons に1人ずつ入れる。tempId は "p1", "p2" … とする。
- 同じ戸籍に記載されている人の氏（familyName）は、別の氏が書かれていない限り筆頭者（戸主）の氏にする。配偶者の旧姓は父母欄や従前戸籍の筆頭者から推測して入れないこと。
- 父母欄の父・母の名前は fatherName / motherName に書かれたとおりに入れる。その父母が同じ書類に記載されている場合は fatherTempId / motherTempId でつなぐ。配偶者も同様に spouseTempId でつなぐ。
- 日付は書かれたとおり（漢数字・大字もそのまま）を *Text に、西暦に変換できるものは YYYY-MM-DD で *Iso に入れる。元年や改元日の境界に注意する（明治=1868, 大正=1912, 昭和=1926, 平成=1989, 令和=2019 が元年）。
- 名前に×印がある、または除籍の記載がある人は isRemoved を true にする。
- 「従前戸籍」「転籍」「入籍」「婚姻により〜から入籍」などに書かれた、ひとつ前の戸籍の本籍と筆頭者を previousRegisters に入れる。これは利用者が次に役所へ請求する戸籍になるので、正確に書き写すこと。
- 旧字体・異体字は、できるだけ書類どおりの字で書く。
- 性別は続柄（長男・二女・妻など）や記載から判断し、判断できない場合は unknown。
- 戸籍ではない場合は、persons を空にして warnings に「戸籍の書類ではないようです」と書く。`;

const { $schema: _draft, ...RESULT_JSON_SCHEMA } = z.toJSONSchema(ExtractionResult) as Record<string, unknown>;
const JSON_ONLY = `出力は次の JSON Schema に従う JSON オブジェクトだけにする（説明やコードブロックは付けない）:\n${JSON.stringify(RESULT_JSON_SCHEMA)}`;

const STRUCTURE_PROMPT = `あなたは日本の戸籍を読み解く専門家です。
戸籍の画像を書き起こしたテキストを読み、家系図を作るための構造化データ（JSON）に変換してください。
書き起こしの「〓」は読めなかった文字です。

変換のルール:
${RULES}

${JSON_ONLY}`;

const READ_PROMPT = `あなたは${EXPERT}を正確に読み取る専門家です。
ユーザーが家系図を作るために、画像に書かれている内容を構造化データ（JSON）に変換してください。

読み取りのルール:
${RULES}

${JSON_ONLY}`;

export type ImageInput = { mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; data: string };

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

type ChatOutput = { choices?: { message?: { content?: unknown }; finish_reason?: string | null }[] };

/** Text of the first choice; throws a user-facing error when the model stopped early or returned nothing. */
function firstChoiceText(output: ChatOutput) {
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
    console.error('ai error', e instanceof Error ? `${e.name}: ${e.message}` : e);
    throw new ExtractError(502, 'AIサービスでエラーが発生しました。しばらくしてからお試しください。');
  }
}

function imageMessage(images: ImageInput[], ask: string) {
  return {
    role: 'user' as const,
    content: [
      ...images.flatMap((img, i) => [
        { type: 'text' as const, text: `${i + 1}ページ目:` },
        { type: 'image_url' as const, image_url: { url: `data:${img.mediaType};base64,${img.data}`, detail: 'high' as const } },
      ]),
      { type: 'text' as const, text: ask },
    ],
  };
}

/** Models sometimes write null (or leave out) fields the schema needs as strings / arrays; fill those in. */
function normalize(value: unknown) {
  const doc = value as Record<string, unknown> | null;
  if (!doc || typeof doc !== 'object') return value;
  doc.documentTitle ??= '';
  doc.persons ??= [];
  doc.previousRegisters ??= [];
  doc.warnings ??= [];
  for (const p of (Array.isArray(doc.persons) ? doc.persons : []) as Record<string, unknown>[]) {
    p.familyName ??= '';
    p.givenName ??= '';
    p.events ??= [];
    for (const e of (Array.isArray(p.events) ? p.events : []) as Record<string, unknown>[]) e.description ??= '';
  }
  return doc;
}

function parseResult(json: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json.trim().replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch {
    console.error('model returned non-JSON', json.slice(0, 500));
    throw new ExtractError(502, '読み取り結果を整理できませんでした。もう一度お試しください。');
  }
  const result = ExtractionResult.safeParse(normalize(parsed));
  if (!result.success) {
    console.error('model output does not match schema', result.error.message.slice(0, 500));
    throw new ExtractError(502, '読み取り結果を整理できませんでした。もう一度お試しください。');
  }
  return result.data;
}

/** Workers AI only: a vision model transcribes, DeepSeek structures. */
async function twoStep(images: ImageInput[], ai: Ai) {
  const startedAt = Date.now();
  const transcription = firstChoiceText(
    await runModel(() =>
      ai.run(TRANSCRIBE_MODEL, {
        messages: [{ role: 'system', content: TRANSCRIBE_PROMPT }, imageMessage(images, 'この戸籍の画像を書き起こしてください。')],
        // 書き写すだけなので推論は軽く（重くすると数分かかる）
        reasoning_effort: 'low',
        max_tokens: 16000,
      }),
    ),
  );
  const transcribedAt = Date.now();
  const json = firstChoiceText(
    await runModel(() =>
      ai.run(STRUCTURE_MODEL, {
        messages: [
          { role: 'system', content: STRUCTURE_PROMPT },
          { role: 'user', content: `戸籍の書き起こし:\n\n${transcription}` },
        ],
        // JSON Schema での制約付き出力（json_schema）は1ページ40秒以上かかったので、JSON モード＋プロンプトのスキーマ＋Zod の検証にする
        response_format: { type: 'json_object' },
        // 書き起こしを決まった形に整理するだけなので推論はしない（low でも1ページ1分以上かかった）
        reasoning_effort: 'none',
        max_tokens: 32000,
      }),
    ),
  );
  console.log(`extract[workers-ai]: ${images.length} page(s), transcribe ${transcribedAt - startedAt}ms, structure ${Date.now() - transcribedAt}ms`);
  return parseResult(json);
}

/** One call: a vision model reads the images and answers with the JSON directly. */
async function oneStep(images: ImageInput[], ai: Ai, model: string) {
  const startedAt = Date.now();
  const messages = [{ role: 'system' as const, content: READ_PROMPT }, imageMessage(images, 'この戸籍を読み取り、JSON で出力してください。')];
  const output = await runModel(async () =>
    model.startsWith('@cf/')
      ? ((await ai.run(model as typeof TRANSCRIBE_MODEL, {
          messages,
          response_format: { type: 'json_object' },
          reasoning_effort: 'low',
          max_tokens: 32000,
        })) as ChatOutput)
      : // Third-party models go through AI Gateway (Unified Billing) in the Chat Completions format.
        ((await ai.run(model, { messages, max_tokens: 32000, reasoning_effort: 'low' }, { gateway: { id: 'default' } })) as ChatOutput),
  );
  console.log(`extract[${model}]: ${images.length} page(s), ${Date.now() - startedAt}ms`);
  return parseResult(firstChoiceText(output));
}

function extractWith(images: ImageInput[], ai: Ai, model: string) {
  return model === 'workers-ai' ? twoStep(images, ai) : oneStep(images, ai, model);
}

/**
 * `models` is a comma-separated list tried in order (e.g. "google/gemini-3.8-flash,workers-ai"): when one fails
 * (AI error, credits used up, unusable output) the next one reads the same images.
 */
export async function extractKoseki(images: ImageInput[], ai: Ai, models: string) {
  const list = models.split(',').map((m) => m.trim()).filter(Boolean);
  for (const [i, model] of list.entries()) {
    try {
      return await extractWith(images, ai, model);
    } catch (e) {
      // A document too long for the model fails the same way everywhere; stop there.
      const last = i === list.length - 1;
      if (last || (e instanceof ExtractError && e.status === 422)) throw e;
      console.warn(`extract: ${model} failed (${e instanceof Error ? e.message : e}), trying ${list[i + 1]}`);
    }
  }
  throw new ExtractError(500, 'AI読み取りのモデルが設定されていません');
}
