import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  WebPurchaseRedemptionResultType,
  type CustomerInfo,
  type MakePurchaseResult,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

import { usePremium } from '@/store/premium';

/** Entitlement identifier configured in the RevenueCat dashboard. */
export const ENTITLEMENT_ID = 'premium';
/** Offering served by the web2app funnel (`/start`). Falls back to the current offering if missing. */
export const FUNNEL_OFFERING_ID = 'web_funnel';
/** Free users can run this many AI document scans. */
export const FREE_SCAN_LIMIT = 3;

const storeKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});
// RevenueCat Test Store: simulated purchases without store accounts.
// Set only for the development/preview EAS profiles (and local .env), never for production.
const nativeKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY || storeKey;
// Web uses RevenueCat Web Billing (Stripe). `rcb_sb_` keys hit the Stripe sandbox, `rcb_` keys charge for real.
const apiKey = Platform.OS === 'web' ? process.env.EXPO_PUBLIC_REVENUECAT_WEB_KEY : nativeKey;

let configured = false;
let initPromise: Promise<void> | null = null;

export const purchasesAvailable = () => configured;

const hasPremium = (info: CustomerInfo) => info.entitlements.active[ENTITLEMENT_ID] !== undefined;

const syncEntitlement = (info: CustomerInfo) => {
  usePremium.getState().setPremium(hasPremium(info));
};

/** Idempotent; screens that need the SDK before the root layout finishes can await it. */
export function initPurchases(): Promise<void> {
  initPromise ??= (async () => {
    if (!apiKey) return;
    try {
      if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.WARN);
      Purchases.configure({ apiKey });
      configured = true;
      Purchases.addCustomerInfoUpdateListener(syncEntitlement);
      syncEntitlement(await Purchases.getCustomerInfo());
    } catch (e) {
      console.warn('RevenueCat init failed', e);
    }
  })();
  return initPromise;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function getFunnelOffering(): Promise<PurchasesOffering | null> {
  await initPurchases();
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.all[FUNNEL_OFFERING_ID] ?? offerings.current;
}

export type PurchaseOutcome = 'purchased' | 'cancelled' | 'failed';

/**
 * Web Billing returns a Redemption Link for anonymous web buyers. Opening it in the app transfers the
 * purchase to the app's user (see `redeemWebPurchaseLink`). Not part of the RN typings, so read it loosely.
 */
export interface RedemptionInfo {
  redeemUrl: string | null;
  redeemUrlRedirect?: string | null;
}

async function purchasePackage(pkg: PurchasesPackage) {
  try {
    const result: MakePurchaseResult & { redemptionInfo?: RedemptionInfo | null } =
      await Purchases.purchasePackage(pkg);
    syncEntitlement(result.customerInfo);
    return {
      outcome: (hasPremium(result.customerInfo) ? 'purchased' : 'failed') as PurchaseOutcome,
      redemptionInfo: result.redemptionInfo ?? null,
    };
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled)
      return { outcome: 'cancelled' as const, redemptionInfo: null };
    console.warn('purchase failed', e);
    return { outcome: 'failed' as const, redemptionInfo: null };
  }
}

export async function purchase(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  return (await purchasePackage(pkg)).outcome;
}

/** Web funnel checkout (Stripe via Web Billing). */
export const purchaseOnWeb = purchasePackage;

/** Stores funnel answers / UTM params on the RevenueCat customer for attribution. */
export async function setFunnelAttributes(attributes: Record<string, string | null>) {
  if (!configured) return;
  await Purchases.setAttributes(attributes).catch((e) => console.warn('setAttributes', e));
}

/** Web Billing (Stripe) subscriptions are managed from RevenueCat's hosted page, not a store account. */
export async function getManagementURL(): Promise<string | null> {
  if (!configured) return null;
  const info = await Purchases.getCustomerInfo();
  return info.managementURL;
}

export async function restore(): Promise<boolean> {
  if (!configured) return false;
  const info = await Purchases.restorePurchases();
  syncEntitlement(info);
  return hasPremium(info);
}

export type RedeemOutcome =
  | { kind: 'success' }
  | { kind: 'expired'; obfuscatedEmail: string }
  | { kind: 'invalid' }
  | { kind: 'otherUser' }
  | { kind: 'error' };

/** Native only: grants the web purchase behind a Redemption Link to the current app user. */
export async function redeemWebPurchaseLink(url: string): Promise<RedeemOutcome> {
  await initPurchases();
  if (!configured) return { kind: 'error' };
  try {
    const redemption = await Purchases.parseAsWebPurchaseRedemption(url);
    if (!redemption) return { kind: 'invalid' };
    const result = await Purchases.redeemWebPurchase(redemption);
    switch (result.result) {
      case WebPurchaseRedemptionResultType.SUCCESS:
        syncEntitlement(result.customerInfo);
        return { kind: 'success' };
      case WebPurchaseRedemptionResultType.EXPIRED:
        return { kind: 'expired', obfuscatedEmail: result.obfuscatedEmail };
      case WebPurchaseRedemptionResultType.INVALID_TOKEN:
        return { kind: 'invalid' };
      case WebPurchaseRedemptionResultType.PURCHASE_BELONGS_TO_OTHER_USER:
        return { kind: 'otherUser' };
      default:
        console.warn('redeemWebPurchase', result.error);
        return { kind: 'error' };
    }
  } catch (e) {
    console.warn('redeemWebPurchase failed', e);
    return { kind: 'error' };
  }
}
