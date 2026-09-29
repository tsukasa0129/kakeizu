import { requireOptionalNativeModule } from 'expo';

interface ExternalPurchaseNative {
  isEligibleAsync(): Promise<boolean>;
  tokenAsync(tokenType: 'IN_APP' | 'LINK_OUT'): Promise<string | null>;
}

/** iOS-only StoreKit bridge; null on Android, web, Expo Go, and builds without the module. */
export const ExternalPurchase = requireOptionalNativeModule<ExternalPurchaseNative>('ExternalPurchase');
