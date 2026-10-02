// Keeps the family tree and progress in the cloud (api/ on Cloudflare D1) while signed in.
// The device stays the source of truth for the UI: changes are saved locally at once and pushed a moment
// later. Every save carries the version it was based on, so when another device saved first the two
// copies are merged (see cloudData.ts) instead of one overwriting the other.
import { AppState } from 'react-native';

import { api, ApiError } from '@/lib/api';
import { isPristine, mergeCloudData, type CloudData } from '@/lib/cloudData';
import { linkPurchases, unlinkPurchases } from '@/lib/purchases';
import { signedOut, useAccount, type AccountUser } from '@/store/account';
import { useFamily } from '@/store/family';
import { useGame } from '@/store/game';

interface Remote {
  data: CloudData | null;
  version: number;
}

const PUSH_DELAY_MS = 2000;

/** True while the stores are being written from the cloud, so those writes aren't pushed back. */
let applying = false;
/** Bumped on every local change; tells whether something changed while a push was in flight. */
let changeSeq = 0;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let queue: Promise<void> = Promise.resolve();

function snapshot(): CloudData {
  const { persons, documents, leads } = useFamily.getState();
  // JSON round trip drops the store's action functions.
  const { pendingReward: _reward, ...game } = JSON.parse(JSON.stringify(useGame.getState()));
  return { schema: 1, family: { persons, documents, leads }, game };
}

function applyData(data: CloudData) {
  applying = true;
  try {
    useFamily.setState({
      persons: data.family?.persons ?? {},
      documents: data.family?.documents ?? [],
      leads: data.family?.leads ?? [],
    });
    if (data.game) useGame.setState(data.game);
    useGame.getState().rollDay();
  } finally {
    applying = false;
  }
}

function onLocalChange() {
  if (applying || !useAccount.getState().token) return;
  changeSeq++;
  if (!useAccount.getState().dirty) useAccount.setState({ dirty: true });
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void syncNow();
  }, PUSH_DELAY_MS);
}

async function runSync() {
  const { token } = useAccount.getState();
  if (!token) return;
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const { dirty, syncedVersion } = useAccount.getState();
      if (!dirty) {
        const remote = await api<Remote>('/me/data', { token });
        if (remote.data && remote.version !== syncedVersion) applyData(remote.data);
        // The cloud copy is gone (or was never saved): upload this device's copy.
        if (!remote.data && syncedVersion !== 0) {
          useAccount.setState({ syncedVersion: 0, dirty: true });
          continue;
        }
        useAccount.setState({ syncedVersion: remote.version });
        break;
      }

      const seq = changeSeq;
      try {
        const saved = await api<{ version: number }>('/me/data', {
          method: 'PUT',
          token,
          body: { data: snapshot(), baseVersion: syncedVersion },
        });
        const stillDirty = changeSeq !== seq;
        useAccount.setState({ syncedVersion: saved.version, dirty: stillDirty });
        if (!stillDirty) break;
      } catch (e) {
        if (!(e instanceof ApiError) || e.status !== 409 || !e.body) throw e;
        // Another device saved first: merge its copy into ours, then save the result on top of it.
        const remote = e.body as unknown as Remote;
        if (remote.data) applyData(mergeCloudData(snapshot(), remote.data));
        useAccount.setState({ syncedVersion: remote.version });
      }
    }
    useAccount.setState({ lastSyncedAt: Date.now(), syncError: false });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      // Signed out elsewhere (or the account was deleted). Keep the data on this device.
      useAccount.setState({ ...signedOut });
      return;
    }
    console.warn('sync failed', e);
    useAccount.setState({ syncError: true });
  }
}

/** Pulls the cloud copy and pushes pending changes. Calls run one at a time. */
export function syncNow(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  queue = queue.then(runSync, runSync);
  return queue;
}

let started = false;

/** Call once the stores have hydrated. */
export function startSync() {
  if (started) return;
  started = true;
  useFamily.subscribe(onLocalChange);
  useGame.subscribe((s, prev) => {
    // The celebration queue isn't synced; ignore changes that only touch it.
    const keys = Object.keys(s) as (keyof typeof s)[];
    if (keys.some((k) => k !== 'pendingReward' && s[k] !== prev[k])) onLocalChange();
  });
  AppState.addEventListener('change', (state) => {
    // Coming back: fetch what other devices saved. Leaving: save now rather than in 2 seconds.
    if (state === 'active' || (state === 'background' && useAccount.getState().dirty)) void syncNow();
  });
  void syncNow();
}

export const requestLoginCode = (email: string) => api('/auth/code', { method: 'POST', body: { email } });

/**
 * Signs in with the emailed code. A fresh device takes the cloud copy as is; a device that already has
 * its own progress merges it with the cloud copy. Purchases move onto the account as well.
 */
export async function signIn(email: string, code: string) {
  const { token, user } = await api<{ token: string; user: AccountUser }>('/auth/verify', {
    method: 'POST',
    body: { email, code },
  });
  const remote = await api<Remote>('/me/data', { token });
  const local = snapshot();
  let dirty = !isPristine(local);
  if (remote.data) {
    applyData(dirty ? mergeCloudData(local, remote.data) : remote.data);
  }
  useAccount.setState({ token, user, syncedVersion: remote.version, dirty, lastSyncedAt: Date.now(), syncError: false });
  // Not awaited: the entitlement arrives through the CustomerInfo listener, and a slow store must not
  // hold up the sign-in screen.
  void linkPurchases(user.id);
  if (dirty) void syncNow();
}

async function clearDevice() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  useAccount.setState({ ...signedOut });
  applying = true;
  try {
    useFamily.getState().reset();
    useGame.getState().reset();
  } finally {
    applying = false;
  }
  await unlinkPurchases();
}

/** Saves pending changes, then signs out and clears this device (the data stays in the cloud). */
export async function signOut() {
  await syncNow();
  const { token, dirty } = useAccount.getState();
  if (token && dirty) {
    throw new Error('まだクラウドに保存できていない変更があります。インターネットにつながる場所でもう一度お試しください');
  }
  if (token) await api('/auth/logout', { method: 'POST', token }).catch(() => {});
  await clearDevice();
}

/** Deletes the account and everything saved in the cloud, and clears this device. */
export async function deleteAccount() {
  const { token } = useAccount.getState();
  if (!token) throw new Error('ログインの有効期限が切れています。もう一度ログインしてからお試しください');
  await api('/me', { method: 'DELETE', token });
  await clearDevice();
}
