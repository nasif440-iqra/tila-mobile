# Testing Patterns

**Analysis Date:** 2026-03-28

## Test Framework

**Runner:**
- Vitest 4.1.2
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in (`expect`, `describe`, `it`)

**Mocking:**
- No mocking framework configured. Tests are written against real engine functions with no mocks.

**Run Commands:**
```bash
npm test              # vitest run (single run, CI-friendly)
npx vitest            # Watch mode (interactive dev)
npx vitest --coverage # Coverage (no coverage config detected)
```

## Test File Organization

**Location:**
- All tests in a single flat directory: `src/__tests__/`
- NOT co-located with source files

**Naming:**
- `{module-name}.test.js` for engine logic tests (majority)
- `{feature-name}.test.ts` for TypeScript contract tests (newer)

**Current test files (9 total, 3558 lines):**

| File | Lines | What it tests |
|------|-------|---------------|
| `src/__tests__/questions.test.js` | 1364 | All question generators (recognition, sound, contrast, harakat, checkpoint, review, connected forms) and shared utilities |
| `src/__tests__/mastery.test.js` | 702 | Entity key normalization, skill tracking, confusion tracking, SRS scheduling, mastery state derivation, migration, selectors |
| `src/__tests__/connectedForms.test.js` | 432 | Connected form exercise generation, connected reading exercises |
| `src/__tests__/selectors.test.js` | 319 | Lesson progression selectors, unlock logic, phase counts, daily goals, review planning |
| `src/__tests__/summaryAndReview.test.js` | 221 | Performance bands, summary messaging, review item extraction |
| `src/__tests__/letters.test.js` | 194 | Data completeness: connected forms for all letters, letter lookup, harakat data |
| `src/__tests__/outcome.test.js` | 187 | Lesson pass/fail thresholds per mode, outcome evaluation |
| `src/__tests__/quiz-contract.test.ts` | 78 | Type boundary: `deriveSkillBucket`, `mapQuizResultsToAttempts` mapping UI results to DB shape |
| `src/__tests__/data-loading.test.ts` | 61 | Type shape validation for `HabitState`, `ProgressState`, onboarding persistence contract |

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from "vitest";
import { functionUnderTest } from "../engine/module.js";

// ── Section header comment ──

describe("functionUnderTest", () => {
  it("describes expected behavior in plain English", () => {
    const result = functionUnderTest(input);
    expect(result).toBe(expected);
  });

  it("handles edge case", () => {
    expect(functionUnderTest(null)).toEqual({});
  });
});
```

**Key patterns:**
- Imports always explicit: `import { describe, it, expect } from "vitest"` (never global)
- Section headers using `// ── Name ──` comments to group related describe blocks
- Helper functions defined at top of file, above test suites
- No `beforeEach`/`afterEach` — tests are stateless and self-contained
- No `beforeAll`/`afterAll` — no setup/teardown needed (pure function tests)

**Assertion style:**
- `expect(result).toBe(value)` for primitives
- `expect(result).toEqual(object)` for objects/arrays
- `expect(result).toBeDefined()` for existence checks
- `expect(result).toContain(item)` for array membership
- `expect(result).toHaveProperty(key, value)` for object shape validation
- `expect(result).toHaveLength(n)` for array/string length
- `expect(result).toBeGreaterThan(n)` for numeric comparisons
- Custom error messages: `expect(value, \`id:${id} missing\`).toBeDefined()`

## Test Categories

**Unit Tests (all current tests):**
- Test pure engine functions with no side effects
- No database, no React, no network, no filesystem
- Input/output testing only: call function, assert return value

**Integration Tests:**
- Not present. No tests for hooks, components, DB layer, or screen flows.

**E2E Tests:**
- Not present. No Detox, Maestro, or similar framework.

**Component Tests:**
- Not present. No React Native Testing Library or similar.

## What is Well-Tested

