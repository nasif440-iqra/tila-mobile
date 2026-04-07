import { createContext } from "react";
import type { PaywallTrigger, PaywallOutcome } from "./paywall";

// ── Types ──

export type SubscriptionStage = "free" | "trial" | "paid" | "expired" | "unknown";

export interface SubscriptionState {
  customerInfo: null;
  isPremiumActive: boolean;
  stage: SubscriptionStage;
  trialDaysRemaining: number | null;
  managementURL: string | null;
  lastSyncedAt: Date | null;
  loading: boolean;
  showPaywall: (trigger: PaywallTrigger) => Promise<PaywallOutcome>;
  refresh: () => Promise<void>;
}

// ── Beta stub ──
// RevenueCat is disabled during beta testing.
// All content is unlocked. No Purchases API calls are made.
// To re-enable: restore this file from git (pre-beta version).

const betaState: SubscriptionState = {
  customerInfo: null,
  isPremiumActive: true,
  stage: "free",
  trialDaysRemaining: null,
  managementURL: null,
  lastSyncedAt: null,
  loading: false,
  showPaywall: async () => ({ result: "not_presented" as const, accessGranted: false }),
  refresh: async () => {},
};

export const SubscriptionContext = createContext<SubscriptionState>(betaState);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionContext.Provider value={betaState}>
      {children}
    </SubscriptionContext.Provider>
  );
}
