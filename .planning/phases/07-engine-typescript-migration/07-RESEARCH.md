# Phase 7: Engine TypeScript Migration - Research

**Researched:** 2026-04-01
**Domain:** TypeScript migration of pure JS engine modules
**Confidence:** HIGH

## Summary

This phase converts 18 `.js` files in `src/engine/` and `src/engine/questions/` to `.ts` with explicit type annotations. The codebase already has 4 TypeScript engine files (`progress.ts`, `insights.ts`, `habit.ts`, `index.ts`) that establish clear patterns for DB interaction typing, interface definitions, and import conventions. The existing `src/types/` directory has 6 type files including `question.ts`, `quiz.ts`, `mastery.ts`, and `lesson.ts` that already define many of the interfaces needed.

The migration is mechanically straightforward because: (1) `tsconfig.json` already has `strict: true` so newly renamed files will be checked strictly, (2) the `Question` interface in `src/types/question.ts` already matches the shape all question generators produce, (3) the `Lesson` interface in `src/types/lesson.ts` matches the lesson objects all generators consume, and (4) the codebase uses named exports exclusively (no default exports), making import updates transparent.

**Primary recommendation:** Follow the leaf-first dependency order from CONTEXT.md. Each file rename `.js` to `.ts` + add type annotations + verify `npm run typecheck` passes + verify `npm test` passes. The `src/types/question.ts` `Question` and `QuestionOption` interfaces are the return types for all question generators. The `Lesson` interface is the input type. Create a new `src/types/engine.ts` for cross-cutting engine types (entity/mastery shapes used by mastery.js, selectors.js, engagement.js).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Pragmatic strict -- typed function signatures and interfaces at module boundaries, `Record<string, any>` permitted at DB row boundaries (matching existing pattern in progress.ts and insights.ts)
- D-02: No `any` in exported function signatures -- this is the success criterion
- D-03: Internal helper types can use narrower `any` variants (e.g., `unknown` preferred) but not enforced if it would require logic changes
- D-04: Shared types go in `src/types/` directory (extend existing pattern -- quiz.ts, mastery.ts already there)
- D-05: Internal-only types stay co-located in the engine file
- D-06: New type files in `src/types/` as needed: e.g., `engine.ts` for cross-cutting engine interfaces
- D-07: Leaf-first, file-by-file migration -- each file fully typed, typecheck passing, committed before moving to next
- D-08: Migration order (dependency graph, leaves first): (1) dateUtils, features, outcome (2) questions/shared (3) individual generators (4) questions/index (5) mastery, selectors, engagement, unlock
- D-09: App must remain buildable and all tests passing after each file migration
- D-10: Defer cleanup of ~8 existing `any` usages in insights.ts and progress.ts
- D-11: If migrating a .js file naturally eliminates an `any` in an existing .ts file, that's fine -- don't hunt for existing `any`

### Claude's Discretion
- Exact interface names and shapes -- derive from existing usage patterns
- Whether to create one `src/types/engine.ts` or split into multiple files
- Granularity of commits -- can batch related files if it makes sense

### Deferred Ideas (OUT OF SCOPE)
- DB row typing: Define typed interfaces for all SQLite query results
- Strict mode escalation: Enable `noImplicitAny` and `strictNullChecks` project-wide
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RET-01 | All 18 engine .js files migrated to TypeScript with proper type annotations | Full migration plan with dependency order, existing type interfaces identified, patterns documented from reference .ts files |
</phase_requirements>

## Standard Stack

No new packages needed. This phase is purely a file rename + type annotation effort using the existing stack.

### Core (Already Installed)
| Library | Version | Purpose | Relevance |
|---------|---------|---------|-----------|
| TypeScript | 5.9.2 | Type system | Target compiler -- `strict: true` already enabled |
| Vitest | 4.1.2 | Test runner | Tests must pass after each migration |
| expo-sqlite | 55.0.11 | Database | `SQLiteDatabase` type used in engine files that take db params |

### No Additions Needed
This phase requires zero new dependencies. All type infrastructure exists.

## Architecture Patterns

### Existing Type Infrastructure (Reference)

The codebase already has the types needed by the engine files:

