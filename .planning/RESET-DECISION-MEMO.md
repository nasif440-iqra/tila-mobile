# Curriculum Reset — Decision Memo (v2, post-review)

**Date:** 2026-04-20
**Status:** Pending founder approval of this revision
**Branch:** work on `main`
**Motivator:** V2 hybrid model stalled at teaching quality; founder drafting new curriculum blueprint; reset + sandbox scaffolding chosen over continued iteration.

## What this revision corrected

Reviewer flagged four overconfident decisions in the first memo. All folded in:

- **`src/engine/mastery.ts` moved from Keep to Quarantine.** Its entity-key format (`letter:2`, `combo:ba-fatha`) is an encoded opinion. Keeping the file is fine; declaring it the future lesson contract is not.
- **DB writes are now specified per-table.** Earlier memo said "leave empty tables" but didn't commit to which writes survive. Added section 4.
- **Per-commit validate rule relaxed to checkpoint gates.** Some intermediate refactors won't typecheck between commits; that's fine if the gate passes. Added section 8.
- **Grep audit expanded.** Added ~15 additional consumers and lesson-shape references. Added section 9.

Also added: **explicit shippability stance for `main` during the reset window** (section 11). And the `LessonRunner` contract is now genuinely shape-neutral — it tracks index and advance only, screens are defined by their caller.

## 1. Decision summary

Hard reset of all lesson code (v1 + v2) on `main`. Consistent rule: **keep pure infrastructure files in the repo (design, audio, dateUtils, Arabic reference data); quarantine lesson-adjacent and potentially coupled systems (mastery, habit, progress/state hooks, analytics, monetization, auth, sync, social) — files stay, but writes stop and callers get stubbed until the blueprint confirms their format.** Delete everything lesson-specific (v1 generators, v1 components, v1/v2 lesson data, lesson routes). Add a shape-neutral `LessonRunner` sandbox runtime + one hidden reference lesson as scaffolding. Archive `feature/curriculum-v2` as `archive/curriculum-v2` branch. Execute checkpoint-gated commit sequence with expanded pre-cleanup grep audit and post-cleanup verification.

## 2. Keep / Delete / Quarantine table

**Keep** = file survives unchanged AND is actively used after reset.
**Quarantine** = file survives (maybe modified to decouple), but is dormant — nothing writes to it or depends on it until the blueprint confirms format.
**Delete** = file removed from `main`.

