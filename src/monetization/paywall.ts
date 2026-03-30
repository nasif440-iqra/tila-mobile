import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import Purchases from "react-native-purchases";
import { Alert } from "react-native";
import { trackPaywallShown, trackPaywallResult, trackPurchaseCompleted, trackRestoreCompleted } from "./analytics";

export type PaywallTrigger = "lesson_7_summary" | "lesson_locked" | "expired_card" | "home_upsell";

export type PaywallOutcome = {
  result: "purchased" | "restored" | "cancelled" | "error" | "not_presented";
  accessGranted: boolean;
};

export async function presentPaywall(trigger: PaywallTrigger): Promise<PaywallOutcome> {
  trackPaywallShown({ trigger });

  try {
    const paywallResult = await RevenueCatUI.presentPaywall();

    switch (paywallResult) {
      case PAYWALL_RESULT.PURCHASED: {
        trackPaywallResult({ trigger, result: "purchased" });
        // Fetch updated customer info for detailed purchase tracking
        try {
          const info = await Purchases.getCustomerInfo();
          const entitlement = info.entitlements.active["premium"];
          if (entitlement) {
            trackPurchaseCompleted({
              product_id: entitlement.productIdentifier,
              plan: entitlement.productIdentifier.includes("annual") ? "annual" : "monthly",
              is_trial: entitlement.periodType === "TRIAL",
            });
          }
        } catch {
          // Non-critical — paywall result already tracked
        }
        return { result: "purchased", accessGranted: true };
      }

      case PAYWALL_RESULT.RESTORED: {
        trackPaywallResult({ trigger, result: "restored" });
        try {
          const info = await Purchases.getCustomerInfo();
          const activeCount = Object.keys(info.entitlements.active).length;
          trackRestoreCompleted({ success: true, entitlements_restored: activeCount });
        } catch {
          // Non-critical
        }
        return { result: "restored", accessGranted: true };
      }

      case PAYWALL_RESULT.CANCELLED:
        trackPaywallResult({ trigger, result: "cancelled" });
        return { result: "cancelled", accessGranted: false };

      case PAYWALL_RESULT.NOT_PRESENTED:
        return { result: "not_presented", accessGranted: false };

      case PAYWALL_RESULT.ERROR:
      default:
        trackPaywallResult({ trigger, result: "error" });
        return { result: "error", accessGranted: false };
    }
  } catch (e) {
    Alert.alert(
      "Couldn't verify your subscription",
      "Connect to the internet to continue.",
      [{ text: "OK" }]
    );
    trackPaywallResult({ trigger, result: "error" });
    return { result: "error", accessGranted: false };
  }
}
