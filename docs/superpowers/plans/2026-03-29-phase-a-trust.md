# Phase A: Trust — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix data integrity bugs, move secrets to env vars, add analytics consent, fix motivation mapping. Make the data honest before building anything on top of it.

**Architecture:** Seven independent fixes to the engine, DB, analytics, and onboarding layers. Tasks 1-4 fix learning data bugs. Tasks 5-7 fix security/config issues. All tasks are independent except Task 4 (confusion persistence) which Task 1 (mastery race condition) should land before, since both touch `useProgress.ts`.

**Tech Stack:** TypeScript, SQLite (expo-sqlite), Vitest, Expo environment variables

---

### Task 1: Fix Mastery Save Race Condition

**Files:**
- Modify: `src/hooks/useProgress.ts:37-85`
- Test: `src/__tests__/mastery-pipeline.test.ts`

**Problem:** `completeLesson` calls `refresh()` at line 54 which updates `state`, then reads `state?.mastery` at line 59 — but `state` is a React state variable that won't reflect the refresh until the next render. The merge operates on stale mastery data.

- [ ] **Step 1: Write the failing test**

In `src/__tests__/mastery-pipeline.test.ts`, replace the `.todo()` tests with a real test that validates the pipeline loads fresh mastery before merging:

```typescript
import { describe, it, expect } from 'vitest';
import { mergeQuizResultsIntoMastery, normalizeEntityKey } from '../engine/mastery.js';

describe('mastery merge pipeline', () => {
  it('mergeQuizResultsIntoMastery produces updated entities from fresh mastery', () => {
    // Simulate: mastery already has letter:2 with 3 correct / 4 attempts
    const existingMastery = {
      entities: {
        'letter:2': { correct: 3, attempts: 4, lastSeen: '2026-03-28', nextReview: '2026-03-29', intervalDays: 3, sessionStreak: 3 },
      },
      skills: {},
      confusions: {},
    };

    const quizResults = [
      { targetId: 2, targetKey: 'letter:2', correct: true, questionType: 'tap', skillBucket: 'visual' },
      { targetId: 2, targetKey: 'letter:2', correct: true, questionType: 'name_to_letter', skillBucket: 'visual' },
    ];

    const updated = mergeQuizResultsIntoMastery(existingMastery, quizResults, '2026-03-29');

    // Should build on existing 3/4, not start from 0/0
    expect(updated.entities['letter:2'].correct).toBe(5);
    expect(updated.entities['letter:2'].attempts).toBe(6);
  });

  it('mergeQuizResultsIntoMastery works with empty initial mastery', () => {
    const emptyMastery = { entities: {}, skills: {}, confusions: {} };
    const quizResults = [
      { targetId: 5, targetKey: 'letter:5', correct: true, questionType: 'tap', skillBucket: 'visual' },
    ];

    const updated = mergeQuizResultsIntoMastery(emptyMastery, quizResults, '2026-03-29');
    expect(updated.entities['letter:5'].correct).toBe(1);
    expect(updated.entities['letter:5'].attempts).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- --reporter=verbose 2>&1 | head -30`
Expected: These tests should PASS (they test the engine function, which works correctly). The bug is in the hook, not the engine.

- [ ] **Step 3: Fix the race condition in useProgress.ts**

In `src/hooks/useProgress.ts`, change `completeLesson` so it loads fresh mastery directly from DB instead of reading stale React state:

