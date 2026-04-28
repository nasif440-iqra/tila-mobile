# Testing Patterns

**Analysis Date:** 2026-04-27

## Test Framework

**Runner:**
- **Vitest 4.1.2** (NOT Jest) — see `package.json:68`
- Config: `vitest.config.ts`
- Test mode: `vitest run` (one-shot, no watch by default)
- Coverage provider: `@vitest/coverage-v8` 4.1.2 (V8 engine, not Istanbul)

**Assertion Library:**
- Vitest's built-in `expect()` (Jest-compatible matchers)
- Common matchers used: `.toBe`, `.toEqual`, `.toBeNull`, `.toBeUndefined`, `.toBeDefined`, `.toBeGreaterThan`, `.toMatch`, `.toContain`, `.toHaveProperty`, `.toHaveBeenCalledWith`, `.resolves.toBeUndefined()`

**Mocking:**
- `vi` from `vitest` — `vi.fn()`, `vi.mock()`, `vi.clearAllMocks()`
- All native-module mocks centralized in `src/__tests__/setup.ts` (see "Setup" below)

**Run Commands:**
```bash
npm test                  # Vitest one-shot run (vitest run)
npm run coverage          # Vitest with V8 coverage (text + json-summary)
npm run validate          # Lint + typecheck (NOT tests — run npm test separately)
```
There is no watch script; invoke `npx vitest` directly when iterating.

## Test File Organization

**Location:**
- All tests live under `src/__tests__/` (centralized, **not** co-located with source)
- Curriculum-specific tests are grouped: `src/__tests__/curriculum/*.test.ts`
- Test helpers under `src/__tests__/helpers/` (`mock-db.ts`, `mock-supabase.ts`)

**Glob (from `vitest.config.ts:5`):**
```ts
include: ["src/__tests__/**/*.test.{js,ts}"]
```

**Naming:**
- `<feature-or-area>.test.ts` for new TypeScript tests
- Two legacy `.test.js` files remain (`letters.test.js`, `mastery.test.js`) — both still run; new tests should prefer `.ts`

**Current scale:**
- ~49 root-level tests + 6 curriculum-specific tests = ~55 total spec files

**Structure:**
```
src/__tests__/
├── setup.ts                           # Global mocks (Vitest setupFiles)
├── helpers/
│   ├── mock-db.ts                     # In-memory SQLite mock factory
│   └── mock-supabase.ts               # In-memory Supabase mock factory
├── curriculum/                        # Curriculum-system tests (post-2026-04-20 reset)
│   ├── completion-store.test.ts       # AsyncStorage completion-flag persistence
│   ├── lesson-01-shape.test.ts        # Lesson-1 schema/shape contract
│   ├── mastery-recorder.test.ts       # MasteryRecorder interface contract
│   ├── outcome.test.ts                # computeLessonOutcome pass/fail logic
│   ├── read-exercise-contract.test.ts # Type-level required-field assertions
│   └── url-resolver.test.ts           # Expo Router param → lesson-id mapping
├── curriculum-cursor.test.ts          # advanceCursor/retreatCursor pure logic
├── mastery-pipeline.test.ts           # Engine mastery merge/state derivation
├── mastery.test.js                    # Legacy mastery key/skill helpers
├── letters.test.js                    # Connected-forms data completeness
├── audio-safety.test.ts               # Source-text assertions on player.ts
├── auth-flow.test.ts                  # Supabase auth wrapper functions
├── sync-service.test.ts               # Cloud-sync push/pull
├── db-init.test.ts                    # DatabaseProvider state-machine + timeout
├── schema-v5.test.ts, schema-v6.test.ts  # SQLite schema regression
├── migration-v2.test.ts               # Schema migration regression
├── confusion-persistence.test.ts, review-mastery-save.test.ts, habit-race.test.ts,
├── midnight-redirect.test.ts, integration-onboarding.test.ts,
├── integration-premium-locking.test.ts, integration-restore-purchases.test.ts,
├── monetization-events.test.ts, restore-purchases.test.ts, revenuecat-guard.test.ts,
├── subscription-types.test.ts, trial-badge.test.ts, upgrade-card.test.ts
├── home-hero.test.ts, home-streak.test.ts, empty-state.test.ts,
├── error-boundary.test.ts, app-loading.test.ts, lock-icon.test.ts,
├── wird-tooltip.test.ts, onboarding-flow.test.ts, onboarding-animations.test.ts,
├── animations.test.ts, atmosphere-background.test.ts, bismillah.test.ts,
├── arabic-typography.test.ts, crescent-icon.test.ts, floating-letters-fix.test.ts,
├── reduce-motion.test.ts, warm-glow.test.ts, haptics.test.ts,
├── quiz-contract.test.ts, quiz-correct-feedback.test.ts, data-loading.test.ts,
└── scaffold-cleanup.test.ts           # Asserts deleted scaffold files stay deleted
```