**Thoroughly tested (high confidence):**
- Mastery state machine: entity tracking, skill tracking, confusion tracking, SRS scheduling, state derivation (`src/engine/mastery.js` via `src/__tests__/mastery.test.js`)
- Question generation: all 8+ lesson modes generate valid questions with correct structure (`src/engine/questions/` via `src/__tests__/questions.test.js`)
- Lesson outcome evaluation: pass/fail thresholds per mode (`src/engine/outcome.js` via `src/__tests__/outcome.test.js`)
- Selector logic: lesson progression, unlock conditions, review planning (`src/engine/selectors.js` via `src/__tests__/selectors.test.js`)
- Data completeness: every Arabic letter has connected forms, harakat data is complete (`src/data/` via `src/__tests__/letters.test.js`)
- Type boundary contracts: UI quiz results map correctly to DB schema (`src/types/quiz.ts` via `src/__tests__/quiz-contract.test.ts`)

## Test Coverage Gaps

**Not tested at all:**
- All React components (`src/components/`, `src/design/components/`)
- All screens (`app/` directory)
- All hooks (`src/hooks/`)
- Database layer (`src/db/client.ts`, `src/db/schema.ts`, `src/db/provider.tsx`)
- Analytics (`src/analytics/`)
- Audio player (`src/audio/player.ts`)
- Navigation flows and routing
- Error handling paths in DB/analytics code

**Partially tested:**
- Engine engagement module (`src/engine/engagement.js`) — performance bands and messaging tested, but not engagement scoring
- Engine features module (`src/engine/features.js`) — not directly tested

## Common Test Patterns

**Testing pure functions with null/edge cases:**
```typescript
describe("normalizeEntityKey", () => {
  it("normalizes numeric targetId to letter key", () => {
    expect(normalizeEntityKey(2, {})).toBe("letter:2");
  });

  it("returns unknown for unrecognized strings", () => {
    expect(normalizeEntityKey("weirdthing", {})).toBe("unknown:weirdthing");
  });
});
```

**Testing data completeness (validation-style tests):**
```typescript
describe("CONNECTED_FORMS — completeness", () => {
  it("has an entry for every letter in ARABIC_LETTERS", () => {
    for (const letter of ARABIC_LETTERS) {
      expect(
        CONNECTED_FORMS[letter.id],
        `Missing entry for id:${letter.id} (${letter.name})`
      ).toBeDefined();
    }
  });
});
```

**Helper factories for test data:**
```typescript
function makeLesson(overrides = {}) {
  return {
    id: 100,
    phase: 4,
    lessonMode: "connected-forms",
    teachIds: [2, 3],
    reviewIds: [],
    ...overrides,
  };
}

function makeResults(correct, total) {
  return Array.from({ length: total }, (_, i) => ({ correct: i < correct }));
}
```

**Validator helper reuse:**
```typescript
// Reuses production validator in tests
function assertValidQuestion(q) {
  const result = validateQuestion(q);
  if (!result.valid) {
    throw new Error(`Question failed validation: ${result.reason}`);
  }
}
```

**Testing type contracts (TypeScript-specific):**
```typescript
describe("onboarding persistence contract", () => {
  it("UserProfileUpdate accepts the fields handleFinish writes", () => {
    const payload: UserProfileUpdate = {
      onboarded: true,
      onboardingVersion: 2,
      startingPoint: "new",
      commitmentComplete: true,
    };
    expect(payload).toHaveProperty("onboarded", true);
  });
});
```

## Adding New Tests

**Where to put new tests:**
- Engine logic: `src/__tests__/{module-name}.test.js` (or `.test.ts` for new TS modules)
- Type contracts: `src/__tests__/{feature}-contract.test.ts`

**Test file template:**
```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "../engine/myModule.js";

describe("myFunction", () => {
  it("handles the happy path", () => {
    const result = myFunction(validInput);
    expect(result).toEqual(expectedOutput);
  });

  it("handles null input gracefully", () => {
    expect(myFunction(null)).toEqual(defaultValue);
  });

  it("handles edge case", () => {
    expect(myFunction(edgeInput)).toBe(edgeExpected);
  });
});
```

**Conventions to follow:**
1. Always import `describe`, `it`, `expect` explicitly from `"vitest"`
2. Use `// ── Section ──` comments to separate logical groups
3. Test only pure functions — do not import React or native modules
4. Provide descriptive `it` strings that read as sentences
5. Use helper factories for test data, defined at top of file
6. No mocking — if something needs mocking, it indicates a coupling issue
7. Include null/undefined/empty edge cases for every function

---

*Testing analysis: 2026-03-28*