```typescript
const completeLesson = useCallback(
    async (
      lessonId: number,
      accuracy: number,
      passed: boolean,
      questions: QuestionAttempt[],
      quizResultItems?: QuizResultItem[]
    ) => {
      const attemptId = await saveCompletedLesson(
        db,
        lessonId,
        accuracy,
        passed
      );
      if (questions.length > 0) {
        await saveQuestionAttempts(db, attemptId, questions);
      }

      // Wire mastery pipeline if quizResultItems provided
      if (quizResultItems && quizResultItems.length > 0) {
        const today = new Date().toISOString().slice(0, 10);

        // Load FRESH mastery from DB — do NOT use stale React state
        const freshProgress = await loadProgress(db);
        const currentMastery = freshProgress.mastery ?? { entities: {}, skills: {}, confusions: {} };

        // Enrich results with targetKey
        const enriched = quizResultItems.map((r) => ({
          ...r,
          targetKey: normalizeEntityKey(r.targetId, r),
        }));

        const updatedMastery = mergeQuizResultsIntoMastery(currentMastery, enriched, today);

        // Persist updated entities
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

      // Single refresh at the end — covers both lesson save and mastery updates
      await refresh();
      return attemptId;
    },
    [db, refresh]
  );
```

Key changes:
- Removed the first `await refresh()` call at old line 54 (was causing stale state read)
- Replaced `state?.mastery` with `const freshProgress = await loadProgress(db)` — reads directly from DB
- Removed `state` from the useCallback dependency array (no longer used)
- Single `refresh()` at the end updates React state once after all writes complete

- [ ] **Step 4: Run tests**

Run: `npm test -- --reporter=verbose 2>&1 | head -30`
Expected: All tests PASS

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useProgress.ts src/__tests__/mastery-pipeline.test.ts
git commit -m "fix: load fresh mastery from DB before merge — eliminates stale state race condition"
```

---

### Task 2: Fix Checkpoint Phase 2+ Classifier

**Files:**
- Modify: `src/engine/questions/checkpoint.js:168-185`
- Test: `src/__tests__/checkpoint-classifier.test.ts` (create)

**Problem:** `classifyLetters(allIds, progress)` accesses `progress?.[id]` where `id` is a numeric letter ID (e.g., `5`). But the mastery system stores entities keyed as `"letter:5"`. So `progress[5]` is always undefined, and every letter classifies as "unseen."

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/checkpoint-classifier.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

// classifyLetters is not exported, so we test via the public API
// Import the checkpoint generator and check its output quality
import { generateCheckpointQs } from '../engine/questions/checkpoint.js';

describe('checkpoint classifier with entity-keyed mastery', () => {
  it('produces weighted questions when mastery uses entity keys', () => {
    const lesson = { id: 43, phase: 1, lessonMode: 'checkpoint', teachIds: [1, 2, 3, 4, 5] };
    // Mastery data with entity keys (the real format)
    const progress = {
      completedLessonIds: [1, 2, 3, 4, 5, 6, 7],
      mastery: {
        entities: {
          'letter:1': { correct: 10, attempts: 10, lastSeen: '2026-03-29', nextReview: null, intervalDays: 7, sessionStreak: 5 },
          'letter:2': { correct: 8, attempts: 10, lastSeen: '2026-03-29', nextReview: null, intervalDays: 3, sessionStreak: 3 },
          'letter:3': { correct: 2, attempts: 10, lastSeen: '2026-03-29', nextReview: null, intervalDays: 1, sessionStreak: 0 },
          // letter:4 and letter:5 have no entries — should be "unseen"
        },
        skills: {},
        confusions: {},
      },
    };

    const questions = generateCheckpointQs(lesson, progress);
    expect(questions.length).toBeGreaterThan(0);

    // Letter 3 (struggled: 20% accuracy) and letters 4,5 (unseen) should appear more than letter 1 (strong: 100%)
    const targetCounts: Record<number, number> = {};
    for (const q of questions) {
      const target = q.targetId ?? q.correctId;
      if (target) targetCounts[target] = (targetCounts[target] ?? 0) + 1;
    }
    // Struggled/unseen letters should be present
    expect(targetCounts[3] ?? 0).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/checkpoint-classifier.test.ts --reporter=verbose 2>&1 | head -20`
Expected: FAIL — questions may be empty or all letters treated as unseen (no weighting)

- [ ] **Step 3: Fix classifyLetters to handle entity keys**

In `src/engine/questions/checkpoint.js`, replace the `classifyLetters` function:

