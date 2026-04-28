---
gsd_state_version: 1.0
milestone: reset-2026-04-20
milestone_name: curriculum-reset
status: complete
stopped_at: Reset complete, awaiting new curriculum blueprint
last_updated: "2026-04-20T00:00:00.000Z"
last_activity: 2026-04-20 -- Curriculum reset complete; sandbox runtime + reference lesson in place
progress:
  total_phases: 1
  completed_phases: 1
  total_plans: 1
  completed_plans: 1
  percent: 100
---

# Project State — Post-Reset

## Project Reference

See: `.planning/PROJECT.md`
Reset memo: `.planning/RESET-DECISION-MEMO.md`
Execution plan: `.planning/RESET-EXECUTION-PLAN.md`
Pre-reset audit: `.planning/RESET-AUDIT.md`

**Core value unchanged.** Current focus: awaiting curriculum blueprint from founder.

## Current Position

Curriculum reset complete. All v1 and v2 lesson code removed from `main`. Archive branch: `archive/curriculum-v2` (tag `curriculum-v2-final` at commit `9daf0c0`). Safety tag: `pre-reset-shippable` at `7ffa3de`.

Neutral infra preserved: design system, audio, Arabic reference data (`letters.js`, `harakat.js`, `connectedForms.js`), db schema, providers, analytics (trimmed of `lesson_*` events), monetization (lesson-count coupling stubbed), auth, sync, social, onboarding.

Quarantined (files remain; no normal lesson/runtime flow writes to these, but maintenance paths may still touch them): `src/engine/mastery.ts` (still read by `useProgress` into app state; `resetProgress`/`importProgress` still clear/restore `mastery_*` tables for user-owned data management), `src/engine/habit.ts`, `src/engine/progress.ts` (reduced to habit + maintenance shim), `src/hooks/useProgress.ts`, `src/hooks/useHabit.ts`, `src/state/provider.tsx`, `src/auth/types.ts` (`ACCOUNT_PROMPT_LESSONS = []`), `src/monetization/hooks.ts` (`useCanAccessLesson` always-allow), `src/analytics/events.ts` (lesson events removed). Mastery is **preserved and quarantined, not fully excised** — blueprint decides whether current entity-key format survives.

Scaffolded: `src/curriculum/runtime/LessonRunner.tsx` (shape-neutral, generic `<T>`), `src/curriculum/reference/` (hidden dev-only reference lesson about Alif), `app/sandbox-lesson.tsx` (env-flag gated dev route). `src/curriculum/README.md` documents the scaffold.

Progress: [██████████] 100% (reset milestone complete)

## Reset Commit Log

| Commit | Task | Description |
|---|---|---|
| `beaa0d2` | 0 | Pre-reset grep audit + disposition classification |
| (branch ops, no commits) | 1–3 | Archive `feature/curriculum-v2`, prune 45 agent branches, remove worktree |
| `0a38a54` | 4 | Remove obsolete v2 specs and plans |
| `a142135`, `1d28c89` | 5 | Stub home + remove lesson routes |
| `d51069a` | 6 | Decouple quarantine files from lesson code |
| `6cd8cf9` | 7 | Remove v1 lesson components (19 files + 11 tests) |
| `a71948f` | 8 | Remove v1 lesson engine (22 files + 9 tests, scope expanded to orphaned hooks/components) |
| `57df226` | 9 | Remove `src/data/lessons.js` + orphaned progress components |
| (orphan test cleanup) | — | 10 orphaned test files + 2 trims (crescent-icon, mastery) |
| `71fe25f` | 10 | Add shape-neutral `LessonRunner` + pure cursor (TDD, 4/4 tests) |
| `3021eaa` | 11 | Add hidden reference lesson + dev route |
| `352c5f3` | 12 | Reference lesson smoke test (3/3 tests) |
| `6a6df6a` | 13 | Scaffold README |
| (this commit) | 14 | Update STATE.md with reset-point marker |

## Accumulated Context

### Decisions

See `.planning/RESET-DECISION-MEMO.md` for the full record of the reset decision and its review rounds.

### Pending Todos

- **New curriculum blueprint** — awaiting founder delivery (PDF + docx drafts already tracked at `curriculum/`).
- **Post-blueprint work**:
  - Define new `Screen` type(s) in `src/curriculum/` (NOT in `runtime/`)
  - Populate `src/curriculum/lessons/`
  - Decide paywall gating model (currently `useCanAccessLesson` always-allow, `FREE_LESSON_CUTOFF = Number.MAX_SAFE_INTEGER`)
  - Re-wire lesson analytics events if the new curriculum wants the same funnel
  - Restore lesson grid / tab rendering with new shape
- **Baseline tech debt flagged during reset** (pre-existing, not caused by reset):
  - `src/design/theme.ts:35` light/dark token type mismatch
  - `src/sync/service.ts:218` SQLite bind params type issue
  - `src/auth/provider.tsx` AuthEvent type issue
  - `app.config.ts` newArchEnabled type issue
  - `home-greeting.test.ts` + `motivation-mapping.test.ts` — `MOTIVATION_SUBTITLES` not exported from `greetingHelpers.ts` (15 failing tests)
- **Re-enable EAS builds on `main`** — paused during reset window per memo §10; can resume once device verification of sandbox reference lesson passes.

### Blockers/Concerns

- None blocking. New lesson work awaits blueprint (founder-owned).

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260423-0s2 | Implementing Task 3 of the A0 Lesson 1 plan: CompletionStore + AsyncStorage impl (TDD). | 2026-04-23 | 4fd3456 | [260423-0s2-implementing-task-3-of-the-a0-lesson-1-p](./quick/260423-0s2-implementing-task-3-of-the-a0-lesson-1-p/) |
| 260428-j5e | Rewrite Lesson 2 Teach phase per lesson1spec.txt (first-reading-win pivot). | 2026-04-28 | 6a35b33 | [260428-j5e-rewrite-lesson-2-teach-phase-per-lesson1](./quick/260428-j5e-rewrite-lesson-2-teach-phase-per-lesson1/) |

## Session Continuity

Last activity: 2026-04-28 - Completed quick task 260428-j5e: Rewrite Lesson 2 Teach phase per lesson1spec.txt (first-reading-win pivot).

Last session: 2026-04-20 — curriculum reset executed over ~14 commits.
Stopped at: Reset complete, awaiting blueprint.
Next command on blueprint delivery: `/gsd-do "design the new curriculum"` — triggers a new brainstorm cycle against this reset baseline.
