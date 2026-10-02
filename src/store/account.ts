import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from '@/lib/storage';

export interface AccountUser {
  id: string;
  email: string;
}

interface AccountState {
  /** Bearer token for the API; null when signed out. */
  token: string | null;
  user: AccountUser | null;
  /** Server version of the cloud copy this device last saw (0 = nothing saved yet). */
  syncedVersion: number;
  /** Local changes not yet saved to the cloud. */
  dirty: boolean;
  lastSyncedAt: number | null;
  /** Not persisted: whether the last sync attempt failed. */
  syncError: boolean;
}

export const signedOut: AccountState = { token: null, user: null, syncedVersion: 0, dirty: false, lastSyncedAt: null, syncError: false };

export const useAccount = create<AccountState>()(
  persist((): AccountState => ({ ...signedOut }), {
    name: 'kakeizu-account',
    storage: persistStorage,
    partialize: ({ syncError: _e, ...rest }) => rest,
  }),
);