| File / Module | Verdict | Notes |
|---|---|---|
| `src/data/lessons.js` | Delete | 106-lesson v1 array |
| `src/data/letters.js` | Keep | Arabic facts — shape may be renormalized later but content survives |
| `src/data/harakat.js` | Keep | Arabic facts |
| `src/data/connectedForms.js` | Keep (with note) | Format (initial/medial/final/isolated) is opinionated; content is facts |
| `src/engine/questions/` (dir) | Delete | All v1 generators |
| `src/engine/outcome.ts` | Delete | v1 pass thresholds |
| `src/engine/insights.ts` | Delete | v1 post-lesson insights |
| `src/engine/engagement.ts` | Delete | v1 outcome tiering |
| `src/engine/progress.ts` | **Quarantine** | Rewrite to thin shim: only habit write; drop mastery + lesson completion paths |
| `src/engine/selectors.ts` | Delete | `planReviewSession` tied to v1 questions |
| `src/engine/mastery.ts` | **Quarantine** | Entity-key schema is opinionated. File stays, no caller uses it after reset until blueprint confirms format |
| `src/engine/dateUtils.ts` | Keep | Pure date utils |
| `src/engine/habit.ts` | **Quarantine** | Streak logic is lesson-agnostic in concept, but verify `recordPractice` has no implicit lesson coupling before trusting |
| `src/components/exercises/` | Delete | v1 exercise components |
| `src/components/quiz/` | Delete | v1 quiz components |
| `src/components/Lesson{Quiz,Intro,Hybrid,Summary}.tsx` | Delete | — |
| `src/components/home/LessonGrid.tsx` | Delete | — |
| `src/components/celebrations/LetterMasteryCelebration.tsx` | Delete | — |
| `src/hooks/useLessonQuiz.ts` | Delete | — |
| `src/hooks/useProgress.ts` | Quarantine | Reduce to habit readers only; drop mastery + lesson reads |
| `src/hooks/useHabit.ts` | Quarantine | Decouple `recordPractice` from lesson flow |
| `src/state/provider.tsx` | Quarantine | Drop lesson completion aggregation |
| `app/lesson/[id].tsx` | Delete | — |
| `app/lesson/review.tsx` | Delete | — |
| `app/phase-complete.tsx` | Delete | — |
| `app/post-lesson-onboard.tsx` | Delete | — |
| `app/(tabs)/index.tsx` | Quarantine | Strip lesson grid, keep streak hero + "curriculum coming" placeholder |
| `src/design/` | Keep | Full design system |
| `src/audio/` | Keep | Audio player + letter sounds |
| `src/analytics/events.ts` | Quarantine | Trim orphaned `lesson_*` event types after audit confirms no emitters remain |
| `src/monetization/` | Quarantine | `FREE_LESSON_CUTOFF` and `useCanAccessLesson` have lesson-count coupling; stub until paywall model confirmed |
| `src/auth/`, `src/sync/`, `src/social/` | Quarantine | Verify `exportProgress`/`resetProgress`/sync push-pull don't silently depend on lesson tables having rows |
| `src/db/schema.ts` | Keep | Empty lesson tables stay — no migration |
| `docs/superpowers/specs/2026-04-07-curriculum-v2-design.md` | Delete | Obsolete |
| `docs/superpowers/plans/2026-04-07-curriculum-v2-plan-*.md` | Delete (3 files) | Obsolete |
| Older UI/wave/monetization specs (2026-03-*) | Keep | Describe earned infra |
| `feature/curriculum-v2` branch | Rename → `archive/curriculum-v2` | Preserve branch label |
| `.worktrees/curriculum-v2` | Delete | Worktree no longer needed |
| `worktree-agent-*` branches (~40) | Delete | Accumulated cruft |

## 3. Scaffolding additions

### 3.1 Shape-neutral `LessonRunner`

**File:** `src/curriculum/runtime/LessonRunner.tsx`

The runtime tracks index and advance state only. It does NOT know what a screen looks like. The caller supplies a render function.

```ts
type LessonRunnerProps = {
  screenCount: number;
  onComplete: () => void;
  children: (current: number, advance: () => void) => React.ReactNode;
};
```

No `Screen` union is exported from runtime. No teach/check categorization. The new curriculum can define screens however it likes when the blueprint arrives. The runtime doesn't need to change.

### 3.2 Hidden reference lesson

**Files:** `src/curriculum/reference/types.ts`, `src/curriculum/reference/lesson.ts`

The reference lesson defines its own screen types **locally** (not exported as shared contract). Two teach screens + one check screen about Alif. Gated by `EXPO_PUBLIC_DEV_REFERENCE_LESSON=true`. Not visible to production users.

**Purpose:** smoke test the runtime + exemplar for the first real lesson. Verifies DB writes survive (habit only — no mastery yet), audio playback, progress tab render post-cleanup.

### 3.3 Dev route

**File:** `app/sandbox-lesson.tsx`. Dev-only, env-flag gated. Not linked from home.

### 3.4 Scaffold README

**File:** `src/curriculum/README.md`. Documents the runtime contract, how to author a lesson against it, how to run the reference lesson locally, and why the runtime is deliberately shape-neutral.

## 4. DB writes during and after reset

Explicit table of what persists after reset. Everything "dormant" means the table exists and keeps any existing rows, but nothing writes new rows until the blueprint specifies otherwise.