```
src/types/
  question.ts    -- Question, QuestionOption interfaces (return type for all generators)
  quiz.ts        -- QuizResultItem, QuestionAttempt (used by mastery pipeline)
  mastery.ts     -- MasteryState, re-exports EntityState/SkillState/ConfusionState
  lesson.ts      -- Lesson interface (input type for all generators)
  progress.ts    -- re-exports ProgressState
  onboarding.ts  -- onboarding types (not engine-relevant)
```

### Pattern 1: DB Interaction Typing (from progress.ts)
**What:** Use `SQLiteDatabase` from expo-sqlite for db parameters, inline row types for query results, `Record<string, any>` at the DB boundary.
**When to use:** Any engine function that takes a database parameter (only `mastery.js` functions -- but mastery.js does NOT take db; progress.ts handles DB).
```typescript
// Source: src/engine/progress.ts
import type { SQLiteDatabase } from 'expo-sqlite';
const rows = await db.getAllAsync<{ entity_key: string; correct: number }>(query);
```

### Pattern 2: Interface at Module Boundary (from insights.ts)
**What:** Define interfaces for all exported function parameters and return types. Internal helpers can use lighter typing.
**When to use:** Every migrated file's exported functions.
```typescript
// Source: src/engine/insights.ts
export interface LessonInsight {
  type: 'confusion' | 'review' | 'trend';
  message: string;
}
export function generatePostLessonInsights(
  mastery: MasteryData,
  lessonLetterIds: number[],
  sessionResults: Map<number, { correct: number; total: number }>
): LessonInsight[] { ... }
```

### Pattern 3: Import Type Syntax (TypeScript 5.9 compatible)
**What:** Use `import type { X }` for type-only imports to satisfy `isolatedModules`.
**When to use:** All type imports.
```typescript
// Source: src/engine/habit.ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { HabitState } from './progress';
```

### Pattern 4: Question Generator Typing
**What:** All question generators take a `Lesson` and optionally `progress`, return `Question[]`.
**When to use:** All files in `src/engine/questions/`.
```typescript
import type { Lesson } from '../../types/lesson';
import type { Question } from '../../types/question';
export function generateRecognitionQs(lesson: Lesson): Question[] { ... }
```

### New Types Needed

Based on code analysis, the following new types are needed in `src/types/engine.ts`:

```typescript
// --- Letter data types (used by question generators and mastery.js) ---

export interface ArabicLetter {
  id: number;
  letter: string;
  name: string;
  transliteration: string;
  sound: string;
  tip: string;
  dots: number;
  dotPos: string;
  visualRule: string;
  family: string;
  soundHint: string;
  articulation?: {
    place: string;
    manner: string;
    breath: string;
    confusedWith: string;
    tryThis: string;
  };
}

// --- Mastery engine types ---

export interface EntityEntry {
  correct: number;
  attempts: number;
  lastSeen: string | null;
  nextReview: string | null;
  intervalDays: number;
  sessionStreak: number;
  lastLatencyMs?: number | null;
}

export interface SkillEntry {
  correct: number;
  attempts: number;
  lastSeen: string | null;
}

export interface ConfusionEntry {
  count: number;
  lastSeen: string | null;
  categories?: Record<string, number>;
}

export interface MasteryData {
  entities: Record<string, EntityEntry>;
  skills: Record<string, SkillEntry>;
  confusions: Record<string, ConfusionEntry>;
}

export type MasteryState = 'introduced' | 'unstable' | 'accurate' | 'retained';

export type ErrorCategory = 'visual_confusion' | 'sound_confusion' | 'vowel_confusion' | 'random_miss';

// --- Engagement types ---

export type CompletionTier = 'firstLesson' | 'perfect' | 'great' | 'good' | 'struggling'
  | 'harakatPerfect' | 'harakatGreat' | 'harakatStruggling';

export type PerformanceBand = 'strong' | 'partial' | 'weak';

// --- Outcome types ---

export interface LessonOutcome {
  total: number;
  correct: number;
  accuracy: number;
  passed: boolean;
  threshold: number | null;
}

export type LessonMode = 'recognition' | 'sound' | 'contrast' | 'checkpoint'
  | 'harakat-intro' | 'harakat' | 'harakat-mixed' | 'review'
  | 'connected-forms' | 'connected-reading';

// --- Selector types ---

export interface PhaseCounts {
  p1Done: number; p2Done: number; p3Done: number; p4Done: number;
  p1Total: number; p2Total: number; p3Total: number; p4Total: number;
}

export interface ReviewSessionPlan {
  due: string[];
  unstable: string[];
  weak: string[];
  confused: Array<{ key: string; count: number; lastSeen: string | null }>;
  items: string[];
  totalItems: number;
  hasReviewWork: boolean;
  isUrgent: boolean;
}

// --- Harakat data types ---

export interface Harakah {
  id: string;
  mark: string;
  name: string;
  sound: string;
  description: string;
  position: string;
}

export interface HarakatCombo {
  id: string;
  letterId: number;
  harakahId: string;
  display: string;
  audioText: string;
  sound: string;
  letterName: string;
}

// --- Connected forms types ---

export interface ConnectedFormData {
  forms: Record<string, string>;
  joins: boolean;
}
```

