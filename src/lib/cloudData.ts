// The app state saved to the cloud, and how two copies are combined when two devices changed it.
import type { FamilyData } from '@/store/family';
import type { GameData } from '@/store/game';
import type { Person, RegisterLead } from '@/types/family';

export interface CloudData {
  schema: 1;
  family: FamilyData;
  game: GameData;
}

export const isPristine = (d: CloudData) =>
  Object.keys(d.family.persons).length === 0 && d.family.documents.length === 0 && d.game.xp === 0 && !d.game.onboarded;

const isBlank = (v: unknown) => v === undefined || v === null || v === '';
const union = <T>(a: T[] = [], b: T[] = []) => [...new Set([...a, ...b])];

/** People are matched by slot: the newer edit wins field by field, but never blanks out a value. */
function mergePersons(a: Record<string, Person>, b: Record<string, Person>) {
  const bySlot = new Map<number, Person>();
  for (const p of [...Object.values(a), ...Object.values(b)]) {
    const cur = bySlot.get(p.slot);
    if (!cur) {
      bySlot.set(p.slot, p);
      continue;
    }
    const [older, newer] = cur.updatedAt <= p.updatedAt ? [cur, p] : [p, cur];
    const merged = { ...older } as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(newer)) if (!isBlank(value)) merged[key] = value;
    const person = merged as unknown as Person;
    person.id = older.id;
    person.gender = newer.gender === 'unknown' ? older.gender : newer.gender;
    person.sourceDocIds = union(older.sourceDocIds, newer.sourceDocIds);
    bySlot.set(p.slot, person);
  }
  return Object.fromEntries([...bySlot.values()].map((p) => [p.id, p]));
}

const LEAD_RANK: Record<RegisterLead['status'], number> = { todo: 0, requested: 1, received: 2 };

function mergeLeads(a: RegisterLead[], b: RegisterLead[]) {
  const byKey = new Map<string, RegisterLead>();
  for (const lead of [...a, ...b]) {
    const key = `${lead.honseki}|${lead.hittousha ?? ''}`;
    const cur = byKey.get(key);
    if (!cur || LEAD_RANK[lead.status] > LEAD_RANK[cur.status]) byKey.set(key, cur ? { ...cur, status: lead.status } : lead);
  }
  return [...byKey.values()].sort((x, y) => y.createdAt - x.createdAt);
}

function mergeGame(a: GameData, b: GameData): GameData {
  // Progress is mostly additive: keep the copy with more XP and add whatever the other unlocked.
  const [base, other] = a.xp >= b.xp ? [a, b] : [b, a];
  return {
    ...other,
    ...base,
    onboarded: a.onboarded || b.onboarded,
    longestStreak: Math.max(a.longestStreak, b.longestStreak),
    completedLessons: union(base.completedLessons, other.completedLessons),
    openedChests: union(base.openedChests, other.openedChests),
    badges: union(base.badges, other.badges),
    activeDays: union(base.activeDays, other.activeDays).sort().slice(-120),
    guideChecks: { ...other.guideChecks, ...base.guideChecks },
  };
}

/** Combines this device's state with the cloud copy saved by another device. */
export function mergeCloudData(local: CloudData, remote: CloudData): CloudData {
  const docs = new Map([...remote.family.documents, ...local.family.documents].map((d) => [d.id, d]));
  return {
    schema: 1,
    family: {
      persons: mergePersons(local.family.persons, remote.family.persons),
      documents: [...docs.values()].sort((x, y) => y.scannedAt - x.scannedAt),
      leads: mergeLeads(local.family.leads, remote.family.leads),
    },
    game: mergeGame(local.game, remote.game),
  };
}