| Table | State after reset | What may write to it |
|---|---|---|
| `user_profile` | Active | Onboarding, theme preference, auth flows — unchanged |
| `habit` | Active | Sandbox reference lesson completion calls `recordPractice` (if it verifies clean) |
| `mastery_entities` | **Dormant** | Nothing — until blueprint confirms entity-key format |
| `mastery_skills` | Dormant | Nothing |
| `mastery_confusions` | Dormant | Nothing |
| `premium_lesson_grants` | Dormant | Nothing until paywall model re-confirmed against new curriculum |
| `lesson_attempts` | Dormant | Nothing (sandbox does NOT write here — too opinionated) |
| `question_attempts` | Dormant | Nothing |

**Sandbox reference lesson writes exactly one thing: a habit `recordPractice` call on completion (if audit confirms `recordPractice` is clean).** Everything else is inspection-only.

## 5. Archive strategy

```bash
git branch -m feature/curriculum-v2 archive/curriculum-v2
git tag curriculum-v2-final archive/curriculum-v2
git worktree remove .worktrees/curriculum-v2
# Push rename + tag to origin if remote exists
```

Then bulk delete ~40 `worktree-agent-*` branches in a single `chore:` commit.

## 6. Commit sequence

14 commits, ordered for dependency safety (remove consumers before definitions). Intermediate commits may not individually typecheck — see checkpoint gates (section 8).

1. `chore: archive feature/curriculum-v2 as archive/curriculum-v2`
2. `chore: prune stale worktree-agent branches (~40)`
3. `chore: remove .worktrees/curriculum-v2 worktree`
4. `docs: remove obsolete v2 specs and plans`
5. `refactor(app): stub home screen, remove lesson routes`
6. `refactor(hooks): reduce useProgress/useHabit to lesson-agnostic scope`
7. `refactor(components): remove v1 lesson components`
8. `refactor(engine): remove v1 question generators + selectors + outcome/insights/engagement`
9. `refactor(data): remove src/data/lessons.js`
10. `feat(curriculum): add sandbox LessonRunner + shape-neutral runtime`
11. `feat(curriculum): add hidden reference lesson + dev route`
12. `test(curriculum): smoke test LessonRunner plays reference lesson`
13. `docs(curriculum): add scaffold README`
14. `docs(planning): update STATE.md with reset-point marker`

## 7. Pre-cleanup grep audit (expanded)

Execute before commit 5. Document consumer counts per pattern in the commit message that removes the corresponding consumer.

**Lesson data / types:**
- [ ] `grep -rn "LESSONS\b" src/ app/` — v1 lessons array consumers
- [ ] `grep -rn "LESSONS_V2\b" src/ app/` — v2 lessons consumers (should be 0 after branch archive, but verify)
- [ ] `grep -rn "Lesson\b\|LessonV2\|LessonMode\|LessonPhase" src/ app/` — v1/v2 type references
- [ ] `grep -rn "teachIds\|reviewIds\|teachEntityIds\|reviewEntityIds" src/ app/`

**Routes & navigation:**
- [ ] `grep -rn "/lesson/" src/ app/`
- [ ] `grep -rn "phase-complete\|post-lesson-onboard" src/ app/`

**Progress calculators:**
- [ ] `grep -rn "completedLessonIds\|currentLessonId\|getCurrentLesson\|getPhaseCounts\|getLearnedLetterIds\|getRecommendedLessons" src/ app/`
- [ ] `grep -rn "planReviewSession\|getDueEntityKeys\|getWeakEntityKeys" src/ app/`

**Analytics:**
- [ ] `grep -rn "lesson_started\|lesson_completed\|lesson_failed" src/ app/`
- [ ] `grep -rn "\"lesson_\|'lesson_" src/analytics/` — any other `lesson_*` event types

**Monetization:**
- [ ] `grep -rn "FREE_LESSON_CUTOFF\|useCanAccessLesson\|premium_lesson" src/ app/`
- [ ] `grep -rn "ACCOUNT_PROMPT_LESSONS" src/ app/`

