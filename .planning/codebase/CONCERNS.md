# Codebase Concerns

**Analysis Date:** 2026-03-28

## Critical Issues

**Database initialization has no error handling:**
- `src/db/provider.tsx` calls `getDatabase()` with no `.catch()`. If SQLite fails to open (corrupt DB, disk full), the app renders nothing (`return null`) with no recovery path or user feedback.
- `src/db/client.ts` migration logic silently swallows ALTER TABLE errors in `catch {}` (line 43) — if a migration partially fails, the DB could be in an inconsistent state.
- Fix approach: Add error boundary around `DatabaseProvider`, show a recovery screen with "Reset data" option. Log migration errors to Sentry instead of swallowing.

**No data backup before destructive operations:**
- `src/engine/progress.ts` `resetProgress()` (line 304) and `src/db/client.ts` `resetDatabase()` (line 50) both delete all user data with no confirmation or backup. `importProgress()` also wipes everything before importing.
- Impact: A single accidental call destroys all learning progress permanently.
- Fix approach: Export current state to a temp file before any destructive operation; add a confirmation barrier in the UI layer.

**Silent error swallowing in onboarding:**
- `src/components/onboarding/OnboardingFlow.tsx` line 97: bare `catch {}` with no logging. If the onboarding profile save fails, the user proceeds as if it succeeded, but their preferences are lost.
- Fix approach: Show a retry toast on failure, log to Sentry.

## Technical Debt

| Area | Issue | Severity | Notes |
|------|-------|----------|-------|
| **Type safety** | 30+ explicit `any` types across hooks and components | High | `src/hooks/useLessonQuiz.ts`, `src/hooks/useLessonHybrid.ts`, `src/components/LessonHybrid.tsx`, `src/components/LessonQuiz.tsx`, `src/components/quiz/QuizQuestion.tsx`, `src/types/lesson.ts` (line 14: `hybridSteps?: any[]`) |
| **JS engine files** | Core engine is plain `.js` with zero type annotations | High | `src/engine/mastery.js` (450 lines), `src/engine/selectors.js` (288 lines), `src/engine/engagement.js` (246 lines), `src/engine/questions/*.js` — all untyped. These are the most critical business logic files. |
| **Orphan scaffold files** | `components/` and `constants/` at project root are Expo template leftovers | Low | `components/EditScreenInfo.tsx`, `components/Themed.tsx`, `components/ExternalLink.tsx`, `constants/Colors.ts` — unused, confusing alongside `src/components/` and `src/design/` |
| **Fat screen files** | `app/post-lesson-onboard.tsx` (430 lines), `app/wird-intro.tsx` (303 lines), `app/phase-complete.tsx` (229 lines) contain full UI + logic | Medium | Should extract step components to `src/components/` to match the pattern used in `src/components/onboarding/steps/` |
| **Untyped route params** | `router.replace("/wird-intro" as any)` in `app/post-lesson-onboard.tsx` line 240 | Low | Expo Router type generation would eliminate this |
| **Sequential DB writes** | `src/engine/progress.ts` `saveQuestionAttempts()` (line 163) loops individual INSERTs with `await` — O(n) round trips for n questions | Medium | Should batch into a single transaction or use multi-row INSERT |
| **Motivation mapping hardcoded** | `app/post-lesson-onboard.tsx` line 231: `motivation: selectedMotivation ? "quran" : null` — always maps to "quran" regardless of actual selection | Medium | Bug or incomplete implementation; the 5 motivation options are ignored |
| **`useProgress` spreads null** | `src/hooks/useProgress.ts` line 58: `...state` spreads `null` on first render, meaning all consumers must null-check every field | Medium | Should provide a typed default state or a loading guard |

## Missing Infrastructure

**No CI/CD pipeline:**
- No `.github/workflows/`, no CI configuration detected. Linting, type checking, and tests are manual-only (`npm run validate`).
- Risk: Regressions ship uncaught. Build breaks discovered only during EAS build.
- Fix: Add GitHub Actions workflow running `npm run validate && npm test` on PR.

**No Prettier or auto-formatter:**
- No `.prettierrc`, `biome.json`, or formatting config found. Only ESLint via `eslint-config-expo`.
- Impact: Inconsistent formatting across contributors.
- Fix: Add Prettier with a config file and format-on-save.

**No error boundary:**
- No React error boundary anywhere in the component tree. An unhandled render error crashes the entire app.
- Fix: Add error boundary wrapping `<Stack>` in `app/_layout.tsx` with a "Something went wrong" recovery screen.

**No loading/error states for DB initialization:**
- `DatabaseProvider` returns `null` while DB initializes — shows blank screen with no splash/loading indicator.
- Fix: Keep splash screen visible until DB is ready, or show a skeleton.

**No integration or E2E tests:**
- 9 test files, all in `src/__tests__/`, all testing engine logic. Zero component tests, zero screen tests, zero navigation tests.
- Components, hooks, and screens (the majority of the codebase) are completely untested.

## Code Smells

**Pervasive `any` in the quiz pipeline:**
- The entire question generation → quiz rendering pipeline passes untyped objects. `lesson: any` flows from `useLessonQuiz` → `LessonQuiz` → `QuizQuestion` → options rendering. A single field rename in the question generator silently breaks the UI.
- Files: `src/hooks/useLessonQuiz.ts`, `src/hooks/useLessonHybrid.ts`, `src/components/LessonQuiz.tsx`, `src/components/LessonHybrid.tsx`, `src/components/quiz/QuizQuestion.tsx`
- Fix: Define `Question`, `QuizOption`, and `Lesson` types in `src/types/` and propagate through the pipeline. The `Lesson` interface exists at `src/types/lesson.ts` but is not used — components import from `src/data/lessons.js` which returns untyped objects.