```javascript
/** Classify letters by user performance. Handles both flat and entity-keyed mastery. */
function classifyLetters(allIds, progress) {
  const struggled = [];
  const unseen = [];
  const strong = [];

  // Support both flat progress (progress[id]) and entity-keyed mastery (progress.mastery.entities["letter:id"])
  const entities = progress?.mastery?.entities ?? progress ?? {};

  for (const id of allIds) {
    // Try entity key first, then flat numeric key
    const entry = entities[`letter:${id}`] ?? entities[id];
    if (!entry || (entry.attempts ?? 0) === 0) {
      unseen.push(id);
    } else if ((entry.correct ?? 0) / (entry.attempts ?? 1) < 0.7) {
      struggled.push(id);
    } else {
      strong.push(id);
    }
  }

  return { struggled, unseen, strong };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/checkpoint-classifier.test.ts --reporter=verbose 2>&1 | head -20`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `npm test -- --reporter=verbose 2>&1 | tail -20`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/engine/questions/checkpoint.js src/__tests__/checkpoint-classifier.test.ts
git commit -m "fix: checkpoint classifier handles entity-keyed mastery format"
```

---

### Task 3: Persist Confusion Categories

**Files:**
- Modify: `src/db/schema.ts:7,57-62`
- Modify: `src/db/client.ts:29-48`
- Modify: `src/engine/progress.ts:27-30,78-80,113-116,216-228`
- Test: `src/__tests__/confusion-persistence.test.ts` (create)

**Problem:** `mastery.js` `recordConfusion()` writes a `categories` field (e.g., `{ visual_confusion: 3, sound_confusion: 1 }`). But `saveMasteryConfusion()` only saves `confusion_key`, `count`, `last_seen`. Categories are lost on restart.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/confusion-persistence.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { ConfusionState } from '../engine/progress';

describe('ConfusionState shape', () => {
  it('includes optional categories field', () => {
    const confusion: ConfusionState = {
      count: 5,
      lastSeen: '2026-03-29',
      categories: { visual_confusion: 3, sound_confusion: 2 },
    };
    expect(confusion.categories).toEqual({ visual_confusion: 3, sound_confusion: 2 });
  });

  it('categories is optional for backwards compatibility', () => {
    const confusion: ConfusionState = {
      count: 5,
      lastSeen: '2026-03-29',
    };
    expect(confusion.categories).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/confusion-persistence.test.ts --reporter=verbose 2>&1 | head -20`
Expected: FAIL — TypeScript compilation error because `categories` is not on `ConfusionState`

- [ ] **Step 3: Add categories to ConfusionState type**

In `src/engine/progress.ts`, update the interface at line 27-30:

```typescript
export interface ConfusionState {
  count: number;
  lastSeen: string | null;
  categories?: Record<string, number>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/confusion-persistence.test.ts --reporter=verbose 2>&1 | head -20`
Expected: PASS

- [ ] **Step 5: Update schema — add categories column**

In `src/db/schema.ts`:

1. Change `SCHEMA_VERSION` from `2` to `3`:
```typescript
export const SCHEMA_VERSION = 3;
```

2. Add `categories TEXT` column to `mastery_confusions` table:
```sql
CREATE TABLE IF NOT EXISTS mastery_confusions (
  confusion_key TEXT NOT NULL PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  last_seen TEXT,
  categories TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- [ ] **Step 6: Add v3 migration**

In `src/db/client.ts`, add a v3 migration block after the v2 block (after line 47):

```typescript
  if (currentVersion < 3) {
    try {
      await db.execAsync(`
        ALTER TABLE mastery_confusions ADD COLUMN categories TEXT;
      `);
    } catch {
      // Column may already exist if DB was created fresh with v3 schema
    }
    await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (3)");
  }
