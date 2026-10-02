import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  WebPurchaseRedemptionResultType,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

import { useAccount } from '@/store/account';
import { usePremium } from '@/store/premium';
import { ExternalPurchase } from '../../modules/external-purchase';

/** Entitlement identifier configured in the RevenueCat dashboard. */
export const ENTITLEMENT_ID = 'premium';

const storeKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});
// RevenueCat Test Store: simulated purchases without store accounts. The SDK refuses test keys in
// release builds (it shows "Wrong API Key" and closes the app), so only debug builds may use it.
const testKey = __DEV__ ? process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY : undefined;
const nativeKey = testKey || storeKey;
// Web uses RevenueCat Web Billing (Stripe). `rcb_sb_` keys hit the Stripe sandbox, `rcb_` keys charge for real.
const apiKey = Platform.OS === 'web' ? process.env.EXPO_PUBLIC_REVENUECAT_WEB_KEY : nativeKey;

let configured = false;
let initializing: Promise<void> | null = null;

export const purchasesAvailable = () => configured;

const syncEntitlement = (info: CustomerInfo) => {
  usePremium.getState().setPremium(info.entitlements.active[ENTITLEMENT_ID] !== undefined);
};

/** Safe to call from several places; every caller waits for the same setup. */
export function initPurchases(): Promise<void> {
  initializing ??= (async () => {
    if (!apiKey) return;
    try {
      if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.WARN);
      // Signed-in users use their account ID, so a purchase follows them to other devices and the web.
      Purchases.configure({ apiKey, appUserID: useAccount.getState().user?.id ?? null });
      configured = true;
      Purchases.addCustomerInfoUpdateListener(syncEntitlement);
      syncEntitlement(await Purchases.getCustomerInfo());
    } catch (e) {
      console.warn('RevenueCat init failed', e);
    }
  })();
  return initializing;
}

/** After signing in: moves this device's purchases onto the account, or picks up the account's. */
export async function linkPurchases(userId: string) {
  await initPurchases();
  if (!configured) return;
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    syncEntitlement(customerInfo);
  } catch (e) {
    console.warn('RevenueCat logIn failed', e);
  }
}

/** After signing out: back to an anonymous user (a store subscription can be restored again). */
export async function unlinkPurchases() {
  if (!configured) return;
  try {
    if (!(await Purchases.isAnonymous())) syncEntitlement(await Purchases.logOut());
  } catch (e) {
    console.warn('RevenueCat logOut failed', e);
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export type PurchaseOutcome = 'purchased' | 'cancelled' | 'failed';

export async function purchase(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    syncEntitlement(customerInfo);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] ? 'purchased' : 'failed';
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return 'cancelled';
    console.warn('purchase failed', e);
    return 'failed';
  }
}

// RevenueCat Web Purchase Link for the `default` offering (Web Billing / Stripe), e.g. https://pay.rev.cat/<token>
const webPurchaseLink = process.env.EXPO_PUBLIC_REVENUECAT_WEB_PURCHASE_LINK;

/**
 * Whether the paywall may offer Stripe next to In-App Purchase. Only on iOS in Japan, and only
 * once Apple has granted the external purchase entitlement (isEligible is false otherwise).
 */
export async function stripeCheckoutAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !configured || !webPurchaseLink || !ExternalPurchase) return false;
  return ExternalPurchase.isEligibleAsync().catch(() => false);
}

/**
 * Stripe checkout via a RevenueCat Web Purchase Link, opened in an in-app browser.
 * Call only after the user accepted Apple's disclosure sheet.
 */
export async function purchaseWithStripe(): Promise<PurchaseOutcome> {
  if (!configured || !webPurchaseLink || !ExternalPurchase) return 'failed';
  try {
    // Web purchase links attach the purchase to the App User ID in the URL, so switch the
    // anonymous ID to a stable custom one first (logIn keeps existing purchases on this device).
    let appUserID = await Purchases.getAppUserID();
    if (await Purchases.isAnonymous()) {
      appUserID = `kakeizu_${appUserID.replace('$RCAnonymousID:', '')}`;
      await Purchases.logIn(appUserID);
    }
    // Apple requires reporting this token with the resulting transaction (External Purchase Server API).
    const token = await ExternalPurchase.tokenAsync('IN_APP').catch(() => null);
    if (token) {
      Purchases.setAttributes({ apple_external_purchase_token: token, apple_external_purchase_token_at: new Date().toISOString() });
      await Purchases.syncAttributesAndOfferingsIfNeeded().catch(() => {});
    }
    await WebBrowser.openBrowserAsync(`${webPurchaseLink.replace(/\/$/, '')}/${encodeURIComponent(appUserID)}`);
    await Purchases.invalidateCustomerInfoCache();
    const info = await Purchases.getCustomerInfo();
    syncEntitlement(info);
    return info.entitlements.active[ENTITLEMENT_ID] ? 'purchased' : 'cancelled';
  } catch (e) {
    console.warn('stripe purchase failed', e);
    return 'failed';
  }
}

/** Where to cancel or change the plan: App Store settings, Google Play, or RevenueCat's page for Stripe. */
export async function getManagementURL(): Promise<string | null> {
  if (!configured) return null;
  const info = await Purchases.getCustomerInfo();
  return info.managementURL;
}

export async function restore(): Promise<boolean> {
  if (!configured) return false;
  const info = await Purchases.restorePurchases();
  syncEntitlement(info);
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export type RedemptionOutcome =
  | { kind: 'redeemed' }
  | { kind: 'expired'; email: string }
  | { kind: 'invalid' }
  | { kind: 'otherUser' }
  | { kind: 'failed' };

/**
 * web2app funnel: redeems a RevenueCat Redemption Link (rc-xxxx://redeem_web_purchase?redemption_token=…)
 * that the web funnel's success page or the purchase email opened. The web purchase was anonymous,
 * so redeeming moves it onto this device's App User ID and grants `premium`.
 */
export async function redeemWebPurchase(url: string): Promise<RedemptionOutcome> {
  await initPurchases();
  if (!configured || Platform.OS === 'web') return { kind: 'failed' };
  try {
    const redemption = await Purchases.parseAsWebPurchaseRedemption(url);
    if (!redemption) return { kind: 'invalid' };
    const result = await Purchases.redeemWebPurchase(redemption);
    switch (result.result) {
      case WebPurchaseRedemptionResultType.SUCCESS:
        syncEntitlement(result.customerInfo);
        return result.customerInfo.entitlements.active[ENTITLEMENT_ID] ? { kind: 'redeemed' } : { kind: 'failed' };
      case WebPurchaseRedemptionResultType.EXPIRED:
        // RevenueCat has already emailed a fresh link to the purchase's billing address.
        return { kind: 'expired', email: result.obfuscatedEmail };
      case WebPurchaseRedemptionResultType.INVALID_TOKEN:
        return { kind: 'invalid' };
      case WebPurchaseRedemptionResultType.PURCHASE_BELONGS_TO_OTHER_USER:
        return { kind: 'otherUser' };
      default:
        console.warn('web purchase redemption failed', result);
        return { kind: 'failed' };
    }
  } catch (e) {
    console.warn('web purchase redemption failed', e);
    return { kind: 'failed' };
  }
}
