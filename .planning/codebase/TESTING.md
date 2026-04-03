# Testing Patterns

**Analysis Date:** 2026-04-03

## Test Framework

**Runner:**
- Vitest 4.1.2
- Config: `vitest.config.ts`
- Node-based (no browser/DOM environment)

**Assertion Library:**
- Vitest built-in `expect()` API
- Imported from `vitest`: `import { describe, it, expect } from "vitest"`

**Run Commands:**
```bash
npm test                    # Run all tests once
npm run lint               # ESLint check (syntax/style)
npm run typecheck          # TypeScript compilation check
npm run validate           # Both lint and typecheck
npm run coverage           # Generate coverage report (V8-based)
```

**Coverage tool:**
- `@vitest/coverage-v8` 4.1.2
- Reporter: text and json-summary
- Includes: `src/**/*.{ts,tsx,js,jsx}`, `app/**/*.{ts,tsx,js,jsx}`
- Excludes: test files and node_modules

## Test File Organization

**Location:**
- Co-located in `src/__tests__/` directory (not alongside source files)
- 80+ test files total, organized by feature/domain

**Naming:**
- Pattern: `[feature].test.ts` or `[feature].test.js`
- Examples: `mastery.test.js`, `quiz-question.test.ts`, `lesson-completion-atomic.test.ts`

**Structure:**
```
src/__tests__/
├── animations.test.ts           # Animation/Reanimated tests
├── auth-flow.test.ts             # Auth system tests
├── db-init.test.ts               # Database initialization tests
├── error-boundary.test.ts         # Error boundary regression tests
├── integration-lesson-completion.test.ts   # Integration tests
├── mastery.test.js               # Business logic tests (no React)
├── questions.test.js             # Question generation tests
├── quiz-*.test.ts                # Quiz component tests
├── setup.ts                      # Global test setup/mocks
└── helpers/
    ├── mock-db.ts                # Database mock helpers
    └── mock-supabase.ts          # Supabase mock helpers
```

## Test Structure

**Suite Organization:**

Pure function tests (from `src/__tests__/mastery.test.js`):
```javascript
describe("normalizeEntityKey", () => {
  it("normalizes numeric targetId to letter key", () => {
    expect(normalizeEntityKey(2, {})).toBe("letter:2");
  });

  it("normalizes harakat string to combo key", () => {
    expect(normalizeEntityKey("ba-fatha", { isHarakat: true })).toBe("combo:ba-fatha");
  });

  it("returns unknown for unrecognized strings", () => {
    expect(normalizeEntityKey("weirdthing", {})).toBe("unknown:weirdthing");
  });
});
```

Component/regression tests (from `src/__tests__/quiz-question.test.ts`):
```typescript
describe("LES-03: QuizQuestion correct feedback", () => {
  it("renders QuizOption with state prop for correct/wrong feedback", () => {
    expect(source).toMatch(/optionState/);
    expect(source).toMatch(/state={optionState}/);
  });

  it("does NOT import from design/haptics (haptics owned by QuizOption)", () => {
    expect(source).not.toMatch(/import.*from.*design\/haptics/);
  });
});
```

**Patterns:**
- Nested `describe()` blocks for logical grouping of related tests
- Each `it()` test verifies single behavior
- Test names describe expected behavior (not "test X works")
- Setup is minimal; most tests are pure function verification
- No explicit `beforeEach` or `afterEach`; state isolation via pure functions

## Mocking

**Framework:** Vitest `vi` module for mocking

**Global Setup:**
- File: `src/__tests__/setup.ts` (configured in `vitest.config.ts`)
- Runs before all tests
- Mocks native modules that can't run in Node environment

**Mocks defined in setup.ts:**
```typescript
// Analytics (PostHog, Sentry)
vi.mock("posthog-react-native", () => ({
  default: class PostHog {
    capture() {}
    identify() {}
    flush() {}
    getAnonymousId() { return null; }
  },
}));

vi.mock("@sentry/react-native", () => ({
  init: vi.fn(),
  setUser: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

// Subscriptions (RevenueCat)
vi.mock("react-native-purchases", () => ({
  default: {
    getCustomerInfo: vi.fn().mockResolvedValue({
      entitlements: { active: {}, all: {} },
      managementURL: null,
    }),
    addCustomerInfoUpdateListener: vi.fn(),
    removeCustomerInfoUpdateListener: vi.fn(),
    configure: vi.fn(),
    setLogLevel: vi.fn(),
  },
  LOG_LEVEL: { VERBOSE: "VERBOSE" },
}));

// React Native & Animations
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
  Alert: { alert: vi.fn() },
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
}));

vi.mock("react-native-reanimated", () => {
  const identity = (v: unknown) => v;
  return {
    default: { View: "Animated.View", createAnimatedComponent: (c: unknown) => c },
    useSharedValue: vi.fn((v: unknown) => ({ value: v })),
    useAnimatedStyle: vi.fn((fn: () => unknown) => fn()),
    withTiming: vi.fn((v: unknown) => v),
    withDelay: vi.fn((_d: unknown, v: unknown) => v),
    withSpring: vi.fn((v: unknown) => v),
  };
});
```

**What to Mock:**
- Native modules (React Native, Expo)
- External services (analytics, subscriptions, auth)
- Platform-specific code (haptics, audio)
- Third-party SDKs with side effects

**What NOT to Mock:**
- Pure business logic functions (mastery calculation, question generation)
- Data/selectors (allowed to run as-is)
- Utility helpers (array shuffle, parsing)
- Application logic under test (should run real code)