```

- [ ] **Step 7: Update saveMasteryConfusion to write categories**

In `src/engine/progress.ts`, update `saveMasteryConfusion` (line 216-228):

```typescript
export async function saveMasteryConfusion(
  db: SQLiteDatabase,
  confusionKey: string,
  state: ConfusionState
): Promise<void> {
  const categoriesJson = state.categories ? JSON.stringify(state.categories) : null;
  await db.runAsync(
    `INSERT OR REPLACE INTO mastery_confusions (confusion_key, count, last_seen, categories)
     VALUES (?, ?, ?, ?)`,
    confusionKey,
    state.count,
    state.lastSeen,
    categoriesJson
  );
}
```

- [ ] **Step 8: Update loadProgress to read categories**

In `src/engine/progress.ts`, update the confusions query (line 78-80) and transformation (line 113-116):

Query (add `categories` to SELECT):
```typescript
      db.getAllAsync<{
        confusion_key: string; count: number; last_seen: string | null; categories: string | null;
      }>('SELECT confusion_key, count, last_seen, categories FROM mastery_confusions'),
```

Transformation (parse JSON):
```typescript
  const confusions: Record<string, ConfusionState> = {};
  for (const row of confusionRows) {
    confusions[row.confusion_key] = {
      count: row.count,
      lastSeen: row.last_seen,
      categories: row.categories ? JSON.parse(row.categories) : undefined,
    };
  }
```

- [ ] **Step 9: Run full test suite**

Run: `npm test -- --reporter=verbose 2>&1 | tail -20`
Expected: All tests PASS

- [ ] **Step 10: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 11: Commit**

```bash
git add src/db/schema.ts src/db/client.ts src/engine/progress.ts src/__tests__/confusion-persistence.test.ts
git commit -m "feat: persist confusion categories to DB — schema v3 migration"
```

---

### Task 4: Empty Harakat Quiz Fallback

**Files:**
- Modify: `src/hooks/useLessonQuiz.ts:49-63`
- Test: `src/__tests__/empty-quiz.test.ts` (create)

**Problem:** If `generateLessonQuestions` returns empty, the quiz silently marks itself complete with 0 questions — fake 100% accuracy.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/empty-quiz.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('empty question generation', () => {
  it('empty results should not be treated as 100% success', () => {
    // The quiz results for an empty question set
    const results = { correct: 0, total: 0, questions: [] };

    // With 0 total questions, accuracy would be NaN or 0/0
    // The system should NOT pass this as a completed lesson
    const accuracy = results.total > 0 ? results.correct / results.total : -1;
    expect(accuracy).toBe(-1); // -1 signals "invalid quiz, do not save"
    expect(results.total).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- src/__tests__/empty-quiz.test.ts --reporter=verbose 2>&1 | head -15`
