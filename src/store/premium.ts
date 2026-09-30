import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from '@/lib/storage';

interface PremiumState {
  /** Cached entitlement; refreshed from RevenueCat on launch and on every CustomerInfo update. */
  isPremium: boolean;
  setPremium: (v: boolean) => void;
  /**
   * Test builds only (see PAYWALL_TEST_BYPASS): lets a tester past the paywall when the store
   * can't serve products. Kept separate so entitlement syncs don't overwrite it.
   */
  testUnlocked: boolean;
  setTestUnlocked: (v: boolean) => void;
}

export const usePremium = create<PremiumState>()(
  persist(
    (set) => ({
      isPremium: false,
      setPremium: (isPremium) => set({ isPremium }),
      testUnlocked: false,
      setTestUnlocked: (testUnlocked) => set({ testUnlocked }),
    }),
    { name: 'kakeizu-premium', storage: persistStorage },
  ),
);
