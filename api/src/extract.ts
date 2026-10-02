// POST /extract — 戸籍の画像を Claude で読み取り、家系図用の JSON にする（旧 Supabase Edge Function）。
//   { images: [{ mediaType: "image/jpeg", data: "<base64>" }, ...] } → 200 { result: ExtractionResult } | 4xx/5xx { error }
// 画像はメモリ上で処理するだけで保存しない。API キーは Worker のシークレット ANTHROPIC_API_KEY。

import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { ExtractionResult } from './extractionSchema';

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // per image, after base64 decoding
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const SYSTEM_PROMPT = `あなたは日本の戸籍（戸籍謄本・全部事項証明書、除籍謄本、改製原戸籍謄本、明治・大正期の手書き戸籍を含む）を正確に読み取る専門家です。
ユーザーが家系図を作るために、画像に書かれている内容を構造化データに変換してください。

読み取りのルール:
- 画像に書かれていることだけを出力し、推測で人物や日付を作らないこと。読めない箇所は null にして warnings に日本語で理由を書く。
- 1つの戸籍が複数ページに分かれている場合は、1つの書類としてまとめる。
- 戸籍に記載された各人（筆頭者・戸主・配偶者・子など）を persons に1人ずつ入れる。tempId は "p1", "p2" … とする。
- 父母欄の父・母の名前は fatherName / motherName に書かれたとおりに入れる。その父母が同じ書類に記載されている場合は fatherTempId / motherTempId でつなぐ。配偶者も同様に spouseTempId でつなぐ。
- 日付は書かれたとおり（漢数字・大字もそのまま）を *Text に、西暦に変換できるものは YYYY-MM-DD で *Iso に入れる。元年や改元日の境界に注意する（明治=1868, 大正=1912, 昭和=1926, 平成=1989, 令和=2019 が元年）。
- 名前に×印がある、または除籍の記載がある人は isRemoved を true にする。
- 「従前戸籍」「転籍」「入籍」「婚姻により〜から入籍」などに書かれた、ひとつ前の戸籍の本籍と筆頭者を previousRegisters に入れる。これは利用者が次に役所へ請求する戸籍になるので、正確に書き写すこと。
- 旧字体・異体字は、できるだけ書類どおりの字で書く。
- 性別は続柄（長男・二女・妻など）や記載から判断し、判断できない場合は unknown。`;

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

export async function extractKoseki(images: ImageInput[], apiKey: string) {
  const client = new Anthropic({ apiKey });
  try {
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high', format: betaZodOutputFormat(ExtractionResult) },
      // Re-run on Anthropic's recommended fallback model if the primary model declines.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...images.flatMap((img, i) => [
              { type: 'text' as const, text: `${i + 1}ページ目:` },
              { type: 'image' as const, source: { type: 'base64' as const, media_type: img.mediaType, data: img.data } },
            ]),
            { type: 'text', text: 'この戸籍を読み取り、指定のスキーマで出力してください。' },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      throw new ExtractError(422, 'この画像は読み取れませんでした。戸籍の書類を撮影してください。');
    }
    if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
      throw new ExtractError(422, '書類が長すぎて読み取りきれませんでした。ページを分けてお試しください。');
    }
    return response.parsed_output;
  } catch (e) {
    if (e instanceof ExtractError) throw e;
    if (e instanceof Anthropic.RateLimitError) throw new ExtractError(429, '混み合っています。しばらくしてからお試しください。');
    if (e instanceof Anthropic.BadRequestError) {
      console.error('bad request', e.message);
      throw new ExtractError(400, '画像を処理できませんでした。');
    }
    if (e instanceof Anthropic.APIError) {
      console.error('anthropic api error', e.status, e.message);
      throw new ExtractError(502, 'AIサービスでエラーが発生しました。');
    }
    throw e;
  }
}