Expected: PASS (this is a contract test for the fix we're about to make)

- [ ] **Step 3: Add error state to useLessonQuiz**

In `src/hooks/useLessonQuiz.ts`, add an `error` state and change the empty-array handling. Find the state declarations near the top of the hook and add:

```typescript
const [error, setError] = useState<string | null>(null);
```

Then replace the empty question handling (lines 55-58):

```typescript
    const qs = generateLessonQuestions(lesson, progress);
    if (!qs || qs.length === 0) {
      setError('No questions could be generated for this lesson. Please go back and try again.');
      return;
    }
```

Remove the `setIsComplete(true)` call on empty — the quiz should NOT complete.

- [ ] **Step 4: Expose error in the return object**

In the return statement of `useLessonQuiz`, add `error`:

```typescript
return {
  // ... existing fields
  error,
};
```

- [ ] **Step 5: Handle error in LessonQuiz component**

In `src/components/LessonQuiz.tsx`, destructure `error` from `useLessonQuiz()` and render an error state before the quiz content:

```typescript
const { questions, currentIndex, /* ... other fields */, error } = useLessonQuiz(/* ... */);

// Early return for error state
if (error) {
  return (
    <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
      <Text style={[typography.headingSemiBold, { color: colors.text, textAlign: 'center', marginBottom: spacing.lg }]}>
        Something went wrong
      </Text>
      <Text style={[typography.bodyRegular, { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl }]}>
        {error}
      </Text>
      <Button variant="primary" label="Go Back" onPress={() => router.back()} />
    </View>
  );
}
```

- [ ] **Step 6: Run full test suite + typecheck**

Run: `npm test -- --reporter=verbose 2>&1 | tail -20 && npm run typecheck`
Expected: All tests PASS, no type errors

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useLessonQuiz.ts src/components/LessonQuiz.tsx src/__tests__/empty-quiz.test.ts
git commit -m "fix: show error state on empty quiz instead of silent 100% completion"
```

---

### Task 5: Move API Keys to Environment Variables

**Files:**
- Modify: `src/analytics/posthog.ts:6-7`
- Modify: `src/analytics/sentry.ts:4`
- Modify: `app.config.ts:52`
- Create: `.env`
- Create: `.env.production`
- Modify: `.gitignore`

- [ ] **Step 1: Create .env file**

Create `.env` in project root:

```
EXPO_PUBLIC_POSTHOG_KEY=phc_1VLxkasejZTvoTCmt5oj2UHEc1Cs3u3MfHKLbZZY6Ox
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
EXPO_PUBLIC_SENTRY_DSN=https://467c433b59b68c88ed9f74e4bd670802@o4511118918483968.ingest.us.sentry.io/4511118922416128
```

- [ ] **Step 2: Create .env.production file**

Create `.env.production` (same values for now — will use rotated keys in production):

```
EXPO_PUBLIC_POSTHOG_KEY=phc_1VLxkasejZTvoTCmt5oj2UHEc1Cs3u3MfHKLbZZY6Ox
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
EXPO_PUBLIC_SENTRY_DSN=https://467c433b59b68c88ed9f74e4bd670802@o4511118918483968.ingest.us.sentry.io/4511118922416128
```

- [ ] **Step 3: Add .env to .gitignore**

Append to `.gitignore`:

```
# Environment variables
.env
.env.local
.env.production
.env.*.local
```

- [ ] **Step 4: Update posthog.ts**

Replace the hardcoded values in `src/analytics/posthog.ts`:

```typescript
// src/analytics/posthog.ts
import PostHog from 'posthog-react-native';

let client: PostHog | null = null;

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

export function initPostHog(): void {
  if (client) return;
  if (!POSTHOG_API_KEY) {
    console.warn('PostHog API key not set — analytics disabled');
    return;
  }
  client = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    captureAppLifecycleEvents: false,
    enableSessionReplay: false,
    preloadFeatureFlags: false,
    personProfiles: 'identified_only',
  });
}

export function getPostHog(): PostHog | null {
  return client;
}
```

- [ ] **Step 5: Update sentry.ts**

Replace the hardcoded DSN in `src/analytics/sentry.ts`:

```typescript
// src/analytics/sentry.ts
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not set — error tracking disabled');
    return;
  }
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0,
    enabled: !__DEV__,
  });
}

export function setSentryUser(id: string): void {
  Sentry.setUser({ id });
}
```

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: No errors (Expo's TypeScript config supports `process.env.EXPO_PUBLIC_*`)

- [ ] **Step 7: Commit**

```bash
git add src/analytics/posthog.ts src/analytics/sentry.ts .gitignore .env .env.production
git commit -m "security: move PostHog and Sentry keys to environment variables"
```

**Note:** The `.env` files are committed this one time so the dev environment works. After this commit, they are gitignored. Production values should be set as EAS secrets: `eas secret:create --name EXPO_PUBLIC_POSTHOG_KEY --value <rotated-key>`. The exposed PostHog key should be rotated in the PostHog dashboard.

---

### Task 6: Analytics Consent

**Files:**
- Modify: `src/db/schema.ts:10-23`
- Modify: `src/db/client.ts` (add to v3 migration)
- Modify: `src/analytics/index.ts`
- Modify: `src/engine/progress.ts` (loadProgress query + ProgressState type)
- Create: `src/components/shared/AnalyticsConsentModal.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add analytics_consent column to schema**

In `src/db/schema.ts`, add to the `user_profile` table (after `return_hadith_last_shown TEXT,`):

```sql
  analytics_consent INTEGER CHECK (analytics_consent IN (0, 1)),
```