**Mixed JS/TS codebase:**
- `src/engine/` and `src/data/` are plain `.js` (11 files, ~3300 lines). `src/components/`, `src/hooks/`, `src/db/` are `.ts`/`.tsx`. The JS files are the core algorithm — the most important code to type.
- Fix: Incrementally migrate `.js` to `.ts`, starting with `src/engine/mastery.js` and `src/engine/selectors.js` which define the mastery state machine.

**Deep relative imports from `app/` screens:**
- Screen files in `app/` use paths like `../../src/design/theme`. The `@/` alias is configured in `tsconfig.json` but not consistently used in `app/` directory files.
- Fix: Use `@/src/design/theme` consistently.

**`questions` state mutation pattern:**
- `src/hooks/useLessonQuiz.ts` line 117: calls `setQuestions()` with a function that reads state but intentionally returns it unchanged — used as a side-effect-in-setter to read current length. This is a React anti-pattern.
- Fix: Use `useRef` for the questions array or split into a reducer.

## Upgrade Risks

**No lockfile visible for audit:**
- `package-lock.json` presumably exists but dependency audit status is unknown.
- Expo 55, React Native 0.83, React 19 are all very recent — limited community troubleshooting available.

**`react-native-web` included but unused:**
- `react-native-web: ~0.21.0` is a dependency but the app is mobile-only (portrait, offline-first). Adds unnecessary bundle weight.
- Fix: Remove if web is not a target.

**`react-dom` included:**
- `react-dom: 19.2.0` is listed as a dependency. Not needed for a mobile-only Expo app unless web target is active.
- Fix: Move to devDependencies or remove.

## Security Considerations

**Import validation is minimal:**
- `src/engine/progress.ts` `importProgress()` (line 356) accepts arbitrary `Record<string, unknown>` data and casts fields with `as number`, `as string` — no validation that values are actually the expected types.
- Risk: Malformed import data could insert corrupt rows into SQLite or crash the app.
- Fix: Add a schema validation layer (zod or manual checks) before importing.

**SQL queries use parameterized statements:**
- All SQL in `src/engine/progress.ts` and `src/db/client.ts` uses parameterized queries — no SQL injection risk. This is good.

**`saveUserProfile` builds dynamic SQL:**
- `src/engine/progress.ts` line 299: `SET ${sets.join(', ')}` — the column names are hardcoded strings (not user input), so this is safe, but the `values: any[]` array has no type safety.

## Performance Bottlenecks

**Full progress reload after every save:**
- `src/hooks/useProgress.ts` calls `refresh()` (full `loadProgress()` — 6 parallel queries) after every `completeLesson()` and `updateProfile()` call. As mastery data grows, this becomes slower.
- Fix: Return updated state from save functions instead of re-querying everything.

**No question attempt batching:**
- `src/engine/progress.ts` `saveQuestionAttempts()` executes one INSERT per question sequentially. A 15-question lesson = 15 await round trips.
- Fix: Wrap in a transaction and/or use multi-row INSERT.

**LessonGrid may re-render excessively:**
- `src/components/home/LessonGrid.tsx` (313 lines) — no visible `React.memo` or `useMemo` on list items. With 30+ lessons rendering status badges, this could cause jank on scroll.

## Test Coverage Gaps

**Untested areas (by file count):**
- `src/components/` — 0 tests for 20 component files
- `src/hooks/` — 0 tests for 5 hook files
- `app/` — 0 tests for 10 screen files
- `src/db/` — 0 tests for database client/provider/schema
- `src/audio/` — 0 tests for audio player

**What IS tested (9 test files):**
- `src/__tests__/questions.test.js` — question generation
- `src/__tests__/mastery.test.js` — mastery state machine
- `src/__tests__/selectors.test.js` — letter selection logic
- `src/__tests__/outcome.test.js` — pass/fail determination
- `src/__tests__/letters.test.js` — letter data integrity
- `src/__tests__/connectedForms.test.js` — connected form data
- `src/__tests__/data-loading.test.ts` — data module imports
- `src/__tests__/quiz-contract.test.ts` — quiz type contracts
- `src/__tests__/summaryAndReview.test.js` — summary logic

**Priority gaps:**
- **High**: `useProgress` hook — the bridge between UI and DB, untested
- **High**: `useLessonQuiz` hook — quiz state machine with recycling logic, untested
- **Medium**: Database migrations in `src/db/client.ts` — version upgrade paths untested
- **Medium**: `importProgress` / `exportProgress` — data integrity during import/export

## Recommendations

1. **Type the quiz pipeline** — Define `Question` and `QuizOption` interfaces, convert `src/engine/questions/index.js` and `src/engine/mastery.js` to TypeScript. This is the highest-impact change for preventing runtime errors.

2. **Add error boundary** — Wrap the app in an error boundary in `app/_layout.tsx` before any user-facing release. A single undefined property access in a question generator currently crashes the entire app.

3. **Add CI** — GitHub Actions running `npm run validate && npm test` on every push. Takes 30 minutes to set up, prevents most regressions.

4. **Fix motivation mapping bug** — `app/post-lesson-onboard.tsx` line 231 always saves `"quran"` regardless of what the user selected. This silently discards user input.

5. **Batch DB writes** — Wrap `saveQuestionAttempts` in a transaction. Simple change, measurable performance win on lesson complete.

6. **Delete orphan scaffold** — Remove `components/`, `constants/` root directories. They add confusion and are never imported.

7. **Add hook tests** — `useProgress` and `useLessonQuiz` are the two most critical hooks. Testing them covers the majority of state management logic.

8. **Handle DB initialization failure** — Add error handling in `DatabaseProvider` and keep splash screen visible until DB is ready.

---

*Concerns audit: 2026-03-28*
