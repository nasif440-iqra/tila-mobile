# Phase C: Monetization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship paywall and subscription system using RevenueCat, gating lessons 8+ behind premium while keeping lessons 1-7 free.

**Architecture:** RevenueCat is the single source of truth for billing. A thin `SubscriptionProvider` context exposes subscription state. Lesson gating combines existing pedagogical unlock with subscription access check. Premium lesson grants (local SQLite) enable post-expiry review of previously learned content.

**Tech Stack:** RevenueCat (`react-native-purchases`, `react-native-purchases-ui`), Expo SQLite, React Context, PostHog analytics

**Spec:** `docs/superpowers/specs/2026-03-29-phase-c-monetization-design.md`

---

### Task 0: Fix Review Sentinel Bug (Pre-Monetization)

**Files:**
- Modify: `src/engine/progress.ts`
- Modify: `src/hooks/useProgress.ts`
- Modify: `app/lesson/review.tsx`
- Test: `src/__tests__/review-mastery-save.test.ts`

This bug must be fixed first: `review.tsx` passes `lesson_id=0` to `saveCompletedLesson()`, which inserts into `lesson_attempts` where the CHECK constraint says `lesson_id >= 1`. This crashes on every review completion.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/review-mastery-save.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

// We test that saveMasteryResults exists and accepts the right shape.
// DB integration is not possible in unit tests (expo-sqlite),
// so we test the function signature and logic extraction.
describe("saveMasteryResults (extracted from completeLesson)", () => {
  it("exports saveMasteryResults from progress module", async () => {
    const mod = await import("../engine/progress");
    expect(typeof mod.saveMasteryResults).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/__tests__/review-mastery-save.test.ts`
Expected: FAIL — `saveMasteryResults` does not exist yet

- [ ] **Step 3: Extract `saveMasteryResults` from `progress.ts`**

Add this new function in `src/engine/progress.ts` after `saveCompletedLesson` (around line 172):

```typescript
/**
 * Save mastery updates (entities, skills, confusions) without creating
 * a lesson_attempts row. Used by review sessions where the quiz feeds
 * the mastery pipeline but does not count as lesson progression.
 */
export async function saveMasteryResults(
  db: SQLiteDatabase,
  quizResultItems: QuizResultItem[],
  currentMastery: ProgressState["mastery"]
): Promise<void> {
  if (quizResultItems.length === 0) return;

  const today = new Date().toISOString().slice(0, 10);

  const enriched = quizResultItems.map((r) => ({
    ...r,
    targetKey: normalizeEntityKey(r.targetId, r),
  }));

  const updatedMastery = mergeQuizResultsIntoMastery(currentMastery, enriched, today);

  for (const [key, entity] of Object.entries(updatedMastery.entities)) {
    await saveMasteryEntity(db, key, entity as EntityState);
  }
  for (const [key, skill] of Object.entries(updatedMastery.skills)) {
    await saveMasterySkill(db, key, skill as SkillState);
  }
  for (const [key, confusion] of Object.entries(updatedMastery.confusions)) {
    await saveMasteryConfusion(db, key, confusion as ConfusionState);
  }
}
```

You will also need to add the import at the top of `progress.ts` (near line 60 where the existing mastery imports are):

```typescript
import { normalizeEntityKey, mergeQuizResultsIntoMastery } from "./mastery.js";
```

And add the QuizResultItem import:

```typescript
import type { QuizResultItem } from "../types/quiz";
```

Check if these imports already exist in `progress.ts` — they may already be there from other code. Only add what's missing.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/__tests__/review-mastery-save.test.ts`
Expected: PASS

- [ ] **Step 5: Update `useProgress.ts` to expose `saveMasteryOnly`**

In `src/hooks/useProgress.ts`, add a new callback after `completeLesson` (around line 87):

```typescript
const saveMasteryOnly = useCallback(
  async (quizResultItems: QuizResultItem[]) => {
    const freshProgress = await loadProgress(db);
    await saveMasteryResults(db, quizResultItems, freshProgress.mastery);
    await refresh();
  },
  [db, refresh]
);
```

Add `saveMasteryResults` to the imports from `"../engine/progress"` (line 10 area):

```typescript
import {
  loadProgress,
  saveCompletedLesson,
  saveQuestionAttempts,
  saveUserProfile,
  saveMasteryResults,
  type ProgressState,
  type UserProfileUpdate,
} from "../engine/progress";
```

Add `saveMasteryOnly` to the return object (around line 99):

```typescript
return {
  ...state,
  loading,
  completeLesson,
  saveMasteryOnly,
  updateProfile,
  refresh,
};
```

- [ ] **Step 6: Fix `review.tsx` to use `saveMasteryOnly`**

In `app/lesson/review.tsx`, replace the `handleQuizComplete` callback (lines 53-77). Change from:

```typescript
const handleQuizComplete = useCallback(
  async (results: { correct: number; total: number; questions: QuizResultItem[] }) => {
    const accuracy = results.total > 0 ? results.correct / results.total : 0;
    const passed = true;
    const attempts = mapQuizResultsToAttempts(results.questions);
    await progress.completeLesson(
      0, // review session sentinel
      accuracy,
      passed,
      attempts
    );
    await recordPractice();
    setQuizResults({ ...results, accuracy, passed });
    setStage("summary");
  },
  [progress, recordPractice]
);
```

To:

```typescript
const handleQuizComplete = useCallback(
  async (results: { correct: number; total: number; questions: QuizResultItem[] }) => {
    const accuracy = results.total > 0 ? results.correct / results.total : 0;
    const passed = true;

    // Review sessions save mastery updates only — no lesson_attempts row.
    // This avoids the lesson_id >= 1 CHECK constraint violation.
    await progress.saveMasteryOnly(results.questions);
    await recordPractice();

    setQuizResults({ ...results, accuracy, passed });
    setStage("summary");
  },
  [progress, recordPractice]
);
```

Remove the `mapQuizResultsToAttempts` import from the file since it's no longer used:

```typescript
// REMOVE this line:
import { mapQuizResultsToAttempts } from '../../src/types/quiz';
```

Keep the `QuizResultItem` type import.

- [ ] **Step 7: Run full validation**

Run: `npm run typecheck && npm test`
Expected: No new errors. The existing outcome.test.js failures are pre-existing (uncommitted threshold changes) and unrelated.

- [ ] **Step 8: Commit**

```bash
git add src/engine/progress.ts src/hooks/useProgress.ts app/lesson/review.tsx src/__tests__/review-mastery-save.test.ts
git commit -m "fix: extract saveMasteryResults, remove review sentinel lesson_id=0 bug

Review sessions now save mastery updates without creating a lesson_attempts row.
This fixes a CHECK constraint violation (lesson_id >= 1) that would crash on
every review completion."
```

---

### Task 1: Schema Migration — Premium Lesson Grants Table

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/db/client.ts`
- Test: `src/__tests__/schema-v5.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/schema-v5.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { SCHEMA_VERSION, CREATE_TABLES } from "../db/schema";

describe("Schema v5: premium_lesson_grants", () => {
  it("schema version is 5", () => {
    expect(SCHEMA_VERSION).toBe(5);
  });

  it("CREATE_TABLES includes premium_lesson_grants", () => {
    expect(CREATE_TABLES).toContain("premium_lesson_grants");
    expect(CREATE_TABLES).toContain("lesson_id INTEGER NOT NULL PRIMARY KEY");
    expect(CREATE_TABLES).toContain("granted_at TEXT NOT NULL");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/__tests__/schema-v5.test.ts`
Expected: FAIL — version is 4, no premium_lesson_grants table

- [ ] **Step 3: Update `schema.ts`**

In `src/db/schema.ts`, change version (line 7):

```typescript
export const SCHEMA_VERSION = 5;
```

Add the new table to `CREATE_TABLES`, before the `schema_version` table (around line 90, before `CREATE TABLE IF NOT EXISTS schema_version`):

```sql
CREATE TABLE IF NOT EXISTS premium_lesson_grants (
  lesson_id INTEGER NOT NULL PRIMARY KEY,
  granted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/__tests__/schema-v5.test.ts`
Expected: PASS

- [ ] **Step 5: Add v5 migration to `client.ts`**

In `src/db/client.ts`, add after the `currentVersion < 4` block (around line 68):

```typescript
if (currentVersion < 5) {
  const tableCheck = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='premium_lesson_grants'"
  );
  if (!tableCheck) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS premium_lesson_grants (
        lesson_id INTEGER NOT NULL PRIMARY KEY,
        granted_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
  await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (5)");
}
```

- [ ] **Step 6: Add grant persistence functions to `progress.ts`**

In `src/engine/progress.ts`, add after the `saveUserProfile` function (around line 321):

```typescript
// ── Premium Lesson Grants ─────────────────────────────────────────

export async function savePremiumLessonGrant(
  db: SQLiteDatabase,
  lessonId: number
): Promise<void> {
  await db.runAsync(
    "INSERT OR IGNORE INTO premium_lesson_grants (lesson_id) VALUES (?)",
    lessonId
  );
}

export async function loadPremiumLessonGrants(
  db: SQLiteDatabase
): Promise<number[]> {
  const rows = await db.getAllAsync<{ lesson_id: number }>(
    "SELECT lesson_id FROM premium_lesson_grants ORDER BY lesson_id"
  );
  return rows.map((r) => r.lesson_id);
}
```

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.ts src/db/client.ts src/engine/progress.ts src/__tests__/schema-v5.test.ts
git commit -m "feat: add premium_lesson_grants table (schema v5)

Tracks which premium lessons a user has completed while subscribed.
Enables post-expiry review of previously learned content."
```

---

### Task 2: Analytics Events — Monetization Types

**Files:**
- Modify: `src/analytics/events.ts`
- Create: `src/monetization/analytics.ts`
- Test: `src/__tests__/monetization-events.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/monetization-events.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("Monetization event types", () => {
  it("EventMap includes all monetization events", async () => {
    const mod = await import("../analytics/events");
    const keys = Object.keys({} as Record<keyof typeof mod.EventMap, true>);
    // We verify by importing the types — if they don't exist, TS compilation fails.
    // For runtime, we check the analytics helper exports.
    const analytics = await import("../monetization/analytics");
    expect(typeof analytics.trackPaywallShown).toBe("function");
    expect(typeof analytics.trackPaywallResult).toBe("function");
    expect(typeof analytics.trackPurchaseCompleted).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/__tests__/monetization-events.test.ts`
Expected: FAIL — `src/monetization/analytics.ts` doesn't export these functions

- [ ] **Step 3: Add monetization event types to `events.ts`**

In `src/analytics/events.ts`, add before the `EventMap` interface (around line 67):

```typescript
export interface PaywallShownProps {
  trigger: "lesson_7_summary" | "lesson_locked" | "expired_card" | "home_upsell";
  offering_id?: string;
}

export interface PaywallResultProps {
  trigger: "lesson_7_summary" | "lesson_locked" | "expired_card" | "home_upsell";
  result: "purchased" | "restored" | "cancelled" | "error";
}

export interface PurchaseCompletedProps {
  product_id: string;
  plan: "monthly" | "annual";
  is_trial: boolean;
  price?: number;
  currency?: string;
}

export interface PurchaseFailedProps {
  product_id: string;
  error_code?: string;
  error_message?: string;
}

export interface RestoreCompletedProps {
  success: boolean;
  entitlements_restored: number;
}

export interface TrialExpiredProps {
  days_used: number;
  lessons_completed_during_trial: number;
}

export interface EntitlementChangedProps {
  old_stage: "free" | "trial" | "paid" | "expired" | "unknown";
  new_stage: "free" | "trial" | "paid" | "expired" | "unknown";
}

export interface ScholarshipLinkTappedProps {
  trigger: string;
}
```

Then add to the `EventMap` interface (inside the existing interface block):

```typescript
  paywall_shown: PaywallShownProps;
  paywall_result: PaywallResultProps;
  purchase_completed: PurchaseCompletedProps;
  purchase_failed: PurchaseFailedProps;
  restore_completed: RestoreCompletedProps;
  trial_expired: TrialExpiredProps;
  entitlement_changed: EntitlementChangedProps;
  scholarship_link_tapped: ScholarshipLinkTappedProps;
```

- [ ] **Step 4: Create `src/monetization/analytics.ts`**

```typescript
import { track } from "../analytics";
import type {
  PaywallShownProps,
  PaywallResultProps,
  PurchaseCompletedProps,
  PurchaseFailedProps,
  RestoreCompletedProps,
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

export function trackEntitlementChanged(props: EntitlementChangedProps): void {
  track("entitlement_changed", props);
}

export function trackScholarshipTapped(trigger: string): void {
  track("scholarship_link_tapped", { trigger });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- --run src/__tests__/monetization-events.test.ts`
Expected: PASS

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: No new errors from events.ts changes

- [ ] **Step 7: Commit**

```bash
git add src/analytics/events.ts src/monetization/analytics.ts src/__tests__/monetization-events.test.ts
git commit -m "feat: add monetization analytics event types and helpers

Typed events for paywall_shown, paywall_result, purchase_completed,
purchase_failed, restore_completed, entitlement_changed, scholarship_link_tapped."
```

---

### Task 3: SubscriptionProvider — Thin RevenueCat Wrapper

**Files:**
- Create: `src/monetization/provider.tsx`
- Create: `src/monetization/hooks.ts`
- Modify: `src/monetization/paywall.ts` (create)
- Test: `src/__tests__/subscription-types.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/subscription-types.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("Subscription module exports", () => {
  it("provider exports SubscriptionProvider and useSubscription", async () => {
    const provider = await import("../monetization/provider");
    expect(typeof provider.SubscriptionProvider).toBe("function");

    const hooks = await import("../monetization/hooks");
    expect(typeof hooks.useSubscription).toBe("function");
  });

  it("paywall exports presentPaywall", async () => {
    const paywall = await import("../monetization/paywall");
    expect(typeof paywall.presentPaywall).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/__tests__/subscription-types.test.ts`
Expected: FAIL — modules don't exist

- [ ] **Step 3: Create `src/monetization/paywall.ts`**

```typescript
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { Alert } from "react-native";
import { trackPaywallShown, trackPaywallResult } from "./analytics";

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
      case PAYWALL_RESULT.PURCHASED:
        trackPaywallResult({ trigger, result: "purchased" });
        return { result: "purchased", accessGranted: true };

      case PAYWALL_RESULT.RESTORED:
        trackPaywallResult({ trigger, result: "restored" });
        return { result: "restored", accessGranted: true };

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
    // Network error or RevenueCat unavailable
    Alert.alert(
      "Couldn't verify your subscription",
      "Connect to the internet to continue.",
      [{ text: "OK" }]
    );
    trackPaywallResult({ trigger, result: "error" });
    return { result: "error", accessGranted: false };
  }
}
```

- [ ] **Step 4: Create `src/monetization/provider.tsx`**

```typescript
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
    // Check if user ever had premium (has any entitlement info at all)
    const allEntitlements = info.entitlements.all[PREMIUM_ENTITLEMENT];
    if (allEntitlements && !allEntitlements.isActive) {
      return "expired";
    }
    return "free";
  }

  // Active entitlement — trial or paid?
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

  // Initial fetch
  useEffect(() => {
    let mounted = true;

    Purchases.getCustomerInfo()
      .then((info) => {
        if (mounted) updateFromInfo(info);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    // Listen for updates (purchases, restores, external changes)
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      if (mounted) updateFromInfo(info);
    });

    return () => {
      mounted = false;
      listener.remove();
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
```

- [ ] **Step 5: Create `src/monetization/hooks.ts`**

```typescript
import { useContext, useMemo } from "react";
import { SubscriptionContext, type SubscriptionState } from "./provider";
import { LESSONS } from "../data/lessons";

const FREE_LESSON_CUTOFF = 7;

export function useSubscription(): SubscriptionState {
  return useContext(SubscriptionContext);
}

export function useCanAccessLesson(lessonId: number): boolean {
  const { isPremiumActive, loading } = useSubscription();
  // While loading, allow access to free lessons only
  if (lessonId <= FREE_LESSON_CUTOFF) return true;
  if (loading) return false;
  return isPremiumActive;
}

export function usePremiumReviewRights(grantedLessonIds: number[]): number[] {
  return useMemo(() => {
    // Derive reviewable letter IDs from granted premium lessons
    const letterIds = new Set<number>();

    // All letters from free lessons are always reviewable
    for (const lesson of LESSONS) {
      if (lesson.id <= FREE_LESSON_CUTOFF) {
        for (const id of lesson.teachIds || []) {
          letterIds.add(id);
        }
      }
    }

    // Add letters from granted premium lessons
    for (const lessonId of grantedLessonIds) {
      const lesson = LESSONS.find((l: any) => l.id === lessonId);
      if (lesson) {
        for (const id of lesson.teachIds || []) {
          letterIds.add(id);
        }
      }
    }

    return Array.from(letterIds);
  }, [grantedLessonIds]);
}

export { FREE_LESSON_CUTOFF };
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- --run src/__tests__/subscription-types.test.ts`
Expected: PASS

- [ ] **Step 7: Run typecheck**

Run: `npm run typecheck`
Expected: No new errors from monetization files

- [ ] **Step 8: Commit**

```bash
git add src/monetization/provider.tsx src/monetization/hooks.ts src/monetization/paywall.ts src/__tests__/subscription-types.test.ts
git commit -m "feat: add SubscriptionProvider, hooks, and paywall wrapper

Thin RevenueCat wrapper exposing isPremiumActive, stage, trialDaysRemaining.
presentPaywall() returns structured PaywallOutcome, not boolean.
useCanAccessLesson() and usePremiumReviewRights() for gating logic."
```

---

### Task 4: Wire SubscriptionProvider into App Layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add import**

In `app/_layout.tsx`, add after the `initRevenueCat` import (line 29):

```typescript
import { SubscriptionProvider } from "../src/monetization/provider";
```

- [ ] **Step 2: Wrap in provider**

In `app/_layout.tsx`, the current tree inside the return is:
```
ThemeContext.Provider → Sentry.ErrorBoundary → DatabaseProvider → AnalyticsGate → Stack
```

Insert `SubscriptionProvider` between `DatabaseProvider` and `AnalyticsGate`. Change from:

```tsx
        <DatabaseProvider fallback={<AppLoadingScreen />}>
          <AnalyticsGate>
```

To:

```tsx
        <DatabaseProvider fallback={<AppLoadingScreen />}>
          <SubscriptionProvider>
          <AnalyticsGate>
```

And add the matching closing tag. Change from:

```tsx
          </AnalyticsGate>
        </DatabaseProvider>
```

To:

```tsx
          </AnalyticsGate>
          </SubscriptionProvider>
        </DatabaseProvider>
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: wire SubscriptionProvider into app layout

Inserted between DatabaseProvider and AnalyticsGate.
Subscription state now available to all screens."
```

---

### Task 5: Home Screen — Lock Icons and Trial Badge

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `src/components/home/LessonGrid.tsx`

- [ ] **Step 1: Read current home screen and LessonGrid**

Read `app/(tabs)/index.tsx` and `src/components/home/LessonGrid.tsx` to understand the current lesson rendering flow. The home screen passes lessons to LessonGrid, which renders each lesson node. We need to:
1. Add a lock icon overlay on lessons 8+ for non-premium users
2. Add a trial badge in the header area
3. Intercept taps on locked lessons to show paywall instead of navigating

- [ ] **Step 2: Add subscription awareness to home screen**

In `app/(tabs)/index.tsx`, add the import near the top imports:

```typescript
import { useSubscription, FREE_LESSON_CUTOFF } from "../../src/monetization/hooks";
```

Inside the component function, after the existing hooks (progress, habit), add:

```typescript
const { isPremiumActive, stage, trialDaysRemaining, showPaywall } = useSubscription();
```

- [ ] **Step 3: Add trial badge to home header**

Find the header section in the home screen (the area with the greeting text). Add the trial badge right after the greeting. The badge should be conditional:

```tsx
{/* Trial badge — progressive urgency */}
{stage === "trial" && trialDaysRemaining != null && (
  <Pressable onPress={() => showPaywall("home_upsell")}>
    <Text style={[
      styles.trialBadge,
      {
        color: trialDaysRemaining <= 2 ? colors.accent : colors.textMuted,
        backgroundColor: trialDaysRemaining <= 2 ? colors.accentLight : "transparent",
      }
    ]}>
      {trialDaysRemaining <= 2
        ? `Your trial ends in ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""}. Subscribe to keep learning.`
        : `Trial \u00B7 ${trialDaysRemaining} days left`}
    </Text>
  </Pressable>
)}
{stage === "expired" && (
  <Pressable onPress={() => showPaywall("expired_card")}>
    <Text style={[styles.trialBadge, { color: colors.accent, backgroundColor: colors.accentLight }]}>
      Your trial has ended.
    </Text>
  </Pressable>
)}
```

Add the style:

```typescript
trialBadge: {
  fontSize: 12,
  fontFamily: fontFamilies.bodyMedium,
  textAlign: "center",
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
  borderRadius: radii.lg,
  overflow: "hidden",
  marginBottom: spacing.sm,
},
```

- [ ] **Step 4: Pass subscription state to LessonGrid**

The home screen renders `<LessonGrid>`. Add the subscription props:

```tsx
<LessonGrid
  // ... existing props
  isPremiumActive={isPremiumActive}
  onLockedLessonPress={async (lessonId: number) => {
    const outcome = await showPaywall("lesson_locked");
    if (outcome.accessGranted) {
      router.push({ pathname: "/lesson/[id]", params: { id: String(lessonId) } });
    }
  }}
/>
```

- [ ] **Step 5: Update LessonGrid to show lock icons**

In `src/components/home/LessonGrid.tsx`, add the new props to the component interface:

```typescript
isPremiumActive?: boolean;
onLockedLessonPress?: (lessonId: number) => void;
```

In the lesson node rendering, distinguish progression-locked from premium-locked. A lesson is premium-locked only when it is pedagogically unlocked BUT behind the paywall:

```typescript
const isProgressionLocked = !isLessonUnlocked(lesson, completedLessonIds);
const isPremiumLocked = !isProgressionLocked && lesson.id > FREE_LESSON_CUTOFF && !isPremiumActive;
```

Only premium-locked lessons get the lock icon overlay and paywall behavior. Progression-locked lessons keep their existing greyed-out "not yet unlocked" appearance — no paywall on tap.

Import `FREE_LESSON_CUTOFF`:

```typescript
import { FREE_LESSON_CUTOFF } from "../../monetization/hooks";
```

For locked lessons:
- Show a lock icon overlay (small Svg lock or use opacity + lock text)
- On press, call `onLockedLessonPress(lesson.id)` instead of navigating

This is a visual change — read the current LessonGrid to understand how lesson nodes are rendered and apply the lock overlay to match the existing visual style. Use `colors.textMuted` for the lock icon, and reduce opacity of the lesson node content to 0.4.

- [ ] **Step 6: Run typecheck and visual check**

Run: `npm run typecheck`
Expected: No new errors

- [ ] **Step 7: Commit**

```bash
git add app/(tabs)/index.tsx src/components/home/LessonGrid.tsx
git commit -m "feat: add lock icons on premium lessons and trial badge on home

Lessons 8+ show lock overlay for free/expired users.
Tapping locked lesson presents RevenueCat paywall.
Trial badge with progressive urgency in header."
```

---

### Task 6: Lesson Screen — Gate and Trial CTA

**Files:**
- Modify: `app/lesson/[id].tsx`
- Modify: `src/components/LessonSummary.tsx`

- [ ] **Step 1: Gate lesson access**

In `app/lesson/[id].tsx`, add imports:

```typescript
import { useSubscription, useCanAccessLesson, FREE_LESSON_CUTOFF } from "../../src/monetization/hooks";
import { savePremiumLessonGrant } from "../../src/engine/progress";
import { useDatabase } from "../../src/db/provider";
import { Linking } from "react-native";
```

Inside the component, after existing hooks:

```typescript
const db = useDatabase();
const { isPremiumActive, stage, showPaywall } = useSubscription();
const canAccess = useCanAccessLesson(lessonId);
```

After the "lesson not found" error block, add a "lesson locked" gate:

```tsx
if (lesson && !canAccess) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.errorContent}>
        <Text style={[typography.heading2, { color: colors.text, textAlign: "center" }]}>
          Premium Lesson
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.textMuted, textAlign: "center", marginTop: spacing.md },
          ]}
        >
          {stage === "unknown"
            ? "Couldn't verify your subscription. Connect to the internet to continue."
            : "This lesson requires Tila Premium."}
        </Text>
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          {stage !== "unknown" && (
            <Button title="Start Free Trial" onPress={async () => {
              const outcome = await showPaywall("lesson_locked");
              // If purchased, canAccess will update reactively via provider
            }} />
          )}
          <Button title="Go Home" variant="ghost" onPress={() => router.replace("/(tabs)")} />
        </View>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Record premium lesson grant on completion**

In the `handleQuizComplete` callback, after the `completeLesson` call (around line 101), add:

```typescript
// Record premium lesson grant if applicable
if (passed && lesson!.id > FREE_LESSON_CUTOFF && isPremiumActive) {
  await savePremiumLessonGrant(db, lesson!.id);
}
```

- [ ] **Step 3: Add trial CTA props to LessonSummary**

In the summary rendering section of `app/lesson/[id].tsx`, add the new props to the `<LessonSummary>` call:

```tsx
showTrialCTA={lesson.id === FREE_LESSON_CUTOFF && !isPremiumActive && stage !== "unknown"}
onStartTrial={() => showPaywall("lesson_7_summary")}
onScholarship={() => Linking.openURL("mailto:support@tila.app?subject=Tila%20Scholarship%20Request")}
```

- [ ] **Step 4: Update LessonSummary to render trial CTA**

In `src/components/LessonSummary.tsx`, add to `LessonSummaryProps`:

```typescript
showTrialCTA?: boolean;
onStartTrial?: () => void;
onScholarship?: () => void;
```

Destructure these in the component function signature.

In the passed state JSX, add after the review prompt card section (around line 764) and before the action buttons:

```tsx
{/* Trial CTA — shown on lesson 7 for non-premium users */}
{passed && showTrialCTA && onStartTrial && (
  <Animated.View
    entering={FadeIn.delay(850).duration(400)}
    style={[
      styles.trialCTACard,
      { backgroundColor: colors.primarySoft, borderColor: "rgba(22,51,35,0.15)" },
    ]}
  >
    <Text style={[styles.trialCTAHeadline, { color: colors.text }]}>
      You just learned to recognize the Arabic alphabet.
    </Text>
    <Text style={[styles.trialCTASub, { color: colors.textSoft }]}>
      Ready to learn how they sound? Start your free 7-day trial.
    </Text>
    <Pressable
      onPress={() => { hapticTap(); onStartTrial(); }}
      style={[styles.trialCTABtn, { backgroundColor: colors.primary }]}
    >
      <Text style={[styles.trialCTABtnText, { color: "#FFFFFF" }]}>
        Start Free Trial
      </Text>
    </Pressable>
    {onScholarship && (
      <Pressable onPress={() => { trackScholarshipTapped("lesson_7_summary"); onScholarship(); }}>
        <Text style={[styles.trialCTAScholarship, { color: colors.textMuted }]}>
          Can't afford Tila? Email us
        </Text>
      </Pressable>
    )}
  </Animated.View>
)}
```

Add the import at the top of LessonSummary.tsx:

```typescript
import { trackScholarshipTapped } from "../monetization/analytics";
```

Add the styles:

```typescript
trialCTACard: {
  width: "100%",
  borderRadius: radii.xxl,
  borderWidth: 1,
  paddingVertical: spacing.lg,
  paddingHorizontal: spacing.xl,
  alignItems: "center",
  marginBottom: spacing.md,
},
trialCTAHeadline: {
  fontFamily: fontFamilies.headingSemiBold,
  fontSize: 16,
  textAlign: "center",
  marginBottom: spacing.sm,
},
trialCTASub: {
  fontSize: 13,
  fontFamily: fontFamilies.bodyRegular,
  textAlign: "center",
  marginBottom: spacing.lg,
  lineHeight: 20,
},
trialCTABtn: {
  borderRadius: radii.lg,
  paddingVertical: 14,
  paddingHorizontal: 32,
  alignItems: "center",
  marginBottom: spacing.sm,
},
trialCTABtnText: {
  fontFamily: fontFamilies.bodySemiBold,
  fontSize: 15,
},
trialCTAScholarship: {
  fontSize: 12,
  fontFamily: fontFamilies.bodyRegular,
  paddingVertical: spacing.sm,
},
```

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: No new errors

- [ ] **Step 6: Commit**

```bash
git add app/lesson/[id].tsx src/components/LessonSummary.tsx
git commit -m "feat: gate premium lessons and add trial CTA on lesson 7 summary

Lessons 8+ show locked screen for free/expired/unknown users.
Lesson 7 summary shows trial CTA with Start Free Trial + scholarship link.
Premium lesson grants recorded on completion."
```

---

### Task 7: Home Upgrade and Upsell Cards

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Add upgrade card for expired users**

In the home screen, after the lesson grid or where the "next lesson" section is rendered, add an upgrade card for expired users. Find the section where the current lesson / hero card is rendered.

```tsx
{stage === "expired" && (
  <Pressable
    onPress={() => showPaywall("expired_card")}
    style={[styles.upgradeCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
  >
    <Text style={[styles.upgradeCardTitle, { color: colors.text }]}>
      Upgrade to Continue
    </Text>
    <Text style={[styles.upgradeCardSub, { color: colors.textSoft }]}>
      Pick up where you left off with Tila Premium.
    </Text>
  </Pressable>
)}
```

- [ ] **Step 2: Add upsell card for free users past lesson 7**

```tsx
{stage === "free" && completedLessonIds.includes(FREE_LESSON_CUTOFF) && (
  <Pressable
    onPress={() => showPaywall("home_upsell")}
    style={[styles.upsellCard, { backgroundColor: colors.primarySoft, borderColor: "rgba(22,51,35,0.1)" }]}
  >
    <Text style={[styles.upsellCardText, { color: colors.primary }]}>
      Unlock all lessons \u2192
    </Text>
  </Pressable>
)}
```

- [ ] **Step 3: Add styles**

```typescript
upgradeCard: {
  borderRadius: radii.xxl,
  borderWidth: 1,
  paddingVertical: spacing.lg,
  paddingHorizontal: spacing.xl,
  alignItems: "center",
  marginBottom: spacing.lg,
},
upgradeCardTitle: {
  fontFamily: fontFamilies.headingSemiBold,
  fontSize: 16,
  marginBottom: spacing.xs,
},
upgradeCardSub: {
  fontSize: 13,
  fontFamily: fontFamilies.bodyRegular,
},
upsellCard: {
  borderRadius: radii.lg,
  borderWidth: 1,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  alignItems: "center",
  marginBottom: spacing.md,
},
upsellCardText: {
  fontSize: 13,
  fontFamily: fontFamilies.bodySemiBold,
},
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: add upgrade card (expired) and upsell card (free past lesson 7)

Expired users see 'Upgrade to Continue' on home screen.
Free users past lesson 7 see subtle 'Unlock all lessons' card."
```

---

### Task 8: Review Filtering for Expired Users

**Files:**
- Modify: `app/lesson/review.tsx`
- Modify: `app/(tabs)/index.tsx` (review CTA)

- [ ] **Step 1: Add subscription + grant awareness to review screen**

In `app/lesson/review.tsx`, add imports:

```typescript
import { useSubscription, usePremiumReviewRights, FREE_LESSON_CUTOFF } from "../../src/monetization/hooks";
import { loadPremiumLessonGrants } from "../../src/engine/progress";
import { useDatabase } from "../../src/db/provider";
import { useEffect, useState } from "react";
```

Inside the component, add:

```typescript
const db = useDatabase();
const { isPremiumActive, stage } = useSubscription();
const [grantedLessonIds, setGrantedLessonIds] = useState<number[]>([]);

useEffect(() => {
  loadPremiumLessonGrants(db).then(setGrantedLessonIds);
}, [db]);

const reviewableLetterIds = usePremiumReviewRights(grantedLessonIds);
```

- [ ] **Step 2: Filter review lesson payload**

The current code builds `reviewLesson` from `buildReviewLessonPayload(mastery, completedLessonIds, today)`. After this, if the user is not premium, filter the `teachIds` to only include reviewable letters:

```typescript
const reviewLesson = useMemo(() => {
  const payload = buildReviewLessonPayload(mastery, completedLessonIds, today);
  if (!payload) return null;

  // If user is premium, no filtering needed
  if (isPremiumActive) return payload;

  // For free/expired users, filter to only reviewable letters
  const filteredTeachIds = (payload.teachIds || []).filter(
    (id: number) => reviewableLetterIds.includes(id)
  );

  if (filteredTeachIds.length === 0) return null;

  return { ...payload, teachIds: filteredTeachIds };
}, [mastery, completedLessonIds, today, isPremiumActive, reviewableLetterIds]);
```

Replace the existing `reviewLesson` useMemo with this one.

- [ ] **Step 3: Update home review CTA to respect subscription**

In `app/(tabs)/index.tsx`, the review CTA already exists (showing "X letters ready for review"). Update the review count calculation to filter by reviewable letters when not premium. This requires passing `grantedLessonIds` similarly to the review screen. Add the same pattern:

```typescript
const [grantedLessonIds, setGrantedLessonIds] = useState<number[]>([]);

useEffect(() => {
  if (!progress.loading) {
    loadPremiumLessonGrants(db).then(setGrantedLessonIds);
  }
}, [db, progress.loading]);

const reviewableLetterIds = usePremiumReviewRights(grantedLessonIds);
```

Import the needed functions:

```typescript
import { loadPremiumLessonGrants } from "../../src/engine/progress";
import { usePremiumReviewRights } from "../../src/monetization/hooks";
import { useDatabase } from "../../src/db/provider";
```

When computing the review plan for the home CTA, filter the result:

```typescript
// Filter review plan items to only reviewable letters if not premium
const filteredReviewCount = useMemo(() => {
  if (!reviewPlan?.hasReviewWork) return 0;
  if (isPremiumActive) return reviewPlan.totalItems ?? 0;
  // Filter: only count items whose letters are in reviewableLetterIds
  // For simplicity, use the filtered count
  return reviewPlan.items
    ? reviewPlan.items.filter((key: string) => {
        const match = key.match(/^letter:(\d+)$/);
        return match ? reviewableLetterIds.includes(parseInt(match[1], 10)) : false;
      }).length
    : 0;
}, [reviewPlan, isPremiumActive, reviewableLetterIds]);
```

Use `filteredReviewCount` instead of the raw review count when displaying the CTA.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add app/lesson/review.tsx app/(tabs)/index.tsx
git commit -m "feat: filter review sessions by premium lesson grants

Expired users can only review letters from lessons they completed
while subscribed. Home review CTA count respects the same filter."
```

---

### Task 9: Final Validation

**Files:** None (validation only)

- [ ] **Step 1: Run full validation suite**

```bash
npm run typecheck
npm run lint
npm test
```

Document results. Fix any new errors introduced by Phase C work. Pre-existing errors (from git status output) should be noted but not fixed.

- [ ] **Step 2: Verify module exports**

```bash
# Quick smoke test that all new modules can be imported
node -e "
  // These will fail in Node (React Native), but syntax/export errors will show
  console.log('Checking module syntax...');
" 2>&1 || true
```

The real verification is `npm run typecheck` passing — all imports are validated at compile time.

- [ ] **Step 3: Review test matrix coverage**

Check which test matrix scenarios can be verified without a development build:

| # | Scenario | Verifiable without dev build? |
|---|----------|-------------------------------|
| 1 | Fresh install, no purchase | Yes — free users see locks (UI logic) |
| 2 | Tap locked lesson | Yes — paywall call wired |
| 3 | Lesson 7 trial CTA | Yes — conditional render logic |
| 18 | Lesson 7 revisit CTA | Yes — no "shown once" flag |
| 4-17, 19-20 | Purchase/restore/expiry flows | No — requires development build + sandbox |

Scenarios 4-17 and 19-20 require a development build with sandbox accounts. Document this as a follow-up.

- [ ] **Step 4: Commit any validation fixes**

If validation revealed issues, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve Phase C validation issues"
```

- [ ] **Step 5: Final commit — mark Phase C code complete**

```bash
git add -A
git commit -m "feat: Phase C monetization complete (code)

RevenueCat SDK integrated with SubscriptionProvider.
Lessons 8+ gated behind premium. Paywall triggers on lesson 7
summary and locked lesson taps. Trial badge with progressive
urgency. Premium lesson grants for post-expiry review.
Monetization analytics events typed and wired.

Requires development build for IAP testing (sandbox accounts)."
```
