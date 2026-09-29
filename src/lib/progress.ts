import { useMemo } from 'react';

import type { IconName } from '@/components/Icon';
import { BADGES } from '@/data/badges';
import { GUIDES, guideById, isGuideComplete } from '@/data/guides';
import { LESSONS } from '@/data/lessons';
import { UNITS, type PathNode, type Unit } from '@/data/path';
import { slotsInGeneration } from '@/lib/slots';
import { useFamily } from '@/store/family';
import { useGame, type Counter } from '@/store/game';

export type NodeStatus = 'done' | 'active' | 'locked';

export interface NodeState {
  node: PathNode;
  status: NodeStatus;
  /** 0..1 progress for multi-slot nodes. */
  progress: number;
}

interface Snapshot {
  filledSlots: Set<number>;
  docCount: number;
  completedLessons: string[];
  guideChecks: Record<string, boolean>;
  openedChests: string[];
}

function nodeDone(node: PathNode, s: Snapshot, unitNodesDone: boolean): [boolean, number] {
  switch (node.kind) {
    case 'slot': {
      const filled = node.slots.filter((x) => s.filledSlots.has(x)).length;
      return [filled === node.slots.length, filled / node.slots.length];
    }
    case 'lesson':
      return [s.completedLessons.includes(node.lessonId), 0];
    case 'guide': {
      const g = guideById(node.guideId);
      return [g ? isGuideComplete(g, s.guideChecks) : false, 0];
    }
    case 'scan':
      return [s.docCount >= node.count, Math.min(1, s.docCount / node.count)];
    case 'chest':
      return [unitNodesDone && s.openedChests.includes(node.id), 0];
  }
}

export function computePath(s: Snapshot): { unit: Unit; nodes: NodeState[] }[] {
  let activeAssigned = false;
  return UNITS.map((unit) => {
    const results: NodeState[] = [];
    let unitNodesDone = true;
    for (const node of unit.nodes) {
      const [done, progress] = nodeDone(node, s, unitNodesDone);
      if (node.kind !== 'chest' && !done) unitNodesDone = false;
      let status: NodeStatus;
      if (done) status = 'done';
      else if (!activeAssigned && (node.kind !== 'chest' || unitNodesDone)) {
        status = 'active';
        activeAssigned = true;
      } else status = 'locked';
      results.push({ node, status, progress });
    }
    return { unit, nodes: results };
  });
}

export function usePathState() {
  const persons = useFamily((s) => s.persons);
  const docCount = useFamily((s) => s.documents.length);
  const completedLessons = useGame((s) => s.completedLessons);
  const guideChecks = useGame((s) => s.guideChecks);
  const openedChests = useGame((s) => s.openedChests);

  return useMemo(() => {
    const filledSlots = new Set(Object.values(persons).map((p) => p.slot));
    return computePath({ filledSlots, docCount, completedLessons, guideChecks, openedChests });
  }, [persons, docCount, completedLessons, guideChecks, openedChests]);
}

/** Badges whose conditions are currently satisfied. */
export function earnedBadgeIds(): string[] {
  const { persons, documents } = useFamily.getState();
  const game = useGame.getState();
  const filled = new Set(Object.values(persons).map((p) => p.slot));
  const has = (slots: number[]) => slots.every((s) => filled.has(s));
  const out: string[] = [];
  if (filled.has(1)) out.push('first-step');
  if (has([2, 3])) out.push('parents');
  if (has(slotsInGeneration(2))) out.push('grandparents');
  if (has(slotsInGeneration(3))) out.push('great-grandparents');
  if (slotsInGeneration(4).some((s) => filled.has(s))) out.push('deep-roots');
  if (documents.length >= 1) out.push('first-scan');
  if (documents.length >= 5) out.push('archivist');
  if (LESSONS.every((l) => game.completedLessons.includes(l.id))) out.push('scholar');
  if (GUIDES.some((g) => isGuideComplete(g, game.guideChecks))) out.push('navigator');
  if (game.streak >= 3) out.push('streak-3');
  if (game.streak >= 7) out.push('streak-7');
  return out.filter((id) => BADGES.some((b) => b.id === id));
}

/**
 * Award XP and attach any badges that became earned.
 * Call after the underlying state (persons, lessons, …) has been updated.
 */
export function awardProgress(xp: number, title: string, counter?: Counter, celebrate = true) {
  const game = useGame.getState();
  game.award(xp, title, { counter, celebrate });
  // Streak badges depend on the streak that award() just updated, so evaluate afterwards.
  const fresh = useGame.getState().unlockBadges(earnedBadgeIds());
  if (fresh.length && celebrate) {
    const reward = useGame.getState().pendingReward;
    if (reward) useGame.setState({ pendingReward: { ...reward, badges: [...reward.badges, ...fresh] } });
  }
}

/** Daily quests (reset every day). */
export interface Quest {
  id: string;
  title: string;
  icon: IconName;
  target: (s: ReturnType<typeof useGame.getState>) => number;
  xp: number;
  current: (s: ReturnType<typeof useGame.getState>) => number;
}

export const DAILY_QUESTS: Quest[] = [
  { id: 'xp', title: 'デイリー目標のXPを獲得', icon: 'bolt', target: (s) => s.dailyGoal, xp: 10, current: (s) => s.todayXp },
  { id: 'person', title: '家系図の空欄を1つ埋める', icon: 'tree', target: () => 1, xp: 15, current: (s) => s.todayCounters.personsFilled },
  { id: 'lesson', title: 'レッスンかガイドを2つ進める', icon: 'books', target: () => 2, xp: 10, current: (s) => s.todayCounters.lessons + s.todayCounters.guideSteps },
];
