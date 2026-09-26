export type Gender = 'male' | 'female' | 'unknown';

/**
 * A person in the pedigree. `slot` uses Ahnentafel numbering:
 * 1 = you, 2 = father, 3 = mother, 2n = father of n, 2n + 1 = mother of n.
 */
export interface Person {
  id: string;
  slot: number;
  familyName: string;
  givenName: string;
  familyNameKana?: string;
  givenNameKana?: string;
  gender: Gender;
  /** Date as written on the document, e.g. 「昭和参拾年四月壱日」. */
  birthDateText?: string;
  birthDateIso?: string;
  deathDateText?: string;
  deathDateIso?: string;
  birthPlace?: string;
  honseki?: string;
  notes?: string;
  sourceDocIds: string[];
  updatedAt: number;
}

export type DocumentType =
  | 'koseki_zenbu'
  | 'koseki_kojin'
  | 'joseki'
  | 'kaisei_genkoseki'
  | 'other';

export interface ScannedDocument {
  id: string;
  type: DocumentType;
  title: string;
  honseki: string | null;
  hittousha: string | null;
  scannedAt: number;
  personCount: number;
}

/** A register the user should request next (from a document's 従前戸籍 line). */
export interface RegisterLead {
  id: string;
  honseki: string;
  hittousha: string | null;
  foundInDocId: string;
  status: 'todo' | 'requested' | 'received';
  createdAt: number;
}
