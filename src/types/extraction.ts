// Shape returned by the API's /extract (AI reading of koseki images).
// Keep in sync with api/src/extractionSchema.ts.
import type { DocumentType, Gender } from './family';

export type EventKind =
  | 'birth'
  | 'marriage'
  | 'divorce'
  | 'death'
  | 'adoption'
  | 'transfer'
  | 'other';

export interface ExtractedEvent {
  kind: EventKind;
  dateText: string | null;
  dateIso: string | null;
  description: string;
}

export interface ExtractedPerson {
  tempId: string;
  familyName: string;
  givenName: string;
  familyNameKana: string | null;
  givenNameKana: string | null;
  gender: Gender;
  relationInRegister: string | null;
  birthDateText: string | null;
  birthDateIso: string | null;
  deathDateText: string | null;
  deathDateIso: string | null;
  birthPlace: string | null;
  fatherName: string | null;
  motherName: string | null;
  fatherTempId: string | null;
  motherTempId: string | null;
  spouseTempId: string | null;
  isRemoved: boolean;
  events: ExtractedEvent[];
}

export interface ExtractionResult {
  documentType: DocumentType;
  documentTitle: string;
  honseki: string | null;
  hittousha: string | null;
  issuer: string | null;
  persons: ExtractedPerson[];
  previousRegisters: { honseki: string; hittousha: string | null }[];
  warnings: string[];
}
