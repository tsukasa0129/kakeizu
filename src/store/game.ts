import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { dayKey, daysBetween, persistStorage } from '@/lib/storage';

export type Counter = 'personsFilled' | 'lessons' | 'guideSteps' | 'scans';

export interface Reward {
  id: number;
  title: string;
  xp: number;
  badges: string[];
  leveledUp: boolean;
  streak: number;
}

interface GameState {
  onboarded: boolean;
  /** How many generations back the user wants to reach (answered during onboarding). */
  targetGeneration: number;
  xp: number;
  dailyGoal: number;
  streak: number;
  longestStreak: number;
  lastActiveDay: string | null;
  today: string;
  todayXp: number;
  todayCounters: Record<Counter, number>;
  claimedQuests: string[];
  activeDays: string[];
  completedLessons: string[];
  guideChecks: Record<string, boolean>;
  openedChests: string[];
  badges: string[];
  scansUsed: number;
  pendingReward: Reward | null;

  finishOnboarding: (dailyGoal: number, targetGeneration: number) => void;
  /** Adds XP, advances the streak and queues a celebration. */
  award: (xp: number, title: string, opts?: { counter?: Counter; badges?: string[]; celebrate?: boolean }) => void;
  bump: (counter: Counter) => void;
  completeLesson: (id: string) => boolean;
  toggleGuideCheck: (key: string) => boolean;
  claimQuest: (id: string, xp: number) => void;
  openChest: (id: string, xp: number) => void;
  consumeScan: () => void;
  unlockBadges: (ids: string[]) => string[];
  consumeReward: () => void;
  rollDay: () => void;
  reset: () => void;
}

export const levelForXp = (xp: number) => Math.floor(Math.sqrt(xp / 40)) + 1;
export const xpForLevel = (level: number) => (level - 1) ** 2 * 40;

const emptyCounters = (): Record<Counter, number> => ({
  personsFilled: 0,
  lessons: 0,
  guideSteps: 0,
  scans: 0,
});

const initial = {
  onboarded: false,
  targetGeneration: 4,
  xp: 0,
  dailyGoal: 30,
  streak: 0,
  longestStreak: 0,
  lastActiveDay: null as string | null,
  today: dayKey(),
  todayXp: 0,
  todayCounters: emptyCounters(),
  claimedQuests: [] as string[],
  activeDays: [] as string[],
  completedLessons: [] as string[],
  guideChecks: {} as Record<string, boolean>,
  openedChests: [] as string[],
  badges: [] as string[],
  scansUsed: 0,
  pendingReward: null as Reward | null,
};

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initial,

      finishOnboarding: (dailyGoal, targetGeneration) => set({ onboarded: true, dailyGoal, targetGeneration }),

      rollDay: () => {
        const today = dayKey();
        const s = get();
        if (s.today === today) return;
        // Streak breaks if a whole day was skipped.
        const broken = s.lastActiveDay ? daysBetween(s.lastActiveDay, today) > 1 : false;
        set({
          today,
          todayXp: 0,
          todayCounters: emptyCounters(),
          claimedQuests: [],
          streak: broken ? 0 : s.streak,
        });
      },

      award: (xp, title, opts = {}) => {
        get().rollDay();
        const s = get();
        const today = s.today;
        let streak = s.streak;
        if (s.lastActiveDay !== today) {
          const gap = s.lastActiveDay ? daysBetween(s.lastActiveDay, today) : 1;
          streak = gap === 1 ? streak + 1 : 1;
        }
        const newXp = s.xp + xp;
        const leveledUp = levelForXp(newXp) > levelForXp(s.xp);
        const newBadges = opts.badges ? opts.badges.filter((b) => !s.badges.includes(b)) : [];
        const counters = { ...s.todayCounters };
        if (opts.counter) counters[opts.counter] += 1;

        set({
          xp: newXp,
          todayXp: s.todayXp + xp,
          todayCounters: counters,
          streak,
          longestStreak: Math.max(s.longestStreak, streak),
          lastActiveDay: today,
          activeDays: s.activeDays.includes(today) ? s.activeDays : [...s.activeDays, today].slice(-120),
          badges: [...s.badges, ...newBadges],
          pendingReward:
            opts.celebrate === false
              ? s.pendingReward
              : { id: Date.now(), title, xp, badges: newBadges, leveledUp, streak },
        });
      },

      bump: (counter) => {
        get().rollDay();
        set((s) => ({ todayCounters: { ...s.todayCounters, [counter]: s.todayCounters[counter] + 1 } }));
      },

      completeLesson: (id) => {
        if (get().completedLessons.includes(id)) return false;
        set((s) => ({ completedLessons: [...s.completedLessons, id] }));
        return true;
      },

      toggleGuideCheck: (key) => {
        const next = !get().guideChecks[key];
        set((s) => ({ guideChecks: { ...s.guideChecks, [key]: next } }));
        return next;
      },

      claimQuest: (id, xp) => {
        if (get().claimedQuests.includes(id)) return;
        set((s) => ({ claimedQuests: [...s.claimedQuests, id] }));
        get().award(xp, 'クエスト達成！');
      },

      openChest: (id, xp) => {
        if (get().openedChests.includes(id)) return;
        set((s) => ({ openedChests: [...s.openedChests, id] }));
        get().award(xp, '宝箱をあけた！');
      },

      consumeScan: () => set((s) => ({ scansUsed: s.scansUsed + 1 })),

      unlockBadges: (ids) => {
        const fresh = ids.filter((b) => !get().badges.includes(b));
        if (fresh.length) set((s) => ({ badges: [...s.badges, ...fresh] }));
        return fresh;
      },

      consumeReward: () => set({ pendingReward: null }),

      reset: () => set({ ...initial, today: dayKey(), todayCounters: emptyCounters() }),
    }),
    {
      name: 'kakeizu-game',
      storage: persistStorage,
      partialize: ({ pendingReward: _p, ...rest }) => rest,
    },
  ),
);
