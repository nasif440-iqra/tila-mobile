# Coding Conventions

**Analysis Date:** 2026-04-27

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` — `LessonRunner.tsx`, `LessonChrome.tsx`, `TapExercise.tsx`, `HearExercise.tsx`, `ReadExercise.tsx`
- Pure utilities/runtime modules: `kebab-case.ts` — `mastery-recorder.ts`, `completion-store.ts`, `url-resolver.ts`, `cursor.ts`, `outcome.ts`
- Hooks: `useCamelCase.ts` with `use` prefix — `useProgress.ts`, `useMastery.ts`, `useHabit.ts`, `useThemePreference.ts`
- Engine modules: lowercase single word — `mastery.ts`, `progress.ts`, `habit.ts`, `dateUtils.ts`, `features.ts`
- Auth modules: lowercase domain word — `apple.ts`, `google.ts`, `email.ts`, `provider.tsx`, `supabase.ts`, `types.ts`
- Lesson data files: `lesson-NN.ts` (zero-padded) — `src/curriculum/lessons/lesson-01.ts`
- Test files: `*.test.{ts,js}` co-located in `src/__tests__/` — `curriculum-cursor.test.ts`, `mastery.test.js`
- Test helpers: `helpers/mock-*.ts` — `src/__tests__/helpers/mock-db.ts`, `src/__tests__/helpers/mock-supabase.ts`

**Directories:**
- Domain folders use kebab-case or single-word lowercase: `src/curriculum/`, `src/curriculum/runtime/`, `src/curriculum/ui/exercises/`, `src/curriculum/lessons/`
- Test grouping mirrors source: `src/__tests__/curriculum/` for curriculum-specific tests

**Functions:**
- Exported pure functions: `camelCase` — `advanceCursor`, `retreatCursor`, `computeLessonOutcome`, `resolveLessonId`, `normalizeEntityKey`, `mergeQuizResultsIntoMastery`
- React components: `PascalCase` — `LessonRunner`, `TapExercise`, `AuthProvider`, `LessonChrome`
- Event handlers: `handle` prefix — `handleTap`, `handleCheck`, `handleReplay`, `handleContinue`, `handleSignInWithEmail`, `handleSignOut`
- Helper/internal: descriptive `camelCase` — `playModelAudio`, `keyFor`, `emitEntityAttempts`, `confirmExit`, `isScored`, `isDecoding`
- Type guards: `is` prefix — `isScored(screen)`, `isDecoding(screen)` in `src/curriculum/runtime/outcome.ts`
- Selectors / derived getters: `get` or `derive` prefix — `deriveMasteryState`, `deriveSkillKeysFromQuestion`, `deriveConfusionKey`, `getCompletion`

**Variables:**
- Local state: `camelCase` — `authState`, `optionStates`, `locked`, `playing`, `reduceMotion`, `isComplete`
- React state setters: `set` + PascalCase — `setAuthState`, `setOptionStates`, `setIsComplete`, `setReduceMotion`
- Refs: descriptive name + `Ref` suffix — `outcomesRef`, `lockTimer`, `audioTimer`, `advanceTimerRef`, `wrongTimerRef`, `attemptRef`, `initializedRef`
- Constants: `SCREAMING_SNAKE_CASE` — `READ_ATTEMPT_DELAY_MS`, `READ_AUDIO_DURATION_MS`, `FADE_MS`, `WRONG_FEEDBACK_MS`, `CORRECT_ADVANCE_MS`, `KEY_PREFIX`, `INITIAL_STATE`, `EXPECTED_SCREEN_IDS`, `KNOWN_ENTITY_KEYS`, `PART_LABELS`

**Types:**
- Interfaces / type aliases: `PascalCase` — `LessonData`, `Screen`, `TeachingScreen`, `ExerciseScreen`, `Exercise`, `TapExercise`, `HearExercise`, `ReadExercise`, `EntityAttempt`, `ScreenOutcome`, `LessonOutcome`, `MasteryRecorder`, `EntityAttemptEvent`, `LessonOutcomeEvent`, `CompletionStore`, `AuthState`, `AuthContextValue`, `AdvanceResult`, `RetreatResult`
- Discriminated-union member field is `kind` (`"teach" | "exercise"`) on `Screen`, and `type` (`"tap" | "hear" | "read" | …`) on `Exercise` and `TeachingBlock` (`src/curriculum/types.ts`)
- Entity-key string aliases: `EntityKey` — see `src/curriculum/types.ts:3`. Format: `letter:ba`, `combo:ba+fatha`, `mark:fatha`. **Note:** legacy engine code in `src/engine/mastery.ts` still uses the older `letter:2` (numeric id) and `combo:ba-fatha` (hyphen) format. New curriculum code uses `letter:ba` (slug) and `combo:ba+fatha` (plus). Do not unify these without a migration.

## Code Style

**Formatting:**
- ESLint flat config, `eslint-config-expo` (`eslint.config.js`)
- No Prettier config — ESLint enforces formatting
- 2-space indentation, double quotes for strings (curriculum + engine), single quotes appear in legacy auth/test files (`src/auth/provider.tsx`, `src/__tests__/auth-flow.test.ts`). Do not mix within a file; match what's already there.
- Trailing semicolons required
- Run with: `npm run lint` (invokes `npx expo lint`)

**Linting:**
- TypeScript strict mode enforced via `tsconfig.json` (`"strict": true`)
- Run with: `npm run typecheck` (invokes `tsc --noEmit`)
- Combined gate: `npm run validate` (runs `npm run lint && npm run typecheck`). Always run before committing.
- Inline lint suppressions are explicit and narrow: `// eslint-disable-next-line no-console` (only on `console.warn` debug paths in `src/curriculum/runtime/completion-store.ts` and `mastery-recorder.ts`)

