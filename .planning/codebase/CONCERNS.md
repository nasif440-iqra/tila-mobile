# Codebase Concerns

**Analysis Date:** 2026-04-27

This document inventories quarantined zones, half-built systems, deprecated paths still in tree, and pre-existing tech debt as of the post-curriculum-reset baseline (reset commit window: 2026-04-20). Authority sources: `.planning/STATE.md`, `.planning/RESET-AUDIT.md`, `.planning/RESET-DECISION-MEMO.md`, `src/curriculum/README.md`.

The reset deliberately preserved several modules in a quarantined state — files remain in tree but no normal lesson flow writes through them. Those quarantines are the most important concerns to surface to any agent planning new work, because innocent-looking imports can silently re-activate dormant subsystems.

---

## Quarantined Zones (Files Live, Behavior Stubbed)

### Mastery engine — preserved but unwritten

- Issue: Entity-key format (`letter:2`, `combo:ba-fatha`, `recognition:2->3`) is an opinionated schema baked into the engine. The reset memo explicitly downgraded this from "Keep" to "Quarantine" because the new curriculum may use different entity identifiers (the new curriculum already uses `letter:ba`, `combo:ba+fatha`, `mark:fatha` — note the slug + `+` separator, not numeric IDs).
- Files: `src/engine/mastery.ts`, `src/engine/progress.ts` (mastery write functions: `saveMasteryEntity`, `saveMasterySkill`, `saveMasteryConfusion`, `mergeQuizResultsIntoMastery`)
- Current behavior: `LessonRunner` writes through `noopMasteryRecorder` (`src/curriculum/runtime/mastery-recorder.ts:31`), which only `console.log`s in dev and discards in prod. No attempts persist.
- Maintenance paths still touch these tables: `resetProgress`, `exportProgress`, `importProgress` in `src/engine/progress.ts:387-576` clear/restore them so the user-owned data isn't orphaned.
- Hidden coupling: `src/hooks/useProgress.ts:30` still calls `saveMasteryResults` (unused by lesson flow but exposed as `saveMasteryOnly` on the hook). `src/state/provider.tsx:96` re-exposes `saveMasteryOnly`. If a planner wires these to a new lesson UI, mastery would silently start writing in the OLD entity-key format.
- Blocker: New curriculum blueprint must declare its entity-key format. Until then, do not re-enable mastery writes.

### Quarantined hooks and providers

- Issue: These read mastery from SQLite into app state but no UI consumes the mastery branch. They survive only to keep the data-management paths (reset, export, import) functional and to expose habit/profile reads.
- Files:
  - `src/hooks/useProgress.ts` — loads mastery into `state.mastery`, exposes `saveMasteryOnly`
  - `src/hooks/useHabit.ts` — duplicates `recordPractice` logic that also lives on the AppState provider
  - `src/state/provider.tsx:25-65` — `recordPractice` implementation duplicates the same SQL block from `useHabit`; both write to the same `habit` row
  - `src/state/provider.tsx:73` — `completedLessonIds: []` hard-stubbed to empty array
- Current behavior: `app/(tabs)/index.tsx` consumes `useAppState()` for habit/profile reads only. No surface reads `state.completedLessonIds`.
- Hidden coupling: Two divergent `recordPractice` implementations (provider + hook) means a refactor touching one and not the other will desync. The provider version refreshes via `progressHook.refresh()`; the hook version sets local state directly.
- Blocker: Cannot collapse until new curriculum decides whether `completedLessonIds` (numeric) or string lesson IDs (`"lesson-01"`) is the future shape. Lesson 1 is currently tracked separately via `asyncStorageCompletionStore.markCompleted("lesson-01")` (`src/curriculum/runtime/completion-store.ts`), bypassing the SQL `lesson_attempts` table entirely.

### Stub: `useCanAccessLesson` — always allows

- Issue: Paywall gating is fully disabled. `FREE_LESSON_CUTOFF` is set to `Number.MAX_SAFE_INTEGER`, `useCanAccessLesson` returns `true` unconditionally, `usePremiumReviewRights` returns `[]`.
- Files: `src/monetization/hooks.ts:5,11-19`
- Current behavior: Every lesson is free. Paywall trigger surfaces (e.g., `home_upsell` in `app/(tabs)/index.tsx:259`) still render, but no lesson is ever locked.
- Downstream consumer: `app/(tabs)/index.tsx:26,104,259` uses `useSubscription()` for trial badges; nothing currently calls `useCanAccessLesson` from the route tree.
- Blocker: Founder/product decision on monetization model under the new curriculum (see `project_monetization-decision.md` in user memory: 6 lessons free + 7-day trial + $8.99/mo + $49.99/yr was the pre-reset decision). Need to re-confirm against the new curriculum's lesson count and pacing.

