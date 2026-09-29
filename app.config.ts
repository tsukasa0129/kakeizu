import type { ConfigContext, ExpoConfig } from 'expo/config';

// Stripe next to In-App Purchase (Japan storefront) needs Apple's
// "StoreKit External Purchases or Offers" entitlement. Provisioning fails until Apple grants it,
// so it is only added when the build sets IOS_EXTERNAL_PURCHASE=1 (see eas.json / README).
const externalPurchase = process.env.IOS_EXTERNAL_PURCHASE === '1';

export default ({ config }: ConfigContext): ExpoConfig => {
  if (!externalPurchase) return config as ExpoConfig;
  return {
    ...config,
    ios: {
      ...config.ios,
      entitlements: {
        ...config.ios?.entitlements,
        'com.apple.developer.storekit.custom-purchase-link.allowed-regions': ['jp'],
      },
    },
  } as ExpoConfig;
};
