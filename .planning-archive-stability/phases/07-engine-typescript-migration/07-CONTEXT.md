# Phase 7: Engine TypeScript Migration - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert all 18 remaining `.js` files in `src/engine/` (including `src/engine/questions/`) to `.ts` with explicit type annotations. No business logic changes. The goal is eliminating `any` leakage from exported function signatures in the core learning algorithm.

**Files to migrate (18 total):**
- `src/engine/`: dateUtils.js, engagement.js, features.js, mastery.js, outcome.js, selectors.js, unlock.js
- `src/engine/questions/`: checkpoint.js, connectedForms.js, connectedReading.js, contrast.js, explanations.js, harakat.js, index.js, recognition.js, review.js, shared.js, sound.js

**Already TypeScript (4 files — reference patterns):**
- `src/engine/habit.ts`, `src/engine/index.ts`, `src/engine/insights.ts`, `src/engine/progress.ts`
- `src/engine/questions/index.d.ts` (to be deleted when questions/index.js becomes .ts)

</domain>

<decisions>
## Implementation Decisions

### Type Strictness
- **D-01:** Pragmatic strict — typed function signatures and interfaces at module boundaries, `Record<string, any>` permitted at DB row boundaries (matching existing pattern in progress.ts and insights.ts)
- **D-02:** No `any` in exported function signatures — this is the success criterion
- **D-03:** Internal helper types can use narrower `any` variants (e.g., `unknown` preferred) but not enforced if it would require logic changes

### Type Organization
- **D-04:** Shared types go in `src/types/` directory (extend existing pattern — quiz.ts, mastery.ts already there)
- **D-05:** Internal-only types (helper shapes, intermediate computation types used by a single file) stay co-located in the engine file
- **D-06:** New type files in `src/types/` as needed: e.g., `engine.ts` for cross-cutting engine interfaces (EngagementScore, UnlockResult, etc.)

### Migration Strategy
- **D-07:** Leaf-first, file-by-file migration — each file fully typed, typecheck passing, committed before moving to next
- **D-08:** Migration order (dependency graph, leaves first):
  1. Utility files (no engine imports): dateUtils.js, features.js, outcome.js
  2. Shared question infrastructure: questions/shared.js
  3. Individual question generators (depend on shared): recognition.js, sound.js, contrast.js, harakat.js, checkpoint.js, connectedForms.js, connectedReading.js, review.js, explanations.js
  4. Question dispatcher: questions/index.js (delete questions/index.d.ts at this point)
  5. Core engine files: mastery.js, selectors.js, engagement.js, unlock.js
- **D-09:** App must remain buildable and all tests passing after each file migration

### Existing any Cleanup
- **D-10:** Defer cleanup of ~8 existing `any` usages in insights.ts and progress.ts — these are DB-boundary types requiring DB row interface definitions, which is out of scope for this phase
- **D-11:** If migrating a .js file naturally eliminates an `any` in an existing .ts file (e.g., by providing a proper type for an import), that's fine — but don't go hunting for existing `any` to fix

### Claude's Discretion
- Exact interface names and shapes — derive from existing usage patterns in the codebase
- Whether to create one `src/types/engine.ts` or split into multiple files — use judgment based on how many shared types emerge
- Granularity of commits — can batch related files (e.g., all question generators) if it makes sense

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing TypeScript Patterns (reference implementations)
- `src/engine/progress.ts` — Most complex existing .ts engine file, shows DB interaction typing pattern
- `src/engine/insights.ts` — Shows interface definitions and Record<string, any> DB boundary pattern
- `src/engine/habit.ts` — Shows SQLiteDatabase type import pattern
- `src/engine/index.ts` — Engine barrel file, shows re-export pattern

### Type Definitions
- `src/types/quiz.ts` — Shared quiz types (QuizResultItem, QuestionAttempt) imported by engine
- `src/types/mastery.ts` — Mastery types shared between engine and UI
- `src/engine/questions/index.d.ts` — Current type declarations for question dispatcher (to be replaced)

### Project Configuration
- `tsconfig.json` — TypeScript compiler settings, path aliases
- `CLAUDE.md` — Project constraints (no business logic changes, stack locked)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/types/` directory: 6 existing type files establishing the shared-types pattern
- `src/engine/progress.ts`: EntityState, SkillState, ConfusionState, HabitState, ProgressState interfaces — many engine .js files consume these
- `src/engine/insights.ts`: LessonInsight, ReviewGroups, ConfusionPairDisplay interfaces

### Established Patterns
- DB interaction: `SQLiteDatabase` type from `expo-sqlite`, `Record<string, any>` for raw rows
- Export style: named exports (no default exports) throughout engine
- Import style: `import type { X }` for type-only imports (TypeScript 5.9 isolatedModules compatible)

### Integration Points
- `src/hooks/` — hooks import from engine files; changing .js to .ts is transparent to importers
- `src/engine/index.ts` — barrel re-exports; must be updated as files are renamed
- `src/__tests__/` — Vitest tests import engine functions; must continue passing

</code_context>

<specifics>
## Specific Ideas

No specific requirements — founder deferred all technical decisions to Claude's judgment based on independent research. Key constraint: keep it pragmatic, ship-focused, no scope creep into DB layer typing.

</specifics>

<deferred>
## Deferred Ideas

- **DB row typing**: Define typed interfaces for all SQLite query results (would eliminate remaining `any` in insights.ts/progress.ts). Belongs in a dedicated DB hardening phase.
- **Strict mode escalation**: Enable `noImplicitAny` and `strictNullChecks` project-wide after all files are typed. Separate config change.

</deferred>

---

*Phase: 07-engine-typescript-migration*
*Context gathered: 2026-04-02*
