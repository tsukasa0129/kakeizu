import ExpoModulesCore
import StoreKit

/// Bridges StoreKit's ExternalPurchaseCustomLink so the paywall can offer Stripe next to
/// In-App Purchase on the Japan storefront. Every call fails closed (false / nil) when the
/// entitlement is missing, the storefront isn't eligible, or the OS is too old.
public class ExternalPurchaseModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExternalPurchase")

    AsyncFunction("isEligibleAsync") { () async -> Bool in
      // Apple enables alternative payments in Japan from iOS 26.2.
      guard #available(iOS 26.2, *) else { return false }
      guard AppStore.canMakePayments else { return false }
      return await ExternalPurchaseCustomLink.isEligible
    }

    /// External purchase token ("IN_APP" / "LINK_OUT" in Japan) to report to Apple with the
    /// resulting transaction. Required before every potential transaction from iOS 26.4.
    AsyncFunction("tokenAsync") { (tokenType: String) async -> String? in
      guard #available(iOS 26.4, *) else { return nil }
      return try? await ExternalPurchaseCustomLink.token(for: tokenType)?.value
    }
  }
}