### File-by-File Migration Analysis

**Wave 1: Utility files (no engine imports)**

| File | Lines | Exports | Types Needed | Complexity |
|------|-------|---------|-------------|------------|
| `dateUtils.js` | 18 | 3 functions | `string`, `number` params/returns | Trivial |
| `features.js` | 4 | 1 const | Object literal, inferred | Trivial |
| `outcome.js` | 57 | 4 exports | `LessonOutcome`, `LessonMode` | Simple |

**Wave 2: Question shared infrastructure**

| File | Lines | Exports | Types Needed | Complexity |
|------|-------|---------|-------------|------------|
| `questions/shared.js` | 298 | 16 functions/consts | `Question`, `QuestionOption`, `ArabicLetter`, `Lesson` | Medium -- many helper functions |

**Wave 3: Individual question generators**

| File | Lines | Exports | Types Needed | Complexity |
|------|-------|---------|-------------|------------|
| `recognition.js` | 46 | 1 function | `Lesson`, `Question`, `ArabicLetter` | Simple |
| `sound.js` | 97 | 1 function | Same + `SOUND_CONFUSION_MAP` types | Simple |
| `contrast.js` | 30 | 1 function | Same | Trivial |
| `harakat.js` | 180 | 2 functions | `Harakah`, `HarakatCombo` | Medium |
| `checkpoint.js` | 230 | 1 function | `ProgressState`, question types | Medium |
| `connectedForms.js` | 497 | 1 function | `ConnectedFormData`, `ArabicLetter` | Medium (largest file) |
| `connectedReading.js` | 120 | 1 function | Same as connectedForms | Simple |
| `review.js` | 160 | 1 function | `ProgressState`, `MasteryData` | Medium |
| `explanations.js` | 110 | 3 functions | `ArabicLetter`, `Question` | Simple |

**Wave 4: Question dispatcher**

| File | Lines | Exports | Types Needed | Complexity |
|------|-------|---------|-------------|------------|
| `questions/index.js` | 40 | re-exports + 2 functions | `Lesson`, `ProgressState`, `Question` | Simple -- delete index.d.ts |

**Wave 5: Core engine files**

| File | Lines | Exports | Types Needed | Complexity |
|------|-------|---------|-------------|------------|
| `mastery.js` | 451 | 15+ exports | `EntityEntry`, `SkillEntry`, `ConfusionEntry`, `MasteryData`, `MasteryState`, `ErrorCategory` | Complex -- most types live here |
| `selectors.js` | 289 | 14+ exports | `Lesson`, `MasteryData`, `PhaseCounts`, `ReviewSessionPlan` | Complex -- many function signatures |
| `engagement.js` | 270 | 12+ exports | `CompletionTier`, `PerformanceBand`, `ArabicLetter`, `Lesson`, `HarakatCombo` | Medium -- mostly string constants |
| `unlock.js` | 100 | 6 exports | `EntityEntry`, `MasteryState` | Simple |

### Import Path Consideration