## Test Categories

| Category | Examples | Approach |
|----------|----------|----------|
| **Curriculum runtime** (pure) | `curriculum-cursor.test.ts`, `curriculum/outcome.test.ts`, `curriculum/url-resolver.test.ts` | Direct unit tests of pure functions — no mocks, no I/O |
| **Curriculum data shape** | `curriculum/lesson-01-shape.test.ts`, `curriculum/read-exercise-contract.test.ts` | Assert lesson JSON conforms to spec (screen IDs, entity keys, audio paths, structural invariants); use `@ts-expect-error` to prove required fields |
| **Curriculum persistence** | `curriculum/completion-store.test.ts`, `curriculum/mastery-recorder.test.ts` | In-test `vi.mock` of `@react-native-async-storage/async-storage`; round-trip key/value behavior |
| **Engine** | `mastery-pipeline.test.ts`, `mastery.test.js`, `letters.test.js` | Pure-function tests against engine modules in `src/engine/` and data in `src/data/` |
| **Database** | `db-init.test.ts`, `schema-v5.test.ts`, `schema-v6.test.ts`, `migration-v2.test.ts`, `confusion-persistence.test.ts`, `review-mastery-save.test.ts` | Mix of source-text regression assertions (`fs.readFileSync` + regex) and mock-DB round-trips via `helpers/mock-db.ts` |
| **Auth & sync** | `auth-flow.test.ts`, `sync-service.test.ts` | `vi.mock` Supabase singleton via `helpers/mock-supabase.ts`; assert real auth wrappers call the SDK with the right args |
| **Monetization** | `restore-purchases.test.ts`, `revenuecat-guard.test.ts`, `subscription-types.test.ts`, `monetization-events.test.ts`, `trial-badge.test.ts`, `upgrade-card.test.ts`, `integration-premium-locking.test.ts`, `integration-restore-purchases.test.ts` | RevenueCat is mocked globally in `setup.ts`; tests inspect call args and gate behavior |
| **Audio safety** | `audio-safety.test.ts` | Reads `src/audio/player.ts` source and regex-checks that `playVoice`/`playSFX` have try/catch, log via `console.warn`, and never re-throw |
| **UI / animation** | `home-hero.test.ts`, `bismillah.test.ts`, `arabic-typography.test.ts`, `animations.test.ts`, `reduce-motion.test.ts`, `warm-glow.test.ts`, `crescent-icon.test.ts`, `floating-letters-fix.test.ts`, `atmosphere-background.test.ts`, `lock-icon.test.ts`, `wird-tooltip.test.ts` | Most are source-text assertions or token/style assertions; React Native components are not rendered (no react-native-testing-library) |
| **Onboarding** | `onboarding-flow.test.ts`, `onboarding-animations.test.ts`, `integration-onboarding.test.ts`, `midnight-redirect.test.ts` | Mock-DB-driven engine assertions for state transitions |
| **Hygiene / regression** | `scaffold-cleanup.test.ts`, `error-boundary.test.ts`, `app-loading.test.ts`, `data-loading.test.ts`, `empty-state.test.ts`, `quiz-contract.test.ts`, `quiz-correct-feedback.test.ts`, `haptics.test.ts` | Locks in invariants like "Expo scaffold files stay deleted" or "haptic feedback is wired to the right events" |

## Test Structure

**Standard suite layout:**
```ts
import { describe, it, expect } from "vitest";
import { computeLessonOutcome } from "../../curriculum/runtime/outcome";
import type { LessonData, ExerciseScreen, TapExercise } from "../../curriculum/types";

describe("computeLessonOutcome", () => {
  it("trivial pass when no scored screens exist", () => {
    const l = lesson([scored("a", { scored: false })]);
    const outcome = computeLessonOutcome(l, new Map());
    expect(outcome.passed).toBe(true);
    expect(outcome.itemsTotal).toBe(0);
  });
});
```
(Pattern from `src/__tests__/curriculum/outcome.test.ts`.)

**Patterns observed:**
- One top-level `describe` per module-or-function under test; nested `describe` is rare
- Helper factories defined at the top of the file when many test cases need similar fixtures (e.g., `tap()`, `scored()`, `lesson()` in `outcome.test.ts:9-46`)
- One assertion concept per `it` — multiple `expect()` calls allowed when they describe a single behavior
- Use `beforeEach(() => { vi.clearAllMocks(); /* or mockStore.clear() */ })` to isolate state between tests (`auth-flow.test.ts:32`, `completion-store.test.ts:24`)

