/**
 * Integration test: Restore purchases flow.
 *
 * Tests the RevenueCat restore purchases pipeline: successful restore
 * updates subscription state, no purchases returns appropriate status,
 * and failures are handled gracefully.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Types matching src/monetization/provider.tsx ──

type SubscriptionStage = 'free' | 'trial' | 'paid' | 'expired' | 'unknown';

interface CustomerInfo {
  entitlements: {
    active: Record<string, { isActive: boolean; periodType?: string; expirationDate?: string }>;
    all: Record<string, { isActive: boolean }>;
  };
  managementURL: string | null;
}

interface RestoreResult {
  success: boolean;
  message: string;
  customerInfo: CustomerInfo | null;
}

// ── Subscription state derivation (mirrors provider.tsx) ──

const PREMIUM_ENTITLEMENT = 'premium';

function deriveStage(info: CustomerInfo | null): SubscriptionStage {
  if (!info) return 'unknown';
  const entitlement = info.entitlements.active[PREMIUM_ENTITLEMENT];
  if (!entitlement) {
    const allEntitlements = info.entitlements.all[PREMIUM_ENTITLEMENT];
    if (allEntitlements && !allEntitlements.isActive) return 'expired';
    return 'free';
  }
  if (entitlement.periodType === 'TRIAL') return 'trial';
  return 'paid';
}

// ── Mock Purchases (mirrors react-native-purchases) ──

function createMockPurchases() {
  let customerInfo: CustomerInfo = {
    entitlements: { active: {}, all: {} },
    managementURL: null,
  };

  return {
    setCustomerInfo(info: CustomerInfo) {
      customerInfo = info;
    },
    getCustomerInfo: vi.fn(async () => customerInfo),
    restorePurchases: vi.fn(async (): Promise<CustomerInfo> => {
      return customerInfo;
    }),
  };
}

// ── Restore logic ──

async function restorePurchases(
  purchases: ReturnType<typeof createMockPurchases>,
): Promise<RestoreResult> {
  try {
    const info = await purchases.restorePurchases();
    const stage = deriveStage(info);

    if (stage === 'paid' || stage === 'trial') {
      return {
        success: true,
        message: 'Subscription restored successfully',
        customerInfo: info,
      };
    }

    return {
      success: false,
      message: 'No active purchases found',
      customerInfo: info,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Restore failed',
      customerInfo: null,
    };
  }
}

// ── Tests ──

describe('Restore purchases integration', () => {
  let purchases: ReturnType<typeof createMockPurchases>;

  beforeEach(() => {
    purchases = createMockPurchases();
  });

  it('restore with active subscription updates isPremiumActive', async () => {
    purchases.setCustomerInfo({
      entitlements: {
        active: {
          premium: { isActive: true, periodType: 'NORMAL' },
        },
        all: {
          premium: { isActive: true },
        },
      },
      managementURL: 'https://apps.apple.com/account/subscriptions',
    });

    const result = await restorePurchases(purchases);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Subscription restored successfully');
    expect(result.customerInfo).toBeDefined();

    const stage = deriveStage(result.customerInfo);
    const isPremiumActive = stage === 'trial' || stage === 'paid';
    expect(isPremiumActive).toBe(true);
    expect(purchases.restorePurchases).toHaveBeenCalledTimes(1);
  });

  it('restore with no purchases shows appropriate message', async () => {
    // Default state: no active entitlements
    purchases.setCustomerInfo({
      entitlements: { active: {}, all: {} },
      managementURL: null,
    });

    const result = await restorePurchases(purchases);

    expect(result.success).toBe(false);
    expect(result.message).toBe('No active purchases found');
    expect(result.customerInfo).toBeDefined();
    expect(purchases.restorePurchases).toHaveBeenCalledTimes(1);
  });

  it('restore failure shows error message', async () => {
    purchases.restorePurchases.mockRejectedValueOnce(
      new Error('Network request failed'),
    );

    const result = await restorePurchases(purchases);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Network request failed');
    expect(result.customerInfo).toBeNull();
  });

  it('restore refreshes subscription state from RevenueCat', async () => {
    // Start with expired subscription
    purchases.setCustomerInfo({
      entitlements: {
        active: {},
        all: { premium: { isActive: false } },
      },
      managementURL: null,
    });

    const expiredResult = await restorePurchases(purchases);
    expect(expiredResult.success).toBe(false);

    const expiredStage = deriveStage(expiredResult.customerInfo);
    expect(expiredStage).toBe('expired');

    // Now user renews — simulate RestorePurchases returning updated info
    purchases.setCustomerInfo({
      entitlements: {
        active: { premium: { isActive: true, periodType: 'NORMAL' } },
        all: { premium: { isActive: true } },
      },
      managementURL: 'https://apps.apple.com/account/subscriptions',
    });

    const renewedResult = await restorePurchases(purchases);
    expect(renewedResult.success).toBe(true);

    const renewedStage = deriveStage(renewedResult.customerInfo);
    expect(renewedStage).toBe('paid');
    expect(purchases.restorePurchases).toHaveBeenCalledTimes(2);
  });
});
