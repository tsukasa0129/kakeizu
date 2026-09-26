import type { UnitColor } from '@/theme';

export type PathNode =
  | { id: string; kind: 'slot'; slots: number[]; label: string }
  | { id: string; kind: 'lesson'; lessonId: string; label: string }
  | { id: string; kind: 'guide'; guideId: string; label: string }
  | { id: string; kind: 'scan'; count: number; label: string }
  | { id: string; kind: 'chest'; xp: number; label: string };

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  color: UnitColor;
  premium?: boolean;
  nodes: PathNode[];
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const UNITS: Unit[] = [
  {
    id: 'u1',
    title: 'ユニット1',
    subtitle: 'はじめの一歩：あなたと両親',
    color: 'green',
    nodes: [
      { id: 'u1-self', kind: 'slot', slots: [1], label: 'あなたを登録' },
      { id: 'u1-l1', kind: 'lesson', lessonId: 'what-is-koseki', label: '戸籍ってなに？' },
      { id: 'u1-father', kind: 'slot', slots: [2], label: '父を登録' },
      { id: 'u1-mother', kind: 'slot', slots: [3], label: '母を登録' },
      { id: 'u1-chest', kind: 'chest', xp: 30, label: '宝箱' },
    ],
  },
  {
    id: 'u2',
    title: 'ユニット2',
    subtitle: '戸籍を手に入れよう',
    color: 'blue',
    nodes: [
      { id: 'u2-g1', kind: 'guide', guideId: 'find-honseki', label: '本籍地を調べる' },
      { id: 'u2-l1', kind: 'lesson', lessonId: 'koseki-types', label: '戸籍の種類' },
      { id: 'u2-l2', kind: 'lesson', lessonId: 'koiki', label: '広域交付' },
      { id: 'u2-g2', kind: 'guide', guideId: 'koiki', label: '戸籍を取りに行く' },
      { id: 'u2-scan', kind: 'scan', count: 1, label: '書類をスキャン' },
      { id: 'u2-chest', kind: 'chest', xp: 50, label: '宝箱' },
    ],
  },
  {
    id: 'u3',
    title: 'ユニット3',
    subtitle: '祖父母の世代',
    color: 'purple',
    nodes: [
      { id: 'u3-l1', kind: 'lesson', lessonId: 'reading', label: '古い戸籍の読み方' },
      { id: 'u3-pgf', kind: 'slot', slots: [4], label: '父方の祖父' },
      { id: 'u3-pgm', kind: 'slot', slots: [5], label: '父方の祖母' },
      { id: 'u3-mgf', kind: 'slot', slots: [6], label: '母方の祖父' },
      { id: 'u3-mgm', kind: 'slot', slots: [7], label: '母方の祖母' },
      { id: 'u3-scan', kind: 'scan', count: 2, label: '2枚目をスキャン' },
      { id: 'u3-chest', kind: 'chest', xp: 80, label: '宝箱' },
    ],
  },
  {
    id: 'u4',
    title: 'ユニット4',
    subtitle: '曾祖父母の世代',
    color: 'orange',
    nodes: [
      { id: 'u4-l1', kind: 'lesson', lessonId: 'trace-back', label: 'さかのぼり方' },
      { id: 'u4-l2', kind: 'lesson', lessonId: 'fees-mail', label: '手数料と郵送' },
      { id: 'u4-p', kind: 'slot', slots: range(8, 11), label: '父方の曾祖父母' },
      { id: 'u4-m', kind: 'slot', slots: range(12, 15), label: '母方の曾祖父母' },
      { id: 'u4-scan', kind: 'scan', count: 4, label: '4枚スキャン' },
      { id: 'u4-chest', kind: 'chest', xp: 120, label: '宝箱' },
    ],
  },
  {
    id: 'u5',
    title: 'ユニット5',
    subtitle: '高祖父母、さらにその先へ',
    color: 'red',
    premium: true,
    nodes: [
      { id: 'u5-g1', kind: 'guide', guideId: 'trace', label: '古い戸籍を集める' },
      { id: 'u5-p', kind: 'slot', slots: range(16, 23), label: '父方の高祖父母' },
      { id: 'u5-m', kind: 'slot', slots: range(24, 31), label: '母方の高祖父母' },
      { id: 'u5-chest', kind: 'chest', xp: 200, label: '宝箱' },
    ],
  },
];