Currently JS files import from each other with `.js` extensions (e.g., `import { getLetter } from "../data/letters.js"`). When renaming to `.ts`:

- **TypeScript resolves `.js` extensions in imports to `.ts` files.** This is the standard behavior with `moduleResolution: "bundler"` (which Expo uses). So `import { x } from './foo.js'` will resolve to `foo.ts` if it exists. **No import path changes needed** when renaming files.
- Files that import from data modules (`letters.js`, `lessons.js`, `harakat.js`, `connectedForms.js`) will keep their `.js` extension imports since those data files are NOT being migrated in this phase.
- The `src/engine/index.ts` barrel file currently exports nothing (`export {};`). It does NOT need updating -- the barrel pattern is not used for engine imports.

### Anti-Patterns to Avoid
- **Over-typing internal variables:** Don't add types to every local `const` -- let TypeScript infer. Only annotate function signatures and exported interfaces.
- **Changing business logic:** This is a type-only migration. If adding types reveals a potential bug, document it but do not fix it.
- **Hunting for `any` in existing .ts files:** Per D-10, the ~8 `any` usages in `insights.ts` and `progress.ts` are out of scope.
- **Creating types for data modules:** `letters.js`, `lessons.js`, `harakat.js`, `connectedForms.js` in `src/data/` are NOT being migrated. Type their exports via the new `ArabicLetter` interface but don't rename the data files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Question type definitions | New question interfaces | `src/types/question.ts` `Question` and `QuestionOption` | Already matches all generator output shapes |
| Lesson type definitions | New lesson interfaces | `src/types/lesson.ts` `Lesson` | Already matches all lesson data |
| Mastery state types | Duplicated mastery interfaces | `src/engine/progress.ts` `EntityState`, `SkillState`, `ConfusionState` | Already exported and used |
| Quiz result types | New result interfaces | `src/types/quiz.ts` `QuizResultItem` | Already matches what mastery.js consumes |

## Common Pitfalls

### Pitfall 1: Breaking `.js` Extension Imports
**What goes wrong:** Changing import paths from `.js` to `.ts` when renaming files.
**Why it happens:** Instinct to update import extensions when the file extension changes.
**How to avoid:** Leave all import paths as-is. TypeScript + Expo's bundler resolves `.js` imports to `.ts` files automatically. Only change the file extension of the file being migrated.
**Warning signs:** Build errors about missing modules after renaming.

### Pitfall 2: `EntityState` vs `EntityEntry` Naming Collision
**What goes wrong:** `progress.ts` already exports `EntityState` (the DB-shaped interface). The mastery engine uses a looser shape with `lastLatencyMs` that `EntityState` doesn't include.
**Why it happens:** The DB adapter (`progress.ts`) strips `lastLatencyMs` when saving. The engine (`mastery.js`) works with the richer in-memory shape.
**How to avoid:** Use the existing `EntityState` from `progress.ts` as the canonical type. For mastery.js internal functions, extend it: `interface EntityEntryInternal extends EntityState { lastLatencyMs?: number | null; }`. Or simply add `lastLatencyMs` to the EntityState interface since it's harmless (optional field).
**Warning signs:** Type errors in `recordEntityAttempt` about missing `lastLatencyMs`.

### Pitfall 3: `SOUND_CONFUSION_MAP` Index Signature
**What goes wrong:** `SOUND_CONFUSION_MAP` uses numeric keys (`2: [3, 4]`). TypeScript objects with numeric keys need `Record<number, number[]>` typing.
**Why it happens:** Object literal keys in JS are always strings, but the code accesses with `[tid]` where `tid` is a number.
**How to avoid:** Type as `Record<number, number[]>` or use `as const` and index with number. Since the lookup uses `SOUND_CONFUSION_MAP[tid] || []`, the `undefined` case is already handled.
**Warning signs:** "Element implicitly has an 'any' type" errors on map lookups.

### Pitfall 4: Circular Type Dependencies
**What goes wrong:** `mastery.js` imports from `dateUtils.js` (at bottom of file, after function definitions). `selectors.js` imports from `mastery.js` and `unlock.js`.
**Why it happens:** The dependency graph has layers but the import-at-bottom pattern in `mastery.js` is unusual.
**How to avoid:** When migrating `mastery.js`, move the `import { addDateDays, getDayDifference } from "./dateUtils.js"` to the top of the file. This import is currently at line 330 (between functions) which is valid JS but poor practice.
**Warning signs:** TypeScript may warn about imports used before declaration.

