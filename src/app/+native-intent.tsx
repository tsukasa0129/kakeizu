import { isRedemptionLink, setPendingRedemptionLink } from '@/lib/webRedemption';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (isRedemptionLink(path)) {
      setPendingRedemptionLink(path);
      return '/redeem';
    }
  } catch (e) {
    console.warn('native intent', e);
  }
  return path;
}