## Setup

**Global setup file:** `src/__tests__/setup.ts` (declared in `vitest.config.ts:6`)

Mocks the following native modules so source code can `import` them inside Node:

| Module | Mock behavior |
|--------|---------------|
| `posthog-react-native` | `default` is a class with no-op `capture/identify/flush`, `getAnonymousId() → null` |
| `@sentry/react-native` | All methods are `vi.fn()` |
| `react-native-purchases` | `getCustomerInfo` resolves to empty entitlements; `configure`/`setLogLevel`/listener methods are `vi.fn()`. `LOG_LEVEL.VERBOSE = "VERBOSE"` |
| `react-native-purchases-ui` | `presentPaywall` resolves to `0` (NOT_PRESENTED); `PAYWALL_RESULT` enum mirrored |
| `react-native` | `Platform.OS = "ios"`; `Alert.alert = vi.fn()`; `StyleSheet.create` is identity; `View/Text/Pressable` are string stubs |
| `expo-haptics` | All async methods `vi.fn()`; `ImpactFeedbackStyle` and `NotificationFeedbackType` enums mirrored |
| `react-native-svg` | All exports stubbed as strings |
| `react-native-reanimated` | `useSharedValue` returns `{ value }`; `useAnimatedStyle` runs the function once; `withTiming/withDelay/withSpring` are identity; `FadeIn.delay` returns `{}`; `Easing.*` are identity helpers |

**What's NOT mocked globally:**
- `expo-sqlite` — tests use `helpers/mock-db.ts` per-test
- `@supabase/supabase-js` — tests use `helpers/mock-supabase.ts` per-test
- `@react-native-async-storage/async-storage` — tests `vi.mock` it locally with their own in-memory map (see `curriculum/completion-store.test.ts:5-19`)

## Mocking

**Per-test SQLite mock (`src/__tests__/helpers/mock-db.ts`):**
```ts
import { createMockDb } from './helpers/mock-db';
const db = createMockDb({ user_profile: [FRESH_PROFILE] });
// Exposes: getAllAsync, getFirstAsync, runAsync, execAsync, withExclusiveTransactionAsync
// All FROM-table parsing is regex-based; assertions usually go through db._tables
```
Use this for any code that imports `useDatabase()` or accepts a `SQLiteDatabase` parameter.

**Per-test Supabase mock (`src/__tests__/helpers/mock-supabase.ts`):**
```ts
vi.mock('../../src/auth/supabase', async () => {
  const { createMockSupabase } = await import('./helpers/mock-supabase');
  return { supabase: createMockSupabase() };
});
```
- Provides `from(table).select/upsert/insert/delete` chains and an `auth` object with `vi.fn()` mocks for `signInWithPassword`, `signUp`, `signOut`, `signInWithIdToken`, `onAuthStateChange`, `getSession`, `updateUser`.
- `_data` and `_lastUpsertCall` are exposed for assertions.

**Local AsyncStorage mock (curriculum tests):**
```ts
const mockStore = new Map<string, string>();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    setItem: vi.fn(async (k, v) => { mockStore.set(k, v); }),
    getItem: vi.fn(async (k) => mockStore.get(k) ?? null),
    removeItem: vi.fn(async (k) => { mockStore.delete(k); }),
    multiRemove: vi.fn(async (keys) => { for (const k of keys) mockStore.delete(k); }),
    getAllKeys: vi.fn(async () => Array.from(mockStore.keys())),
  },
}));
```
(From `src/__tests__/curriculum/completion-store.test.ts:3-19`.) Pattern: declare `mockStore` outside the factory so the test body can clear it in `beforeEach`.

**What to mock:**
- Native modules that throw on `require` outside React Native runtime (haptics, reanimated, svg, sqlite, secure-store)
- External services with side effects (Supabase, RevenueCat, PostHog, Sentry)
- AsyncStorage and other persistence layers (per-test, with in-memory map)

**What NOT to mock:**
- Pure functions in `src/curriculum/runtime/*` and `src/engine/*` — call them directly
- The function under test — never mock the unit being verified

## Source-Text Assertions

A distinctive pattern: several tests assert structural invariants by reading source files and regex-matching their contents. Use this only for "this code path must continue to exist" regressions, not for behavior verification.