### Pitfall 5: Tests Importing from Renamed Files
**What goes wrong:** Test files import from engine files. After renaming `.js` to `.ts`, imports like `from '../engine/mastery.js'` must still resolve.
**Why it happens:** Vitest with TypeScript resolves `.js` extensions to `.ts` files (same as the bundler). But some test files might use bare imports without extensions.
**How to avoid:** Run `npm test` after each file migration. Vitest should resolve correctly since the test setup already handles both `.js` and `.ts`.
**Warning signs:** "Cannot find module" errors in test output.

### Pitfall 6: The `categorizeError` Function Shadow
**What goes wrong:** In `mastery.js`, `categorizeError(result, getLetter)` takes a function parameter named `getLetter` that shadows the module-level `import { getLetter }` from letters.js.
**Why it happens:** The function parameter has the same name as the import.
**How to avoid:** Type the parameter explicitly: `getLetter: (id: number) => ArabicLetter | undefined`. This makes the shadow intentional and type-safe.
**Warning signs:** TypeScript warns about parameter shadowing imported name.

## Code Examples

### Example 1: Simple Utility Migration (dateUtils.js -> dateUtils.ts)
```typescript
// Before (JS)
export function getDayDifference(dateA, dateB) { ... }

// After (TS)
export function getDayDifference(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}
```
Note: The JS version uses `a - b` (implicit coercion). TypeScript requires `a.getTime() - b.getTime()`. This is a type-safe equivalent with identical behavior.

### Example 2: Question Generator Migration
```typescript
import type { Lesson } from '../../types/lesson';
import type { Question, QuestionOption } from '../../types/question';
import type { ArabicLetter } from '../../types/engine';

export function generateContrastQs(lesson: Lesson): Question[] {
  const teach = (lesson.teachIds || []).map(id => getLetter(id)).filter(
    (l): l is ArabicLetter => l != null
  );
  // ... rest unchanged
}
```

### Example 3: Mastery Function Migration
```typescript
import type { EntityState } from './progress';
import type { QuizResultItem } from '../types/quiz';

interface EntityEntryInternal extends EntityState {
  lastLatencyMs?: number | null;
}

export function normalizeEntityKey(
  targetId: string | number,
  question: { isHarakat?: boolean } | null | undefined
): string { ... }

export function recordEntityAttempt(
  entry: EntityEntryInternal | null | undefined,
  result: { correct: boolean; latencyMs?: number },
  today: string
): EntityEntryInternal { ... }
```

### Example 4: Engagement Constants (engagement.js -> engagement.ts)
```typescript
// String constant objects need Record typing or as const
export const CORRECT_COPY: Record<string, string[]> = {
  recognition: [...],
  sound: [...],
  harakat: [...],
};

// Or more precisely:
export const CORRECT_COPY = {
  recognition: [...],
  sound: [...],
  harakat: [...],
} as const satisfies Record<string, readonly string[]>;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.d.ts` declaration files alongside `.js` | Convert to `.ts` directly | TypeScript 3+ | The `questions/index.d.ts` pattern is legacy -- delete when `index.js` becomes `index.ts` |
| `@ts-ignore` for JS imports | `allowJs: true` + gradual migration | TS 4+ | Expo's tsconfig base already allows JS alongside TS |
| Manual type narrowing | `satisfies` operator | TS 4.9 | Use for static data constants per D-06 from CLAUDE.md |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts (implied by package.json) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RET-01a | All engine .js files compile as .ts | typecheck | `npm run typecheck` | N/A (compiler check) |
| RET-01b | No `any` in exported function signatures | manual grep | `grep -rn "any" src/engine/*.ts src/engine/questions/*.ts` | N/A (manual review) |
| RET-01c | Existing tests still pass after migration | unit | `npm test -- --run` | Yes -- 60 passing test files |
| RET-01d | mastery.test.js passes | unit | `npm test -- --run src/__tests__/mastery.test.js` | Yes |
| RET-01e | questions.test.js passes | unit | `npm test -- --run src/__tests__/questions.test.js` | Yes |
| RET-01f | selectors.test.js passes | unit | `npm test -- --run src/__tests__/selectors.test.js` | Yes |
| RET-01g | outcome.test.js passes | unit | `npm test -- --run src/__tests__/outcome.test.js` | Yes |

