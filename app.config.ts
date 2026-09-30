import type { ConfigContext, ExpoConfig } from 'expo/config';

// Stripe next to In-App Purchase (Japan storefront) needs Apple's
// "StoreKit External Purchases or Offers" entitlement. Provisioning fails until Apple grants it,
// so it is only added when the build sets IOS_EXTERNAL_PURCHASE=1 (see eas.json / README).
const externalPurchase = process.env.IOS_EXTERNAL_PURCHASE === '1';

// web2app funnel: RevenueCat Redemption Links use a per-project custom scheme (e.g. rc-1a2b3c4d5e),
// shown in the RevenueCat dashboard under Web → Redemption Links. Registering it lets the link open the app.
const redemptionScheme = process.env.REVENUECAT_REDEMPTION_SCHEME;

export default ({ config }: ConfigContext): ExpoConfig => {
  const schemes = [config.scheme ?? [], redemptionScheme || []].flat();
  return {
    ...config,
    scheme: schemes,
    ios: externalPurchase
      ? {
          ...config.ios,
          entitlements: {
            ...config.ios?.entitlements,
            'com.apple.developer.storekit.custom-purchase-link.allowed-regions': ['jp'],
          },
        }
      : config.ios,
  } as ExpoConfig;
};
