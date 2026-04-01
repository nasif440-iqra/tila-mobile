import { track } from "../analytics";
import type {
  PaywallShownProps,
  PaywallResultProps,
  PurchaseCompletedProps,
  PurchaseFailedProps,
  RestoreCompletedProps,
  RestoreFailedProps,
  EntitlementChangedProps,
} from "../analytics/events";

export function trackPaywallShown(props: PaywallShownProps): void {
  track("paywall_shown", props);
}

export function trackPaywallResult(props: PaywallResultProps): void {
  track("paywall_result", props);
}

export function trackPurchaseCompleted(props: PurchaseCompletedProps): void {
  track("purchase_completed", props);
}

export function trackPurchaseFailed(props: PurchaseFailedProps): void {
  track("purchase_failed", props);
}

export function trackRestoreCompleted(props: RestoreCompletedProps): void {
  track("restore_completed", props);
}

export function trackRestoreFailed(props: RestoreFailedProps): void {
  track("restore_failed", props);
}

export function trackEntitlementChanged(props: EntitlementChangedProps): void {
  track("entitlement_changed", props);
}

export function trackScholarshipTapped(trigger: string): void {
  track("scholarship_link_tapped", { trigger });
}
