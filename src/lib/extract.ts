import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { ExtractionResult } from '@/types/extraction';

const EXTRACT_URL = process.env.EXPO_PUBLIC_EXTRACT_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isDemoMode = () => !EXTRACT_URL;

/** Long edge in px. Keeps kanji legible while staying well under request limits. */
const MAX_EDGE = 2000;

export interface PageImage {
  uri: string;
  width: number;
  height: number;
}

async function toJpegBase64(img: PageImage) {
  const ctx = ImageManipulator.manipulate(img.uri);
  if (Math.max(img.width, img.height) > MAX_EDGE) {
    ctx.resize(img.width >= img.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const ref = await ctx.renderAsync();
  const out = await ref.saveAsync({ base64: true, compress: 0.85, format: SaveFormat.JPEG });
  if (!out.base64) throw new Error('画像の変換に失敗しました');
  return out.base64;
}

export class ExtractError extends Error {}

export async function extractKoseki(pages: PageImage[]): Promise<ExtractionResult> {
  if (!EXTRACT_URL) {
    await new Promise((r) => setTimeout(r, 2200));
    return DEMO_RESULT;
  }

  const images = await Promise.all(
    pages.map(async (p) => ({ mediaType: 'image/jpeg' as const, data: await toJpegBase64(p) })),
  );

  const res = await fetch(EXTRACT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ANON_KEY ? { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY } : {}),
    },
    body: JSON.stringify({ images }),
  });

  const body = (await res.json().catch(() => null)) as
    | { result?: ExtractionResult; error?: string }
    | null;
  if (!res.ok || !body?.result) {
    throw new ExtractError(body?.error ?? `読み取りに失敗しました（${res.status}）`);
  }
  return body.result;
}

// Fictional sample used when no backend is configured, so the whole flow can be tried in Expo Go.
const DEMO_RESULT: ExtractionResult = {
  documentType: 'koseki_zenbu',
  documentTitle: '戸籍全部事項証明書（サンプル）',
  honseki: '東京都みどり区さくら町一丁目1番地',
  hittousha: '山田 一郎',
  issuer: 'みどり区長',
  persons: [
    {
      tempId: 'p1',
      familyName: '山田',
      givenName: '一郎',
      familyNameKana: 'やまだ',
      givenNameKana: 'いちろう',
      gender: 'male',
      relationInRegister: '筆頭者',
      birthDateText: '昭和35年4月1日',
      birthDateIso: '1960-04-01',
      deathDateText: null,
      deathDateIso: null,
      birthPlace: '静岡県あおば市',
      fatherName: '山田 権蔵',
      motherName: 'キク',
      fatherTempId: null,
      motherTempId: null,
      spouseTempId: 'p2',
      isRemoved: false,
      events: [
        { kind: 'birth', dateText: '昭和35年4月1日', dateIso: '1960-04-01', description: '静岡県あおば市で出生' },
        { kind: 'marriage', dateText: '昭和62年10月10日', dateIso: '1987-10-10', description: '鈴木花子と婚姻' },
      ],
    },
    {
      tempId: 'p2',
      familyName: '山田',
      givenName: '花子',
      familyNameKana: 'やまだ',
      givenNameKana: 'はなこ',
      gender: 'female',
      relationInRegister: '妻',
      birthDateText: '昭和38年7月7日',
      birthDateIso: '1963-07-07',
      deathDateText: null,
      deathDateIso: null,
      birthPlace: '長野県ひかり村',
      fatherName: '鈴木 正男',
      motherName: 'ふみ',
      fatherTempId: null,
      motherTempId: null,
      spouseTempId: 'p1',
      isRemoved: false,
      events: [{ kind: 'marriage', dateText: '昭和62年10月10日', dateIso: '1987-10-10', description: '山田一郎と婚姻' }],
    },
    {
      tempId: 'p3',
      familyName: '山田',
      givenName: '太郎',
      familyNameKana: 'やまだ',
      givenNameKana: 'たろう',
      gender: 'male',
      relationInRegister: '長男',
      birthDateText: '平成2年5月5日',
      birthDateIso: '1990-05-05',
      deathDateText: null,
      deathDateIso: null,
      birthPlace: '東京都みどり区',
      fatherName: '山田 一郎',
      motherName: '花子',
      fatherTempId: 'p1',
      motherTempId: 'p2',
      spouseTempId: null,
      isRemoved: false,
      events: [],
    },
  ],
  previousRegisters: [{ honseki: '静岡県あおば市もみじ町5番地', hittousha: '山田 権蔵' }],
  warnings: ['これはデモ用のサンプルデータです。実際の書類を読み取るには EXPO_PUBLIC_EXTRACT_URL を設定してください。'],
};