**Sync / export / restore (most likely hidden coupling):**
- [ ] `grep -rn "exportProgress\|resetProgress\|importProgress\|restoreProgress" src/`
- [ ] `grep -rn "lesson_attempts\|question_attempts" src/` — SQL strings that read/write lesson tables
- [ ] `grep -rn "mastery_entities\|mastery_skills\|mastery_confusions" src/` — verify only `mastery.ts` and sync paths touch these

**Phase/module hardcoded references:**
- [ ] `grep -rn "Phase 1\|Phase 2\|Phase 3\|Phase 4" src/ app/`
- [ ] `grep -rn "phase:\s*[1-4]" src/ app/`

Any consumer found must be either deleted (if lesson-specific) or stubbed (if it lives in a Keep file). Document the disposition.

## 8. Checkpoint gates (replaces per-commit validate)

Commits may be individually non-green; gates must be green before proceeding to the next batch.

| Gate | After commits | Requirements |
|---|---|---|
| **G1: Clean** | 1–4 | `npm run typecheck` passes. App still v1. Docs removed. |
| **G2: Stripped** | 5–9 | `npm run typecheck` + `npm test` pass. App boots. Home shows placeholder. No lesson routes reachable. |
| **G3: Scaffolded** | 10–13 | G2 + `npm test` passes including new smoke test. With `EXPO_PUBLIC_DEV_REFERENCE_LESSON=true`, reference lesson plays end-to-end on device. |
| **G4: Verified** | 14 | Full post-cleanup verification checklist (section 10) passes. |

If any gate fails, do not proceed. Diagnose, fix with an additional commit inside that batch, re-run gate.

## 9. Post-cleanup verification (G4)

- [ ] `npm run validate` passes
- [ ] `npm test` passes
- [ ] App boots on iOS + Android
- [ ] Onboarding flow completes end-to-end
- [ ] Home renders "curriculum coming" placeholder, streak hero intact
- [ ] Progress tab renders (empty/zeroed state, no crashes)
- [ ] Auth sign-in/sign-out works
- [ ] Sync push/pull works with empty lesson tables
- [ ] Paywall loads, does not reference lesson counts
- [ ] `exportProgress` and `resetProgress` work without crashing on empty lesson tables
- [ ] Import/restore works with exports from the pre-reset state (forward-compatibility check)
- [ ] With `EXPO_PUBLIC_DEV_REFERENCE_LESSON=true`, reference lesson plays end-to-end; habit `recordPractice` increments as expected
- [ ] No `lesson_*` analytics events fire during sandbox play (they should be dormant)

## 10. Main branch shippability during reset

**Explicit stance: `main` is NOT shippable during the reset window.**

- The last shippable commit on `main` is `7ffa3de` (pre-reset). Tag it `pre-reset-shippable` before starting.
- No EAS builds should be triggered from `main` between commit 1 and a green G4.
- If a production hotfix is needed on the current beta during the reset window, cut the hotfix from `pre-reset-shippable` as a separate branch, ship it, and rebase/merge into `main` after G4 passes.
- Reset is expected to complete in one working session (estimated: ~4–6 hours of focused execution + device verification). If it stretches past that, re-evaluate whether to pause and preserve `main` shippability.

## 11. Rollback plan

Before commit 14, rollback is `git reset --hard HEAD~N` (N = commits since last green gate). `archive/curriculum-v2` branch + `curriculum-v2-final` + `pre-reset-shippable` tags are immutable references. Post-G4 flaws can cherry-pick from `archive/curriculum-v2` or revert individual commits.

## 12. Open questions (defer to blueprint, do not resolve in this reset)

1. Should the new curriculum reuse v2's entity-key format (`letter:N`, `combo:X-Y`) or something new?
2. Does the new curriculum want SRS scheduling, and if so, at what granularity?
3. Will `src/curriculum/` eventually house multiple curricula (alphabet, tajweed, vocabulary)?
4. Does the paywall model still gate by lesson count, or by something the new curriculum exposes differently?
5. Should `lesson_*` analytics event names be renamed or retained for continuity with the pre-reset funnel?

---

**Next step on approval:** invoke `superpowers:writing-plans` to turn this memo into an executable task list for Claude Code.
