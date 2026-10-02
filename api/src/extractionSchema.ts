import { z } from 'zod';

// Keep in sync with src/types/extraction.ts in the app.

const nullableString = z.string().nullable();

export const ExtractedEvent = z.object({
  kind: z.enum(['birth', 'marriage', 'divorce', 'death', 'adoption', 'transfer', 'other']),
  dateText: nullableString.describe('Date exactly as written, e.g. 「昭和参拾年四月壱日」'),
  dateIso: nullableString.describe('Gregorian YYYY-MM-DD, or null if it cannot be determined'),
  description: z.string().describe('Short Japanese summary of the entry'),
});

export const ExtractedPerson = z.object({
  tempId: z.string().describe('Unique id within this response, e.g. "p1"'),
  familyName: z.string(),
  givenName: z.string(),
  familyNameKana: nullableString,
  givenNameKana: nullableString,
  gender: z.enum(['male', 'female', 'unknown']),
  relationInRegister: nullableString.describe('続柄 as written: 筆頭者, 戸主, 妻, 長男, 二女, 養子 …'),
  birthDateText: nullableString,
  birthDateIso: nullableString,
  deathDateText: nullableString,
  deathDateIso: nullableString,
  birthPlace: nullableString,
  fatherName: nullableString.describe('父 in the 父母欄, full name as written'),
  motherName: nullableString.describe('母 in the 父母欄, as written (often given name only)'),
  fatherTempId: nullableString.describe('tempId of the father if he is also listed in this document'),
  motherTempId: nullableString.describe('tempId of the mother if she is also listed in this document'),
  spouseTempId: nullableString.describe('tempId of the spouse if listed in this document'),
  isRemoved: z.boolean().describe('True if the person is struck out (除籍, ×印)'),
  events: z.array(ExtractedEvent),
});

export const ExtractionResult = z.object({
  documentType: z.enum(['koseki_zenbu', 'koseki_kojin', 'joseki', 'kaisei_genkoseki', 'other']),
  documentTitle: z.string(),
  honseki: nullableString,
  hittousha: nullableString.describe('筆頭者 (or 戸主 in Meiji-era registers)'),
  issuer: nullableString,
  persons: z.array(ExtractedPerson),
  previousRegisters: z
    .array(z.object({ honseki: z.string(), hittousha: nullableString }))
    .describe('Earlier registers referenced by 従前戸籍 / 転籍 / 入籍 / 婚姻 entries — the next documents to request'),
  warnings: z.array(z.string()).describe('Japanese notes on illegible or uncertain parts'),
});

export type ExtractionResult = z.infer<typeof ExtractionResult>;
