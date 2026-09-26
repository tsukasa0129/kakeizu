import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

import { usePremium } from '@/store/premium';

/** Entitlement identifier configured in the RevenueCat dashboard. */
export const ENTITLEMENT_ID = 'premium';
/** Free users can run this many AI document scans. */
export const FREE_SCAN_LIMIT = 3;

const apiKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

let configured = false;

export const purchasesAvailable = () => configured;

const syncEntitlement = (info: CustomerInfo) => {
  usePremium.getState().setPremium(info.entitlements.active[ENTITLEMENT_ID] !== undefined);
};

export async function initPurchases() {
  if (configured || !apiKey || Platform.OS === 'web') return;
  try {
    if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey });
    configured = true;
    Purchases.addCustomerInfoUpdateListener(syncEntitlement);
    syncEntitlement(await Purchases.getCustomerInfo());
  } catch (e) {
    console.warn('RevenueCat init failed', e);
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

export async function restore(): Promise<boolean> {
  if (!configured) return false;
  const info = await Purchases.restorePurchases();
  syncEntitlement(info);
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}