### Stub: `ACCOUNT_PROMPT_LESSONS = []`

- Issue: Anonymous-to-authenticated upgrade prompts are turned off. Pre-reset value was `[3, 5, 7]` (prompt at lessons 3, 5, 7).
- File: `src/auth/types.ts:23`
- Current behavior: Anonymous users never see the account creation prompt mid-curriculum.
- Blocker: Same as above — new curriculum's lesson numbering must be defined before re-selecting prompt points.

### Stub: lesson_* analytics events removed

- Issue: All `lesson_started`, `lesson_completed`, `lesson_failed` event types were stripped from the EventMap. The pre-reset funnel (start → complete) cannot be measured.
- File: `src/analytics/events.ts` (event map at line 133-158; no `lesson_*` keys remain)
- What still emits: `phase_completed`, `letter_audio_played`, `mastery_state_changed`, `account_prompt_*`, paywall events, sync events. But these orphan `mastery_state_changed` and `letter_audio_played` (no current call sites in the new lesson flow — they shipped with the old curriculum).
- Lesson 1 (the only shipped lesson) emits NO analytics events on completion. `app/lesson/[id].tsx:25-28` only writes to `asyncStorageCompletionStore` — no `track()` call.
- Blocker: Founder must decide whether to retain the old funnel event names for continuity, or rename to a v2 funnel. RESET-DECISION-MEMO.md §12 question 5 explicitly defers this.

---

## Half-Built / Half-Wired Subsystems

### Exercise renderer dispatch — three of seven types unimplemented

- Issue: `src/curriculum/types.ts:107-153` defines six concrete exercise types (`tap`, `hear`, `choose`, `build`, `read`, `fix`). Only `tap`, `hear`, and `read` have UI renderers.
- Files:
  - Defined: `src/curriculum/types.ts` (`ChooseExercise`, `BuildExercise`, `FixExercise`)
  - Renderers present: `src/curriculum/ui/exercises/TapExercise.tsx`, `HearExercise.tsx`, `ReadExercise.tsx`
  - Dispatcher: `src/curriculum/ui/exercises/index.tsx:60-63` falls through to `<UnimplementedExercise type={exercise.type} />` for `choose`, `build`, `fix`
- Current behavior: Authoring a lesson with any of these exercise types compiles cleanly (the union accepts them) but renders an "Exercise type \"X\" not yet implemented." stub at runtime.
- Blocker: No new lesson author needs them yet (Lesson 1 only uses `read`/`hear`). Decide which lesson first introduces each type, then build the renderer at that point.

### Single shipped lesson — registry holds one entry

- Issue: `src/curriculum/lessons/index.ts` registers only `lessonOne`. Home screen (`app/(tabs)/index.tsx:274-306`) hard-codes the Lesson 1 CTA card with a literal "Lesson 2 coming soon" disabled placeholder.
- Files: `src/curriculum/lessons/index.ts:5`, `src/curriculum/lessons/lesson-01.ts`, `app/(tabs)/index.tsx:292-294`
- Current behavior: User can complete Lesson 1, replay it, then sees a static "coming soon" pill. No lesson grid, no progression, no review.
- Blocker: Awaits new curriculum blueprint delivery from the founder. `STATE.md` lists this as the gating "Pending Todo".

### Audio assets incomplete — kasra/dhamma not recorded

- Issue: Lesson 1 references audio for fatha (recorded) plus kasra and dhamma (not recorded). The mark-preview UI renders disabled `HearButton`s for the missing ones — the no-fallback directive prevents silent or substitute audio.
- Files: `src/curriculum/lessons/lesson-01.ts` (header comment lines 19-21), `src/curriculum/types.ts:80-84` (mark-preview block doc says "An option without audioPath should render a disabled HearButton")
- Per-letter audio assets: `assets/audio/names/*.wav` and `assets/audio/sounds/*.wav` (28 letters × 2 modes shipped, but ALL are flagged as deleted in the working tree per `git status` — they may have been moved or replaced; verify before relying on them)
- Note from git status: every `.wav` under `assets/audio/names/` and `assets/audio/sounds/` shows as deleted. A new `assets/audio/names/ba_letter.mp3` is untracked. Audio asset organization is mid-migration.
- Blocker: Founder/voice talent needs to record kasra + dhamma sounds. Audio asset path/format is also unsettled (mp3 vs wav, "ba_letter" vs "ba" naming).