## Fixtures and Factories

**Test Data:**
Mastery test (from `src/__tests__/mastery.test.js`):
```javascript
const existing = { correct: 3, attempts: 5, lastSeen: "2026-03-24" };
const result = recordEntityAttempt(existing, { correct: true }, "2026-03-25");

// Inline fixture data for specific scenarios
const entities = {
  "letter:1": { correct: 1, attempts: 1 },
  "letter:2": { correct: 4, attempts: 5, sessionStreak: 2, intervalDays: 3 },
  "letter:4": { correct: 9, attempts: 10, sessionStreak: 4, intervalDays: 14, nextReview: "2026-04-09" },
};
```

**Location:**
- Fixtures defined inline in test files (not extracted to separate files)
- Helper functions in `src/__tests__/helpers/`: `mock-db.ts`, `mock-supabase.ts`
- Test data follows production types (e.g., `EntityState`, `Question`)

**Factories:**
- Used for repetitive test setup
- Example from `src/__tests__/questions.test.js`:
  ```javascript
  function assertValidQuestion(q) {
    const result = validateQuestion(q);
    if (!result.valid) {
      throw new Error(`Question failed validation: ${result.reason}`);
    }
  }

  function findLesson(predicate) {
    const lesson = LESSONS.find(predicate);
    if (!lesson) throw new Error("No lesson found matching predicate");
    return lesson;
  }
  ```

## Coverage

**Requirements:** Not enforced (no minimum threshold set)

**View Coverage:**
```bash
npm run coverage
# Generates text report in console and JSON summary
```

**Coverage config** (from `vitest.config.ts`):
```typescript
coverage: {
  provider: "v8",
  reporter: ["text", "json-summary"],
  include: ["src/**/*.{ts,tsx,js,jsx}", "app/**/*.{ts,tsx,js,jsx}"],
  exclude: ["src/__tests__/**", "node_modules/**"],
}
```

## Test Types

**Unit Tests:**
- Scope: Pure functions (business logic, selectors, question generation)
- Approach: Input → output verification
- Examples: `mastery.test.js`, `questions.test.js`, `selectors.test.js`
- Run independently; no setup required beyond module mocks

**Integration Tests:**
- Scope: Multi-component flows (lesson completion, onboarding, auth)
- Approach: State mutations, database operations, event tracking
- Examples: `integration-lesson-completion.test.ts`, `integration-onboarding.test.ts`
- Include: Database setup, auth state, session tracking

**Regression/Regression Tests:**
- Scope: Validate fixes for specific bugs or design decisions
- Approach: File content inspection (regex matching on source code)
- Examples: `db-init.test.ts`, `lesson-completion-atomic.test.ts`, `error-boundary.test.ts`
- Pattern: `fs.readFileSync()` + source code inspection to verify implementation details

**E2E Tests:**
- Framework: Not used currently
- Future: Detox or Maestro for end-to-end testing (separate milestone)

## Common Patterns

**Async Testing:**
```typescript
// From auth provider test
const handleSignInWithEmail = useCallback(
  async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await emailSignIn(email, password);
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  },
  []
);

// Test pattern
it("handles sign-in errors gracefully", async () => {
  const result = await handleSignInWithEmail("user@test.com", "password");
  expect(result.error).toBe(null); // or verify error condition
});
```

**Error Testing:**
```typescript
// From mastery.test.js
it("returns recognized confusion key", () => {
  const key = deriveConfusionKey({
    correct: false,
    targetKey: "letter:2",
    selectedKey: "letter:3",
  });
  expect(key).toBe("recognition:2->3");
});

it("returns null for correct answers", () => {
  expect(deriveConfusionKey({ correct: true })).toBeNull();
});
```

**Source Code Inspection (Regression Testing):**
```typescript
// From db-init.test.ts — validates implementation without running code
const providerSrc = fs.readFileSync(
  path.resolve(__dirname, "../db/provider.tsx"),
  "utf-8"
);

describe("DatabaseProvider — Bug 1 regression", () => {
  it("handles getDatabase rejection (not hang)", () => {
    expect(providerSrc).toMatch(/\.catch\s*\(/);
    expect(providerSrc).toMatch(/getDatabase\(\)/);
  });

  it("has a 15-second timeout", () => {
    expect(providerSrc).toMatch(/15[_,]?000/);
    expect(providerSrc).toMatch(/setTimeout/);
  });
});
```

**Validation Testing:**
```typescript
// From questions.test.js
function assertValidQuestion(q) {
  const result = validateQuestion(q);
  if (!result.valid) {
    throw new Error(`Question failed validation: ${result.reason}`);
  }
}

describe("generateRecognitionQs", () => {
  it("generates valid questions for recognition mode", () => {
    const lesson = findLesson(l => l.lessonMode === "recognition");
    const questions = generateRecognitionQs(lesson);
    questions.forEach(q => assertValidQuestion(q));
  });
});
```

## Test Execution

**Running tests:**
- Local: `npm test` (single run)
- Watch mode: Vitest supports watch but not explicitly configured in scripts
- Coverage: `npm run coverage` (generates V8 report)

**Test environment:**
- Node.js (no browser DOM)
- Native modules mocked globally via `setup.ts`
- No need for `@testing-library/react-native` (tests verify logic, not UI rendering)

**Debugging:**
- Test failures output clear error messages with file path and assertion failure
- Source code inspection tests help identify implementation issues before runtime
- No debugger integration configured; console.log acceptable for investigation

---

*Testing analysis: 2026-04-03*
