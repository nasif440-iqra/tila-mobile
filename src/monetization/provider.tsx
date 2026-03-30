import { createContext, useEffect, useState, useCallback, useRef } from "react";
import Purchases from "react-native-purchases";
import type { CustomerInfo } from "react-native-purchases";
import { presentPaywall, type PaywallTrigger, type PaywallOutcome } from "./paywall";
import { trackEntitlementChanged } from "./analytics";

// ── Types ──

export type SubscriptionStage = "free" | "trial" | "paid" | "expired" | "unknown";

export interface SubscriptionState {
  customerInfo: CustomerInfo | null;
  isPremiumActive: boolean;
  stage: SubscriptionStage;
  trialDaysRemaining: number | null;
  managementURL: string | null;
  lastSyncedAt: Date | null;
  loading: boolean;
  showPaywall: (trigger: PaywallTrigger) => Promise<PaywallOutcome>;
  refresh: () => Promise<void>;
}

// ── Helpers ──

const PREMIUM_ENTITLEMENT = "premium";

function deriveStage(info: CustomerInfo | null): SubscriptionStage {
  if (!info) return "unknown";

  const entitlement = info.entitlements.active[PREMIUM_ENTITLEMENT];
  if (!entitlement) {
    const allEntitlements = info.entitlements.all[PREMIUM_ENTITLEMENT];
    if (allEntitlements && !allEntitlements.isActive) {
      return "expired";
    }
    return "free";
  }

  if (entitlement.periodType === "TRIAL") {
    return "trial";
  }
  return "paid";
}

function deriveTrialDays(info: CustomerInfo | null): number | null {
  if (!info) return null;
  const entitlement = info.entitlements.active[PREMIUM_ENTITLEMENT];
  if (!entitlement || entitlement.periodType !== "TRIAL") return null;
  if (!entitlement.expirationDate) return null;

  const expiry = new Date(entitlement.expirationDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

// ── Context ──

const defaultState: SubscriptionState = {
  customerInfo: null,
  isPremiumActive: false,
  stage: "unknown",
  trialDaysRemaining: null,
  managementURL: null,
  lastSyncedAt: null,
  loading: true,
  showPaywall: async () => ({ result: "not_presented" as const, accessGranted: false }),
  refresh: async () => {},
};

export const SubscriptionContext = createContext<SubscriptionState>(defaultState);

// ── Provider ──

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const prevStageRef = useRef<SubscriptionStage>("unknown");

  const updateFromInfo = useCallback((info: CustomerInfo) => {
    const newStage = deriveStage(info);
    const oldStage = prevStageRef.current;

    if (oldStage !== "unknown" && oldStage !== newStage) {
      trackEntitlementChanged({ old_stage: oldStage, new_stage: newStage });
    }
    prevStageRef.current = newStage;

    setCustomerInfo(info);
    setLastSyncedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    Purchases.getCustomerInfo()
      .then((info) => {
        if (mounted) updateFromInfo(info);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const onUpdate = (info: CustomerInfo) => {
      if (mounted) updateFromInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(onUpdate);

    return () => {
      mounted = false;
      Purchases.removeCustomerInfoUpdateListener(onUpdate);
    };
  }, [updateFromInfo]);

  const refresh = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      updateFromInfo(info);
    } catch {
      // Offline — keep current state
    }
  }, [updateFromInfo]);

  const showPaywallFn = useCallback(
    async (trigger: PaywallTrigger): Promise<PaywallOutcome> => {
      const outcome = await presentPaywall(trigger);
      if (outcome.accessGranted) {
        await refresh();
      }
      return outcome;
    },
    [refresh]
  );

  const stage = deriveStage(customerInfo);
  const isPremiumActive = stage === "trial" || stage === "paid";

  const value: SubscriptionState = {
    customerInfo,
    isPremiumActive,
    stage,
    trialDaysRemaining: deriveTrialDays(customerInfo),
    managementURL: customerInfo?.managementURL ?? null,
    lastSyncedAt,
    loading,
    showPaywall: showPaywallFn,
    refresh,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