### Sandbox-only routes

- Issue: `app/sandbox-lesson.tsx` is gated behind `EXPO_PUBLIC_DEV_REFERENCE_LESSON=true` env flag. Currently the route only renders 3 generic "tap next" teach screens — it does NOT render the historical "reference lesson about Alif" described in `RESET-DECISION-MEMO.md §3.2`.
- Files: `app/sandbox-lesson.tsx:11`, `app/sandbox-lesson.tsx:13-28` (inline `sandboxLesson` data — minimal smoke test, not an exemplar)
- `src/curriculum/reference/` directory does NOT exist on disk (referenced in `src/curriculum/README.md:11` but never created or already removed).
- Current behavior: Without the env flag, route redirects to home. With the flag, plays a 3-screen runtime smoke test. The README's claim of a "reference lesson about Alif" is stale documentation.
- Blocker: Either build the actual reference lesson under `src/curriculum/reference/` to match the README, or update the README to reflect that the sandbox is now a generic 3-screen smoke test.

### `audio-test` and `auth` routes

- Issue: `app/audio-test.tsx` and `app/auth.tsx` are present but not linked from the active home screen. Their integration status is unclear.
- Files: `app/audio-test.tsx`, `app/auth.tsx`
- Blocker: Not currently breaking anything. Confirm with founder whether they remain useful after the reset or should be removed.

---

## Pre-Existing Tech Debt (Flagged in `.planning/STATE.md` "Baseline tech debt")

### Type errors — known typecheck failures

These are listed in `STATE.md:74-79` as pre-existing (NOT caused by reset):

- `src/design/theme.ts:35` — light/dark token type mismatch. `darkColors` and `lightColors` have different inferred shapes (e.g., `darkColors` adds `primaryDark: "#D4EAE0"` and `dangerDark: "#F0A8A6"` not present in `lightColors`). `ColorTokens = typeof lightColors` (`src/design/tokens.ts:53`) means `darkColors` is structurally not assignable.
- `src/sync/service.ts:218` — SQLite bind params type issue. `db.runAsync(sql, values)` where `values` is `unknown[]` but `runAsync` expects a more constrained param type.
- `src/auth/provider.tsx` — `AuthEvent` type issue with Supabase callback signature.
- `app.config.ts` — `newArchEnabled: true` flagged as unrecognized property in Expo config types.
- Blocker: None — small targeted fixes. Root-cause: `tsconfig.json` has `strict: true` but these were grandfathered in.

### Failing tests — `MOTIVATION_SUBTITLES` not exported

- Issue: `home-greeting.test.ts` and `motivation-mapping.test.ts` import `MOTIVATION_SUBTITLES` from `src/utils/greetingHelpers.ts`, but the symbol is not exported. Reportedly 15 failing tests.
- Files: `src/utils/greetingHelpers.ts`, `src/__tests__/home-greeting.test.ts`, `src/__tests__/motivation-mapping.test.ts`
- Blocker: Either export the constant or rewrite tests to assert on `getMotivationSubtitle()` output instead.

### EAS builds paused on `main`

- Issue: Per `RESET-DECISION-MEMO.md §10`, no EAS builds should run from `main` between reset start and a green G4 verification. Status as of 2026-04-27: G4 not formally verified post-reset on a device.
- Blocker: Device verification of sandbox reference lesson (or the new Lesson 1 route) needs to pass. `STATE.md:80-81` says "can resume once device verification of sandbox reference lesson passes."

---

## Deprecated / Orphaned Code Still in Tree

### `src/types/lesson.ts` — old Lesson interface (numeric IDs)

- Issue: Defines the OLD lesson shape (`id: number`, `teachIds: number[]`, `reviewIds: number[]`, `lessonMode: string`). The new `LessonData` (string ID, exercises, screens) lives at `src/curriculum/types.ts:187`. The old interface should be deleted but the RESET-AUDIT.md disposition table marked it `delete | task 8` and it's still here.
- Files: `src/types/lesson.ts:1-15`
- Current importers: Verify with grep before deletion — `mergeQuizResultsIntoMastery` and other quarantined engine code may transitively reference it.
- Blocker: Confirm no live import. Then delete.

### Quarantined engine functions in `src/engine/progress.ts`

