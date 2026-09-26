import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { genderOfSlot } from '@/lib/slots';
import { persistStorage, uid } from '@/lib/storage';
import type { Person, RegisterLead, ScannedDocument } from '@/types/family';

export type PersonInput = Partial<Omit<Person, 'id' | 'slot' | 'sourceDocIds' | 'updatedAt'>> & {
  sourceDocId?: string;
};

export interface UpsertResult {
  created: boolean;
  /** Number of previously-empty fields that got a value. */
  filledFields: number;
}

const FILLABLE: (keyof PersonInput)[] = [
  'familyName',
  'givenName',
  'familyNameKana',
  'givenNameKana',
  'birthDateText',
  'birthDateIso',
  'deathDateText',
  'deathDateIso',
  'birthPlace',
  'honseki',
  'notes',
];

interface FamilyState {
  persons: Record<string, Person>;
  documents: ScannedDocument[];
  leads: RegisterLead[];

  personAt: (slot: number) => Person | undefined;
  /**
   * Create or update the person in `slot`.
   * `overwrite: false` only fills blanks (used when merging AI output).
   */
  upsertAtSlot: (slot: number, input: PersonInput, opts?: { overwrite?: boolean }) => UpsertResult;
  removePerson: (id: string) => void;
  addDocument: (doc: Omit<ScannedDocument, 'id' | 'scannedAt'>) => string;
  addLeads: (leads: { honseki: string; hittousha: string | null }[], docId: string) => number;
  setLeadStatus: (id: string, status: RegisterLead['status']) => void;
  reset: () => void;
}

const isBlank = (v: unknown) => v === undefined || v === null || v === '';

export const useFamily = create<FamilyState>()(
  persist(
    (set, get) => ({
      persons: {},
      documents: [],
      leads: [],

      personAt: (slot) => Object.values(get().persons).find((p) => p.slot === slot),

      upsertAtSlot: (slot, input, opts = { overwrite: true }) => {
        const existing = get().personAt(slot);
        const now = Date.now();
        if (!existing) {
          const person: Person = {
            id: uid(),
            slot,
            familyName: input.familyName ?? '',
            givenName: input.givenName ?? '',
            gender: input.gender && input.gender !== 'unknown' ? input.gender : genderOfSlot(slot),
            sourceDocIds: input.sourceDocId ? [input.sourceDocId] : [],
            updatedAt: now,
          };
          let filled = 0;
          for (const key of FILLABLE) {
            const v = input[key];
            if (!isBlank(v)) {
              (person as unknown as Record<string, unknown>)[key] = v;
              filled++;
            }
          }
          set((s) => ({ persons: { ...s.persons, [person.id]: person } }));
          return { created: true, filledFields: filled };
        }

        const next: Person = { ...existing, updatedAt: now };
        let filled = 0;
        for (const key of FILLABLE) {
          const v = input[key];
          if (isBlank(v)) continue;
          const cur = (existing as unknown as Record<string, unknown>)[key];
          if (isBlank(cur)) filled++;
          if (isBlank(cur) || opts.overwrite) {
            (next as unknown as Record<string, unknown>)[key] = v;
          }
        }
        if (input.gender && input.gender !== 'unknown' && (opts.overwrite || existing.gender === 'unknown')) {
          next.gender = input.gender;
        }
        if (input.sourceDocId && !next.sourceDocIds.includes(input.sourceDocId)) {
          next.sourceDocIds = [...next.sourceDocIds, input.sourceDocId];
        }
        set((s) => ({ persons: { ...s.persons, [existing.id]: next } }));
        return { created: false, filledFields: filled };
      },

      removePerson: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.persons;
          return { persons: rest };
        }),

      addDocument: (doc) => {
        const id = uid();
        set((s) => ({ documents: [{ ...doc, id, scannedAt: Date.now() }, ...s.documents] }));
        return id;
      },

      addLeads: (leads, docId) => {
        const known = new Set(get().leads.map((l) => `${l.honseki}|${l.hittousha ?? ''}`));
        const fresh = leads
          .filter((l) => l.honseki && !known.has(`${l.honseki}|${l.hittousha ?? ''}`))
          .map<RegisterLead>((l) => ({
            id: uid(),
            honseki: l.honseki,
            hittousha: l.hittousha,
            foundInDocId: docId,
            status: 'todo',
            createdAt: Date.now(),
          }));
        if (fresh.length) set((s) => ({ leads: [...fresh, ...s.leads] }));
        return fresh.length;
      },

      setLeadStatus: (id, status) =>
        set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)) })),

      reset: () => set({ persons: {}, documents: [], leads: [] }),
    }),
    {
      name: 'kakeizu-family',
      storage: persistStorage,
      partialize: (s) => ({ persons: s.persons, documents: s.documents, leads: s.leads }),
    },
  ),
);

export const displayName = (p?: Person) =>
  p ? `${p.familyName} ${p.givenName}`.trim() || '（名前未入力）' : '';
