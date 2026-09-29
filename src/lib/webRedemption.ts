/**
 * RevenueCat Redemption Links look like `<scheme>://redeem_web_purchase?redemption_link=...`.
 * Expo Router would treat that as an unknown route, so `+native-intent` hands the full URL over here
 * and redirects to `/redeem`, which redeems and then clears it.
 */
const REDEEM_HOST = 'redeem_web_purchase';

let pendingLink: string | null = null;

export function isRedemptionLink(url: string) {
  return url.includes(REDEEM_HOST) && url.includes('redemption_link=');
}

export function setPendingRedemptionLink(url: string) {
  // The native parser needs a full URL; Expo Router may pass a bare path for some launches.
  pendingLink = url.includes('://') ? url : `kakeizu://${url.replace(/^\/+/, '')}`;
}

export const getPendingRedemptionLink = () => pendingLink;

export function clearPendingRedemptionLink() {
  pendingLink = null;
}