- Issue: `src/engine/progress.ts` retains many function exports that lesson flow no longer calls — `saveMasteryResults`, `saveMasteryEntity`, `saveMasterySkill`, `saveMasteryConfusion`, `markPremiumLessonGranted`, `loadPremiumGrantedLessonIds`, `clearPremiumGrants`, `exportProgress`, `importProgress`, `resetProgress`. The file's header comment claims "thin shim" but it's still ~600 lines.
- File: `src/engine/progress.ts` (full file)
- Used by: `useProgress.saveMasteryOnly` (no UI call site), `resetProgress`/`exportProgress`/`importProgress` (used by data-management UI if any — verify in `src/sync/`).
- Blocker: Mastery future is undecided; export/import contract for users with pre-reset mastery data is undecided. Do not delete until blueprint commits.

### Tracked deletions in working tree

- Issue: `git status` shows ~55 audio assets (`assets/audio/names/*.wav`, `assets/audio/sounds/*.wav`) and a top-level `1.png` and a Mac screenshot file marked as `D` (deleted but not committed). Also `image.png`. These deletions have not been finalized into a commit.
- Risk: Either someone restores them and the deletes get reverted, or someone commits the deletes and breaks any audio path that still points to them. Since `lesson-01.ts` only uses `name-sound-pair.left.audioPath`/`right.audioPath` paths (verify the actual paths against the assets directory), there's a real chance the wav-vs-mp3 transition is mid-flight.
- Blocker: Resolve audio asset migration to one canonical location and format, then commit the deletes.

### Untracked curriculum assets

- Issue: `git status` shows untracked `Tila_Master_Curriculum_v3.1.1_Merge_Ready_Patch.docx` at repo root and `curriculum/phase-1/01-arabic-starts-here.original-pre-v4.md.bak`. These should either be tracked (if part of the new blueprint flow) or moved out of the repo.
- Blocker: Founder owns curriculum docs; no blocker for engineering until they choose a home.

---

## Performance / Animation Pitfalls (From `.planning/research/PITFALLS.md`)

These were documented during the UI overhaul research (2026-04-03) and remain relevant standing concerns for any animation work:

### withRepeat 12-minute memory leak (Android)

- Issue: `FloatingLettersLayer.tsx` (referenced throughout PITFALLS.md and SUMMARY.md) was identified pre-reset as harboring an Android-specific bug where repeating animations break after ~12 minutes.
- File: Component appears to have been removed during reset cleanup. Verify with `find . -name "FloatingLettersLayer*"` before relying on this concern. If the component is gone, the bug is moot; if it returns, patch before shipping.
- Blocker: Component status post-reset uncertain. Audit before next ambient animation work.

### Arabic text clipping at tight lineHeight ratios

- Issue: Diacritics (harakat) clip when `lineHeight` is less than ~1.67x font size. Quranic text with full tashkeel needs 2.2-2.5x lineHeight on Amiri.
- File: `src/design/components/ArabicText.tsx` (verify current ratio against the SUMMARY.md "1.39x ratio in codebase" claim — may have been fixed in earlier UI overhaul phases)
- Risk: Visible regression for users running fully voweled prompts. For a Quran-learning app, clipped diacritics destroy credibility.
- Blocker: Test all sizes with "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ" before next typography change.

### Reduce Motion not enforced at primitive level

- Issue: PITFALLS.md flags this as App Store risk. Animations should call `useReducedMotion()` from Reanimated and fall back to static.
- Files: All Reanimated usage sites — `src/design/components/`, `src/components/home/AnimatedStreakBadge.tsx`, etc.
- Blocker: Audit current animated primitives for `useReducedMotion()` calls; add where missing.

---

## Architectural Smells

### Two `recordPractice` implementations

- Issue: `src/hooks/useHabit.ts:20-74` and `src/state/provider.tsx:25-65` both define `recordPractice` with similar transactional SQL. The provider version is what the home screen actually consumes via `useAppState()`. The hook version is orphan.
- Files: `src/hooks/useHabit.ts`, `src/state/provider.tsx`
- Risk: Drift. If habit logic changes (e.g., grace-period rules), both must be edited.
- Fix approach: Delete `src/hooks/useHabit.ts` if confirmed unused, or have the provider import and call the hook's logic.

### `progress.completedLessonIds` permanently `[]`

