import { fatherSlot, generationOf, motherSlot, spouseSlot, xpForSlot } from '@/lib/slots';
import { useFamily } from '@/store/family';
import type { ExtractedPerson, ExtractionResult } from '@/types/extraction';
import type { Person } from '@/types/family';

export type Assignment = Record<string, number | null>;

const norm = (s: string | null | undefined) => (s ?? '').replace(/[\s　]/g, '');

function matchExisting(p: ExtractedPerson, persons: Person[]): number | null {
  const full = norm(p.familyName) + norm(p.givenName);
  const hit =
    persons.find((e) => norm(e.familyName) + norm(e.givenName) === full && full.length > 0) ??
    persons.find(
      (e) =>
        norm(e.givenName) === norm(p.givenName) &&
        !!p.birthDateIso &&
        e.birthDateIso === p.birthDateIso,
    );
  return hit ? hit.slot : null;
}

/**
 * Walk parent/spouse links inside one register outward from any already-known slot.
 * Children are only placed when a parent has exactly one child in the document
 * (otherwise we can't tell which sibling is your direct ancestor).
 */
export function propagate(persons: ExtractedPerson[], assignment: Assignment): Assignment {
  const out: Assignment = { ...assignment };
  const taken = () => new Set(Object.values(out).filter((v): v is number => v != null));
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of persons) {
      const s = out[p.tempId];
      if (s == null) continue;
      const links: [string | null, number | null][] = [
        [p.fatherTempId, fatherSlot(s)],
        [p.motherTempId, motherSlot(s)],
        [p.spouseTempId, spouseSlot(s)],
      ];
      for (const [id, slot] of links) {
        if (id && slot != null && out[id] == null && !taken().has(slot)) {
          out[id] = slot;
          changed = true;
        }
      }
      const children = persons.filter((c) => c.fatherTempId === p.tempId || c.motherTempId === p.tempId);
      if (s > 1 && children.length === 1) {
        const child = children[0];
        const slot = Math.floor(s / 2);
        if (out[child.tempId] == null && !taken().has(slot)) {
          out[child.tempId] = slot;
          changed = true;
        }
      }
    }
  }
  return out;
}

export function suggestAssignment(result: ExtractionResult): Assignment {
  const existing = Object.values(useFamily.getState().persons);
  const initial: Assignment = {};
  for (const p of result.persons) initial[p.tempId] = matchExisting(p, existing);
  return propagate(result.persons, initial);
}

export interface MergeSummary {
  created: number[];
  updated: number[];
  xp: number;
}

function splitName(full: string, fallbackFamily: string) {
  const parts = full.trim().split(/[\s　]+/);
  if (parts.length >= 2) return { familyName: parts[0], givenName: parts.slice(1).join('') };
  return { familyName: fallbackFamily, givenName: parts[0] ?? '' };
}

export function applyMerge(
  result: ExtractionResult,
  assignment: Assignment,
  docId: string,
  maxGeneration: number,
): MergeSummary {
  const family = useFamily.getState();
  const summary: MergeSummary = { created: [], updated: [], xp: 0 };
  const allowed = (slot: number) => generationOf(slot) <= maxGeneration;
  const assignedSlots = new Set(Object.values(assignment).filter((v): v is number => v != null));

  const record = (slot: number, created: boolean, filled: number) => {
    if (created) {
      summary.created.push(slot);
      summary.xp += xpForSlot(slot);
    } else if (filled > 0) {
      summary.updated.push(slot);
      summary.xp += Math.min(filled, 4) * 5;
    }
  };

  for (const p of result.persons) {
    const slot = assignment[p.tempId];
    if (slot == null || !allowed(slot)) continue;
    const res = family.upsertAtSlot(
      slot,
      {
        familyName: p.familyName,
        givenName: p.givenName,
        familyNameKana: p.familyNameKana ?? undefined,
        givenNameKana: p.givenNameKana ?? undefined,
        gender: p.gender,
        birthDateText: p.birthDateText ?? undefined,
        birthDateIso: p.birthDateIso ?? undefined,
        deathDateText: p.deathDateText ?? undefined,
        deathDateIso: p.deathDateIso ?? undefined,
        birthPlace: p.birthPlace ?? undefined,
        honseki: result.honseki ?? undefined,
        sourceDocId: docId,
      },
      { overwrite: false },
    );
    record(slot, res.created, res.filledFields);

    // 父母欄 names give us the next generation even when the parents
    // are not in this register.
    const parents: [string | null, string | null, number][] = [
      [p.fatherTempId, p.fatherName, fatherSlot(slot)],
      [p.motherTempId, p.motherName, motherSlot(slot)],
    ];
    for (const [tempId, name, pslot] of parents) {
      if (tempId || !name || assignedSlots.has(pslot) || !allowed(pslot)) continue;
      const isFather = pslot % 2 === 0;
      const { familyName, givenName } = splitName(name, isFather ? p.familyName : '');
      const r = family.upsertAtSlot(
        pslot,
        { familyName, givenName, notes: `${p.familyName}${p.givenName}の父母欄より`, sourceDocId: docId },
        { overwrite: false },
      );
      record(pslot, r.created, r.filledFields);
    }
  }
  return summary;
}