## Import Organization

**Order observed across the codebase:**
1. Node / external deps (`react`, `react-native`, `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `vitest`)
2. Type-only imports (`import type { ... }`) — kept separate from runtime imports
3. Internal absolute or relative imports

**Path Aliases:**
- `@/*` maps to project root (`tsconfig.json:6`)
- Used sparingly; most curriculum and engine code uses **relative imports** because intra-domain (e.g., `import type { LessonData } from "../types"`, `import { advanceCursor } from "./cursor"`)
- `@/`-aliased imports are preferred for cross-domain access from `app/` route files

**Type imports:**
- Always use `import type { … }` for compile-time-only symbols. Examples:
  - `import type { LessonData, Screen, EntityKey } from "../types";` (`src/curriculum/runtime/LessonRunner.tsx:6`)
  - `import type { AuthEvent, Session } from '@supabase/supabase-js';` (`src/auth/provider.tsx:2`)
  - `import type { ReactNode } from "react";` (`src/curriculum/runtime/LessonRunner.tsx:2`)

**Default vs named:**
- Named imports for everything by default
- Default imports only when the module exports a default (e.g., `import AsyncStorage from "@react-native-async-storage/async-storage";`)
- Components export by name: `export function LessonRunner(...)` — no default-export components in `src/curriculum/`

**Barrels:**
- Used selectively. Example: `src/curriculum/lessons/index.ts` exports `lessonRegistry`. `src/curriculum/ui/exercises/index.tsx` exports the `renderExercise` dispatcher.
- Engine has a placeholder barrel `src/engine/index.ts` (effectively empty: `export {};`). Import engine functions directly from their module file.

## Error Handling

**Async wrapper pattern (auth, storage):**
```ts
// src/auth/email.ts
export async function signInWithEmail(email, password): Promise<{ data, error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
```
- All auth/sync functions return a `{ data?, error: Error | null }` discriminated result instead of throwing.
- Caller pattern: `if (error) return { error };` (early-return guard) — see `src/auth/provider.tsx:75`.
- Error narrowing: `err instanceof Error ? err : new Error(String(err))`.

**Storage / non-critical async (warn-and-swallow):**
- `src/curriculum/runtime/completion-store.ts` and `mastery-recorder.ts` wrap each AsyncStorage call in try/catch, log via `console.warn` guarded by `if (typeof __DEV__ !== "undefined" && __DEV__)`, and return a safe default (`false` for reads, no-op for writes). Never re-throws.

**Audio (warn-and-continue):**
- `src/audio/player.ts` `playVoice` and `playSFX` are wrapped in try/catch and log via `console.warn("Voice playback failed:" …)` / `console.warn("SFX playback failed:" …)`. Catch blocks **must not re-throw** — enforced by `src/__tests__/audio-safety.test.ts` (CONT-01).

**Database init (state-machine + timeout):**
- `DatabaseProvider` uses a three-state machine (`"loading" | "error" | "ready"`), a 15-second timeout, an `attemptRef` guard against stale promise resolution, and renders an `<ErrorFallback>` on failure. Behavior locked in by `src/__tests__/db-init.test.ts`.

**Component runtime failures:**
- Wrap with `react-error-boundary` (`react-error-boundary` v6.1.1 is in `package.json`).
- Error events captured via `Sentry.captureException()` from the analytics layer.

**Defensive engine inputs:**
- Pure cursor / outcome helpers handle out-of-range inputs without throwing. Examples in `src/curriculum/runtime/cursor.ts`: `advanceCursor(0, 0)` returns `{ nextIndex: null, complete: true }`; `retreatCursor(0, 5)` returns `{ prevIndex: null }`. Tests in `src/__tests__/curriculum-cursor.test.ts` enforce this.

## Logging

**Production:**
- `Sentry.captureException()`, `Sentry.captureMessage()`, `Sentry.addBreadcrumb()` from `@sentry/react-native`
- PostHog `track('event_name', payload)` — typed event map in `src/analytics/events.ts`. Always use the typed wrapper, never call `posthog.capture` directly.

**Development:**
- `console.warn(...)` for non-fatal failures, **guarded** by `if (typeof __DEV__ !== "undefined" && __DEV__)` and an inline `// eslint-disable-next-line no-console` (see `completion-store.ts:20-22`, `mastery-recorder.ts:33-34`).
- Tagged prefixes for grep-ability: `[completion-store]`, `[mastery:stub]`.

**Forbidden in production paths:**
- Bare `console.log` — only `console.warn` inside `__DEV__` guards is acceptable.
- No verbose stdout output in shipping code.

## Comments

**Section dividers:**
- Use box-drawing comments to mark logical sections inside larger files:
  ```ts
  // ────────────────────────────────────────────────────────────
  // Teaching blocks — composable atoms for teaching screens
  // ────────────────────────────────────────────────────────────
  ```
  See `src/curriculum/types.ts:5-7`, `:86-88`, `:159-161`.
- Shorter inline section dividers: `// ── Visibility gates ──` (`src/curriculum/ui/exercises/ReadExercise.tsx:111`), `// ── Mock the Supabase singleton used by auth functions ──` (`src/__tests__/auth-flow.test.ts:13`).

**JSDoc:**
- Used on exported pure functions and on type-union members that need authoring guidance. Examples:
  - `src/curriculum/runtime/cursor.ts:3-6` — describes terminal-state semantics for `advanceCursor`.
  - `src/curriculum/runtime/url-resolver.ts:1-5` — describes the param-mapping contract.
  - `src/curriculum/types.ts` JSDocs document SPEC constraints inline on individual block fields (e.g., `autoPlay` permitted only on Teach screens — Constraint 3).
- Not required on every function. Apply when (a) the function is a public engine/runtime API, (b) the behavior encodes a SPEC constraint, or (c) the parameter shape isn't obvious from the type alone.

**Constraint references:**
- When a code path enforces a curriculum-spec rule, cite it: `// SPEC Constraint 2: micro-attempt enforcement.` (`src/curriculum/ui/exercises/ReadExercise.tsx:17`). Tests reference the same constraint by name (`src/__tests__/curriculum/read-exercise-contract.test.ts:5`).

**Avoid:**
- Redundant comments restating the next line of code.
- TODO/FIXME without an owner/issue reference (current code has near-zero of these — keep it that way).

## Function Design

**Parameter shapes:**
- 1–2 args: positional (`advanceCursor(current: number, total: number)`, `keyFor(lessonId: string)`, `signInWithEmail(email, password)`)
- 3+ args or component props: destructured object — see `LessonRunner({ lesson, masteryRecorder, onComplete, renderScreen })` (`src/curriculum/runtime/LessonRunner.tsx:35`)
- Optional callbacks marked with `?`: `onPlayAudio?: (path: string) => void` (`src/curriculum/ui/exercises/HearExercise.tsx:13`)

**Return shapes:**
- Async result-object pattern: `Promise<{ data: T | null; error: Error | null }>` (`src/auth/email.ts`)
- Pure utilities return small typed result records: `AdvanceResult = { nextIndex: number | null; complete: boolean }`, `RetreatResult = { prevIndex: number | null }`
- Hooks return objects (not tuples) so callers destructure by name: `useProgress()` returns `{ ...state, loading, saveMasteryOnly, updateProfile, refresh }` (`src/hooks/useProgress.ts:61-67`).

**Pure-function discipline:**
- Everything under `src/curriculum/runtime/cursor.ts`, `outcome.ts`, `url-resolver.ts` is pure (no side effects, no React, no platform APIs). Keep it that way — these are the most-tested modules.
- `src/engine/*` is also pure JS with zero React deps. New engine code must follow this rule.

**Side-effect isolation:**
- Side effects (audio playback, navigation, analytics) are passed in as callback props — never imported inside a pure module. Example: `LessonRunner` accepts `masteryRecorder` and `renderScreen`; it does not call analytics or audio directly.

**Component props:**
- Each component declares an `interface Props { … }` immediately above its function. See `src/curriculum/ui/exercises/TapExercise.tsx:8`, `HearExercise.tsx:8`, `ReadExercise.tsx:8`.
- Props that share a shape across exercises (`screenId`, `advance`, `reportAttempt`, `onPlayAudio`) are kept in identical positions for dispatcher symmetry — see `renderExercise` in `src/curriculum/ui/exercises/index.tsx:18-65`.

**Cleanup discipline:**
- Every `setTimeout` stored in a ref (`useRef<ReturnType<typeof setTimeout> | null>(null)`) and cleared in a `useEffect` cleanup. See `TapExercise.tsx:38-43`, `ReadExercise.tsx:69-79`.
- Every event subscription returned from `addEventListener` is removed in cleanup. See `ReadExercise.tsx:43-50`, `LessonChrome.tsx:50-55`.

## Module Design

**Exports:**
- Named exports preferred for everything (functions, components, constants, types).
- No default-exported components in `src/curriculum/`. Default exports are reserved for libraries that require them (e.g., `AsyncStorage`).
- Test-only exports use a `__testing` suffix object so they don't pollute the public surface: `export const __testing = { READ_ATTEMPT_DELAY_MS, READ_AUDIO_DURATION_MS };` (`src/curriculum/ui/exercises/ReadExercise.tsx:251`).

**Single responsibility:**
- One concern per file. `cursor.ts` only knows about cursor math; `outcome.ts` only computes pass/fail; `mastery-recorder.ts` only describes the persistence interface; `completion-store.ts` only persists lesson-completion booleans.
- The `MasteryRecorder` interface lives next to the no-op implementation. Real SQLite-backed implementations should live in their own file and conform to the same interface — do not extend the interface without updating the noop.

**Dispatcher pattern:**
- Polymorphic rendering uses an exhaustive switch over a discriminated union — see `renderExercise` in `src/curriculum/ui/exercises/index.tsx:26-65`. New exercise types must extend the `case` set; the unimplemented branch returns `<UnimplementedExercise type={...} />` rather than throwing.

**Boundary rules (enforced by convention, not lint):**
- `src/curriculum/runtime/*` may not import from `react-native` (LessonRunner is the lone exception, and it imports only `useState`/`useCallback`/`useRef` from `react`, never `react-native`).
- `src/curriculum/ui/*` may import from `react-native` and the design system.
- `app/lesson/[id].tsx` is the only place that wires `LessonRunner` to navigation, audio, and the SQLite-backed mastery recorder.

## TypeScript Conventions

**Strict mode:**
- `"strict": true` in `tsconfig.json` — no implicit `any`, no implicit returns, strict null checks all on.

**Discriminated unions over enums:**
- Use string-literal unions with a discriminant field instead of TS enums. Examples:
  - `Screen.kind: "teach" | "exercise"`
  - `Exercise.type: "tap" | "hear" | "choose" | "build" | "read" | "fix"`
  - `TeachingBlock.type: "text" | "heading" | "reading-direction" | "glyph-display" | "shape-variants" | "audio" | "name-sound-pair" | "mark-preview"`
  - `AuthMethod = "apple" | "google" | "email"`
- Narrow with `if (screen.kind === "exercise") { … }`. The compiler then knows `screen.exercise` is defined.

**Avoid `any`:**
- Engine internals that predate the type tightening still use `any` in places (e.g., `question: any` in some legacy components). Treat any new `any` as a code smell and use `unknown` + a type guard instead.
- For unknown maps from native modules: `Record<string, unknown>` (see `vitest.config.ts` setup mocks).

**Type-only imports:**
- Always use `import type { … }` for compile-time-only symbols (interfaces, type aliases, prop types). Reduces bundle size and avoids accidental runtime imports of barrel files.

**Generics:**
- Single uppercase letters: `T`, `K`, `V`. Used in mock helpers and the `MasteryRecorder` event types.

**`@ts-expect-error`:**
- Used to encode required-field assertions in tests (e.g., `src/__tests__/curriculum/read-exercise-contract.test.ts:7` proves `audioModel` is required by deliberately omitting it).

**Const assertions and readonly:**
- Constant lookup tables use plain `const` records: `const PART_LABELS: Record<string, string> = { … }` (`src/curriculum/ui/LessonChrome.tsx:18`). No need for `as const` unless inferring narrow literal types.

---

*Convention analysis: 2026-04-27*