- Issue: `src/state/provider.tsx:73` hard-codes empty array. `loadProgress` in `src/engine/progress.ts:93` also returns `[]`. Any UI logic that branches on "lessons completed" gets a degenerate signal.
- Risk: Any new feature reading `completedLessonIds` will see "user has completed nothing" regardless of reality (e.g., user finished Lesson 1 yesterday — it's recorded in AsyncStorage via `completion-store`, not SQL).
- Fix approach: Decide whether `lesson_attempts` SQL table will be the canonical source again, or whether AsyncStorage is the new source of truth (then update `loadProgress` to merge). Decision blocked on blueprint.

### Lesson 1 completion stored in AsyncStorage, not SQLite

- Issue: `app/lesson/[id].tsx:25-28` calls `asyncStorageCompletionStore.markCompleted(o.lessonId)`. Home screen reads via `asyncStorageCompletionStore.getCompletion("lesson-01")` (`app/(tabs)/index.tsx:179`). This bypasses every existing data-management path: not synced via Supabase, not exported by `exportProgress`, not cleared by `resetProgress`.
- Files: `src/curriculum/runtime/completion-store.ts`, `app/lesson/[id].tsx:25-28`, `app/(tabs)/index.tsx:179`
- Risk: A user who deletes the app loses Lesson 1 completion state even if they're signed in and synced. A user who hits "Reset progress" still sees "Lesson 1 complete" because AsyncStorage is untouched.
- Fix approach: Either (a) re-route Lesson 1 completion to the existing `lesson_attempts` table, OR (b) add the AsyncStorage key to `resetProgress`/`exportProgress`/`importProgress`/sync. Decision should align with the eventual completedLessonIds resolution.

### Inline lesson card on home screen

- Issue: `app/(tabs)/index.tsx:274-306` hand-codes a single Lesson 1 CTA card with literal copy ("Lesson 1 · Phase 1 · Module 1.1", "Arabic Starts Here", "Lesson 2 coming soon") and inline styles (lines 403-440). This is a placeholder — it needs to become a proper lesson grid driven off the registry.
- Files: `app/(tabs)/index.tsx:274-306,403-440`
- Risk: Adding Lesson 2 would require code edits in two places (registry + home), and the styles are inline rather than design-system-driven (raw hex values like `"#163323"`, `"#F8F6F0"`, `"#f4f1e8"` instead of `colors.primary` etc.).
- Fix approach: When Lesson 2 ships, replace this block with a registry-driven `LessonGrid` (or equivalent). Move colors back to theme tokens.

---

## Test Coverage Gaps

### Mastery recorder integration

- Issue: `noopMasteryRecorder` has unit test (`src/__tests__/curriculum/mastery-recorder.test.ts`) but no integration test verifies that `LessonRunner` would correctly call a real recorder. When the real impl lands, integration coverage will be the gating concern.
- Files: `src/__tests__/curriculum/mastery-recorder.test.ts`, `src/curriculum/runtime/LessonRunner.tsx:50-71`
- Risk: Real recorder ships with a bug nobody catches.
- Priority: Medium (tied to mastery un-quarantine work).

### Sync paths against quarantined tables

- Issue: `RESET-DECISION-MEMO.md §11` verification list calls for testing `exportProgress` and `importProgress` with empty lesson tables AND with pre-reset exports (forward-compatibility). Status of this verification on device is unconfirmed in `STATE.md`.
- Files: `src/sync/service.ts`, `src/engine/progress.ts:404-543`, `src/__tests__/sync-service.test.ts`
- Risk: A signed-in user with mastery data on the server pulls down rows that the new lesson code doesn't know how to interpret.
- Priority: High before next release.

### Lesson 1 end-to-end on device

- Issue: G4 verification (`RESET-DECISION-MEMO.md §10`) was not formally confirmed post-Lesson-1 ship. Lesson 1 is the first real production-facing artifact of the new runtime; its full path (route → runner → exercises → completion store → home rerender) needs device verification on iOS and Android.
- Files: `app/lesson/[id].tsx`, `src/curriculum/runtime/LessonRunner.tsx`, `src/curriculum/ui/`
- Priority: High before EAS builds resume on `main`.

---

## Open Questions Deferred to Blueprint

From `RESET-DECISION-MEMO.md §12` — these are NOT bugs but unresolved product decisions that block several concerns above:

1. Will the new curriculum reuse v2's entity-key format (`letter:N`, `combo:X-Y`) or something new? (The currently-shipped Lesson 1 already chose new format: `letter:ba`, `combo:ba+fatha`.)
2. Will SRS scheduling continue, and at what granularity?
3. Will `src/curriculum/` eventually house multiple curricula (alphabet, tajweed, vocabulary)?
4. Does the paywall model still gate by lesson count, or by something the new curriculum exposes differently?
5. Should `lesson_*` analytics event names be renamed or retained for continuity with the pre-reset funnel?

Each unresolved question keeps a quarantine in place. Resolving them is the path to deleting the dormant code.

---

*Concerns audit: 2026-04-27*