### Sampling Rate
- **Per file migration:** `npm run typecheck && npm test -- --run`
- **Per wave merge:** Full test suite
- **Phase gate:** `npm run validate && npm test -- --run` (zero errors)

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. No new test files needed. The validation is: typecheck passes + existing tests pass + no `any` in exported signatures.

## Current Typecheck Baseline

The project currently has **20 lines of typecheck errors** (pre-existing, not related to engine files). These errors are in:
- `app.config.ts` (newArchEnabled property)
- `app/_layout.tsx` (ColorSchemeName)
- `app/lesson/[id].tsx` (Lesson type narrowing)
- `app/lesson/review.tsx` (null assignment)
- `src/components/exercises/SpotTheBreak.tsx` (color literals)
- `src/design/theme.ts` (dark mode color types)

**These are pre-existing errors that must NOT increase.** The migration must not add new typecheck errors. After migration, the error count should remain at 20 or decrease (if typed engine exports fix some downstream inference).

## Test Baseline

- **60 test files passing, 6 skipped, 664 tests pass**
- Key engine test files: `mastery.test.js`, `questions.test.js`, `selectors.test.js`, `outcome.test.js`, `connectedForms.test.js`, `letters.test.js`
- Tests import engine modules -- renaming `.js` to `.ts` is transparent to Vitest's resolver

## Open Questions

1. **`Date` arithmetic in dateUtils.js**
   - What we know: JS uses `a - b` for Date subtraction (implicit `.getTime()`). TypeScript strict mode rejects this.
   - What's unclear: Nothing -- fix is clear (use `.getTime()`)
   - Recommendation: Change to `a.getTime() - b.getTime()` -- identical runtime behavior

2. **`getLetter` return type**
   - What we know: `getLetter(id)` in `src/data/letters.js` can return `undefined` if ID not found. Many generators call it without null checks.
   - What's unclear: Whether to add null guards or use non-null assertions
   - Recommendation: Use type guard filters (`.filter((l): l is ArabicLetter => l != null)`) where results are mapped. Use `!` non-null assertion only when the ID is guaranteed valid by prior logic.

3. **`SOUND_CONFUSION_MAP` key typing**
   - What we know: Keys are numeric but JS objects store them as strings
   - What's unclear: Whether to type as `Record<number, number[]>` or `Record<string, number[]>`
   - Recommendation: `Record<number, number[]>` since all access uses numeric `tid`. TypeScript handles numeric indexing correctly.

## Sources

### Primary (HIGH confidence)
- `src/engine/progress.ts` -- Reference TypeScript engine file, 584 lines, full typing patterns
- `src/engine/insights.ts` -- Reference TypeScript engine file with `Record<string, any>` DB boundary pattern
- `src/engine/habit.ts` -- SQLiteDatabase import pattern
- `src/types/question.ts` -- Question and QuestionOption interfaces (generator return types)
- `src/types/lesson.ts` -- Lesson interface (generator input type)
- `src/types/quiz.ts` -- QuizResultItem interface (mastery pipeline input)
- `src/types/mastery.ts` -- MasteryState re-export pattern
- `tsconfig.json` -- Confirms `strict: true`, path aliases

### Secondary (MEDIUM confidence)
- TypeScript 5.9 documentation on `satisfies` operator and `import type` syntax
- Expo TypeScript configuration (inherited via `expo/tsconfig.base`)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages, existing infrastructure fully understood
- Architecture: HIGH -- 4 reference .ts files and 6 type files already establish all patterns
- Pitfalls: HIGH -- identified through direct code analysis of all 18 files to migrate
- Migration order: HIGH -- dependency graph verified by tracing all import statements

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable -- no moving dependencies)