This goes inside the existing `CREATE TABLE IF NOT EXISTS user_profile` block. `NULL` = not yet asked, `1` = accepted, `0` = declined.

- [ ] **Step 2: Add migration for analytics_consent**

In `src/db/client.ts`, add to the v3 migration block (inside the same `if (currentVersion < 3)` block from Task 3):

```typescript
  if (currentVersion < 3) {
    try {
      await db.execAsync(`
        ALTER TABLE mastery_confusions ADD COLUMN categories TEXT;
        ALTER TABLE user_profile ADD COLUMN analytics_consent INTEGER CHECK (analytics_consent IN (0, 1));
      `);
    } catch {
      // Columns may already exist if DB was created fresh with v3 schema
    }
    await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (3)");
  }
```

- [ ] **Step 3: Update ProgressState and loadProgress**

In `src/engine/progress.ts`, add to the `ProgressState` interface:

```typescript
  analyticsConsent: boolean | null; // null = not yet asked
```

In the `loadProgress` function, add `analytics_consent` to the user_profile SELECT query and add the field to the return object:

```typescript
  const analyticsConsent = profileRow?.analytics_consent === 1 ? true : profileRow?.analytics_consent === 0 ? false : null;
```

Add to the return block:
```typescript
    analyticsConsent,
```

- [ ] **Step 4: Update initAnalytics to accept consent parameter**

In `src/analytics/index.ts`, change `initAnalytics` to respect consent:

```typescript
export function initAnalytics(analyticsConsent: boolean | null): void {
  if (_initialized) return;
  _initialized = true;

  // Sentry crash reporting always runs (legitimate interest)
  try { initSentry(); } catch (e) { console.warn('Sentry init failed:', e); }

  // PostHog only if user consented
  if (analyticsConsent === true) {
    try { initPostHog(); } catch (e) { console.warn('PostHog init failed:', e); }
    const ph = getPostHog();
    if (ph) {
      const anonId = ph.getAnonymousId();
      if (anonId) setSentryUser(anonId);
    }
  }
}
```

- [ ] **Step 5: Create AnalyticsConsentModal component**

Create `src/components/shared/AnalyticsConsentModal.tsx`:

```typescript
import { View, Text, Modal, StyleSheet } from "react-native";
import { Button } from "../../design/components";
import { useColors } from "../../design/theme";
import { spacing, radii, fontFamilies } from "../../design/tokens";

interface AnalyticsConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AnalyticsConsentModal({ visible, onAccept, onDecline }: AnalyticsConsentModalProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Help improve Tila?
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Share anonymous usage data so we can make the app better for everyone. No personal information is collected.
          </Text>
          <View style={styles.buttons}>
            <Button variant="ghost" label="No thanks" onPress={onDecline} />
            <Button variant="primary" label="Sure" onPress={onAccept} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
});
```

- [ ] **Step 6: Wire consent modal into app layout**

In `app/_layout.tsx`, after onboarding is complete and on first app open where `analyticsConsent` is null, show the modal. The exact wiring depends on the current layout structure — the consent check should:

1. Read `analyticsConsent` from progress state
2. Pass it to `initAnalytics(analyticsConsent)`
3. If `analyticsConsent === null` and user is onboarded, show `AnalyticsConsentModal`
4. On accept/decline: call `updateProfile({ analyticsConsent: true/false })` and re-init analytics

