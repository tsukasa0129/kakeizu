import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from '@/lib/storage';

interface PremiumState {
  /** Cached entitlement; refreshed from RevenueCat on launch and on every CustomerInfo update. */
  isPremium: boolean;
  setPremium: (v: boolean) => void;
}

export const usePremium = create<PremiumState>()(
  persist(
    (set) => ({
      isPremium: false,
      setPremium: (isPremium) => set({ isPremium }),
    }),
    { name: 'kakeizu-premium', storage: persistStorage },
  ),
);