**Examples:**
- `src/__tests__/audio-safety.test.ts` — confirms `playVoice` and `playSFX` in `src/audio/player.ts` have try/catch, log via `console.warn`, and don't re-throw
- `src/__tests__/db-init.test.ts` — confirms `DatabaseProvider` keeps its 15-second timeout, `attemptRef` guard, and three-state machine
- `src/__tests__/schema-v6.test.ts` — confirms `CREATE TABLE user_profile` includes the `name TEXT` column
- `src/__tests__/scaffold-cleanup.test.ts` — confirms deleted Expo-scaffold files stay deleted

**Pattern:**
```ts
import * as fs from "fs";
import * as path from "path";

const source = fs.readFileSync(path.resolve(__dirname, "../audio/player.ts"), "utf-8");
expect(source).toMatch(/\.catch\s*\(/);
```

## Type-Level Assertions

Used to lock in required-field contracts on data types so future authors can't break the spec silently. Pattern from `src/__tests__/curriculum/read-exercise-contract.test.ts:5-25`:

```ts
it("requires audioModel — SPEC Constraint 2 (no-cueing)", () => {
  // @ts-expect-error — audioModel is required; Read without a model is incoherent.
  const _bad: ReadExercise = {
    type: "read", prompt: "...", target: "letter:ba", display: "بَ",
  };
  void _bad;

  const ok: ReadExercise = { /* with audioModel */ };
  expect(ok.audioModel.length).toBeGreaterThan(0);
});
```
The `@ts-expect-error` comment fails the typecheck if the field becomes optional — that's the actual assertion.

## Async Testing

```ts
// Resolves without throwing
await expect(noopMasteryRecorder.recordEntityAttempt(event)).resolves.toBeUndefined();

// Awaited result, then assert
const result = await signInWithEmail("test@example.com", "password123");
expect(result.error).toBeNull();
expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: ..., password: ... });
```

## Coverage

**Configuration (`vitest.config.ts:7-12`):**
```ts
coverage: {
  provider: "v8",
  reporter: ["text", "json-summary"],
  include: ["src/**/*.{ts,tsx,js,jsx}", "app/**/*.{ts,tsx,js,jsx}"],
  exclude: ["src/__tests__/**", "node_modules/**"],
}
```

**Run:**
```bash
npm run coverage
```

**Thresholds:** None enforced. Coverage is tracked but not gated.

**Reports written to:** `coverage/` (gitignored)

## Common Patterns

**Use Map literals for outcome dictionaries:**
```ts
const map = new Map(screens.map((s) => [s.id, { screenId: s.id, correct: true, entityAttempts: [] }]));
```
(`outcome.test.ts:61`) — keeps fixture construction terse and matches the runtime's `Map<string, ScreenOutcome>` shape.

**Pure-function tests should pin both happy and defensive cases:**
```ts
it("handles defensive inputs (negative total, negative current)", () => {
  expect(advanceCursor(5, -3)).toEqual({ nextIndex: null, complete: true });
  expect(advanceCursor(-1, 3)).toEqual({ nextIndex: 0, complete: false });
});
```
(`curriculum-cursor.test.ts:22-25`) — `cursor.ts` and `outcome.ts` defensively handle invalid inputs; tests document the chosen behavior.

**Always `vi.clearAllMocks()` in `beforeEach` when reusing module-level mocks:**
```ts
beforeEach(() => {
  vi.clearAllMocks();
});
```
(`auth-flow.test.ts:32-34`)

## Adding New Tests

**For curriculum runtime / engine (pure logic):**
- Place in `src/__tests__/curriculum/<feature>.test.ts` or `src/__tests__/<feature>.test.ts`
- Direct imports from the module under test, no mocks
- Cover happy path + defensive inputs

**For data shape contracts (lesson JSON, exercise types):**
- Place in `src/__tests__/curriculum/<lesson-or-type>-shape.test.ts`
- Use `@ts-expect-error` to assert required fields; runtime asserts to validate value invariants (entity keys in known set, audio paths non-empty, IDs unique)

**For SQLite-backed code:**
- Use `createMockDb` from `helpers/mock-db.ts`
- Pre-seed `initialTables` with the rows the code will read
- Inspect `db._tables` after the call, or assert against `runAsync`/`execAsync` mock calls

**For auth or sync code:**
- `vi.mock('../../src/auth/supabase')` with a factory that returns `createMockSupabase()`
- Import the real auth wrapper functions; they will use the mocked client
- Assert against `supabase.auth.signInWithPassword.mock.calls` etc.

**For native-module dependents:**
- Check `src/__tests__/setup.ts` first — it may already be mocked globally
- If not, add the mock to `setup.ts` (do not add per-test) so all tests share a stable baseline

---

*Testing analysis: 2026-04-27*