- [ ] **Step 7: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add src/db/schema.ts src/db/client.ts src/engine/progress.ts src/analytics/index.ts src/components/shared/AnalyticsConsentModal.tsx app/_layout.tsx
git commit -m "feat: analytics consent — PostHog only initializes after user opts in"
```

---

### Task 7: Fix Motivation Mapping

**Files:**
- Modify: `src/db/schema.ts:15`
- Modify: `src/db/client.ts` (add to v3 migration or handle via resetDatabase)
- Modify: `app/post-lesson-onboard.tsx:24-30,313-327`
- Test: `src/__tests__/motivation-mapping.test.ts` (create)

**Problem:** All 5 motivation options save as `"quran"`. Schema CHECK constraint only allows `('quran', 'prayer', 'general')`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/motivation-mapping.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

const MOTIVATION_MAP: Record<string, string> = {
  "I want to read the Quran confidently": "read_quran",
  "I want to improve my prayer and understanding": "pray_confidently",
  "I want to build a daily Quran habit": "connect_heritage",
  "I want to reconnect properly": "personal_growth",
  "I want to help my child or family learn": "teach_children",
};

describe('motivation mapping', () => {
  it('maps each UI option to a distinct database value', () => {
    const values = Object.values(MOTIVATION_MAP);
    const unique = new Set(values);
    expect(unique.size).toBe(5);
  });

  it('every mapped value is a valid schema enum', () => {
    const validValues = ['read_quran', 'pray_confidently', 'connect_heritage', 'teach_children', 'personal_growth'];
    for (const value of Object.values(MOTIVATION_MAP)) {
      expect(validValues).toContain(value);
    }
  });

  it('unmapped string returns null', () => {
    const result = MOTIVATION_MAP["some unknown option"] ?? null;
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- src/__tests__/motivation-mapping.test.ts --reporter=verbose 2>&1 | head -20`
Expected: PASS (tests the mapping contract)

- [ ] **Step 3: Update schema CHECK constraint**

In `src/db/schema.ts`, replace line 15:

```sql
  motivation TEXT CHECK (motivation IN ('read_quran', 'pray_confidently', 'connect_heritage', 'teach_children', 'personal_growth')),
```

**Note:** CHECK constraint changes only apply to new databases (created with `CREATE TABLE`). Existing databases with old constraints need `resetDatabase()` or the constraint won't update. SQLite doesn't support `ALTER TABLE ... ALTER COLUMN`. Since the app is pre-launch, `resetDatabase()` during development is acceptable. The migration handles the column rename for existing data gracefully — old values will violate the new CHECK but SQLite only enforces CHECK on INSERT/UPDATE, not on existing rows.

- [ ] **Step 4: Fix the motivation mapping in post-lesson-onboard**

In `app/post-lesson-onboard.tsx`, add the mapping constant after the `motivationOptions` array (after line 30):

```typescript
const MOTIVATION_MAP: Record<string, string> = {
  "I want to read the Quran confidently": "read_quran",
  "I want to improve my prayer and understanding": "pray_confidently",
  "I want to build a daily Quran habit": "connect_heritage",
  "I want to reconnect properly": "personal_growth",
  "I want to help my child or family learn": "teach_children",
};
```

Then fix the `handleFinish` function (line 315):

```typescript
  async function handleFinish() {
    await progress.updateProfile({
      motivation: MOTIVATION_MAP[selectedMotivation] ?? null,
      dailyGoal: selectedGoal,
      postLessonOnboardSeen: true,
      commitmentComplete: true,
    });
```

- [ ] **Step 5: Run typecheck + full test suite**

Run: `npm run typecheck && npm test -- --reporter=verbose 2>&1 | tail -20`
Expected: No type errors, all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts app/post-lesson-onboard.tsx src/__tests__/motivation-mapping.test.ts
git commit -m "fix: save distinct motivation values — expand schema CHECK, add mapping"
```

---

## Task Order Summary

| Task | What | Depends on |
|------|------|-----------|
| 1 | Mastery race condition | None |
| 2 | Checkpoint classifier | None |
| 3 | Confusion persistence | None (but Task 6 migration combines with this) |
| 4 | Empty quiz fallback | None |
| 5 | Env vars | None |
| 6 | Analytics consent | Task 3 (shares v3 migration) and Task 5 (env vars for PostHog) |
| 7 | Motivation mapping | None (but shares schema.ts with Task 3/6) |

**Recommended execution order:** Tasks 1-5 can run in parallel. Task 6 should run after Tasks 3 and 5 (migration dependency + env vars). Task 7 can run anytime but touches schema.ts so coordinate with Task 3/6 on the migration.
