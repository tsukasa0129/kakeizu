import type { Gender } from '@/types/family';

// Ahnentafel helpers. Slot 1 is the user; slot n's father is 2n, mother 2n + 1.

export const MAX_GENERATION = 5; // you → 5代前 (63 slots)

export const generationOf = (slot: number) => Math.floor(Math.log2(slot));
export const fatherSlot = (slot: number) => slot * 2;
export const motherSlot = (slot: number) => slot * 2 + 1;
export const childSlot = (slot: number) => Math.floor(slot / 2);
export const spouseSlot = (slot: number) =>
  slot === 1 ? null : slot % 2 === 0 ? slot + 1 : slot - 1;

export const slotsInGeneration = (gen: number) => {
  const start = 2 ** gen;
  return Array.from({ length: start }, (_, i) => start + i);
};

export const slotsUpTo = (maxGen: number) => {
  const out: number[] = [];
  for (let g = 0; g <= maxGen; g++) out.push(...slotsInGeneration(g));
  return out;
};

export const genderOfSlot = (slot: number): Gender =>
  slot === 1 ? 'unknown' : slot % 2 === 0 ? 'male' : 'female';

const GENERATION_NAMES = ['あなた', '親', '祖父母', '曾祖父母', '高祖父母', '5代前'];

export const generationName = (gen: number) => GENERATION_NAMES[gen] ?? `${gen}代前`;

/** Route from you to the slot, e.g. 11 → ['父', '母', '母']. */
export const pathOf = (slot: number): ('父' | '母')[] => {
  const bits = slot.toString(2).slice(1);
  return [...bits].map((b) => (b === '0' ? '父' : '母'));
};

export function relationLabel(slot: number): string {
  if (slot === 1) return 'あなた';
  const path = pathOf(slot);
  const male = slot % 2 === 0;
  switch (path.length) {
    case 1:
      return male ? '父' : '母';
    case 2:
      return `${path[0]}方の${male ? '祖父' : '祖母'}`;
    case 3:
      return male ? '曾祖父' : '曾祖母';
    case 4:
      return male ? '高祖父' : '高祖母';
    default:
      return `${path.length}代前の${male ? '祖父' : '祖母'}`;
  }
}

/** 「父の父の母」 style description, useful for deep generations. */
export const pathDescription = (slot: number) =>
  slot === 1 ? 'あなた' : pathOf(slot).join('の');

/** XP for filling a slot grows with how far back it is. */
export const xpForSlot = (slot: number) => 20 + generationOf(slot) * 10;
