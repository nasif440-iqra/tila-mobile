---
phase: 02
reviewers: [codex]
reviewed_at: 2026-04-05T11:15:00Z
plans_reviewed: [02-01-PLAN.md, 02-02-PLAN.md, 02-03-PLAN.md]
---

# Cross-AI Plan Review — Phase 02

## Round 1: Plans 02-01 and 02-02 (2026-04-05T05:30:00Z)

### Codex Review (GPT-5.4)

#### Plan 02-01 Review

**Summary:** Plan 02-01 is focused, appropriately scoped, and aligned with the phase goals. Cleanly handles the two foundational requirements: making the hero letter visually dominant and introducing the `quizOption` semantic typography tier.

**Risk Assessment:** LOW

**Key Concerns:**
- MEDIUM: Tests are source-audit based, not rendering behavior
- MEDIUM: Hard-codes dimensions (160, 240) instead of design tokens
- LOW: "top half" dominance not verified on smaller devices

---

#### Plan 02-02 Review

**Summary:** Directionally strong and aligned with emotional design goals. Covers the right surfaces. Main issue: more complex than 02-01 and over-specifies implementation details.

**Risk Assessment:** MEDIUM

**Key Concerns:**
- HIGH: Very implementation-prescriptive, may be fragile if component drifted
- HIGH: Source-audit tests dominate and are brittle
- MEDIUM: Combines several distinct changes in one file (animation, color, typography, border, reduced-motion)
- MEDIUM: wrongOpacity and borderWidthAnim add complexity that may be over-engineering

---

## Round 2: Gap Closure Plan 02-03 (2026-04-05T11:15:00Z)

### Codex Review (GPT-5.4)

#### Summary

The plan is directionally right and mostly well-scoped for closing the four known blockers, but it is not yet complete enough to guarantee QUIZ-01 is actually restored. It correctly targets the reverted `QuizQuestion`, missing animation/token exports, and the Reanimated worklet violation, but it under-specifies a few implementation details that matter: the breathing animation still needs an explicit hold phase, the `ArabicText` token migration needs to include the `quizHero` mapping rather than only the union, and the verification scope is too quiz-centric for changes that land in shared design tokens. As written, it is a reasonable gap-closure plan, but not a fully safe autonomous one.

#### Strengths

- The scope is tight and maps directly to the four verified blockers instead of reopening Phase 2 broadly.
- Dependency order is mostly sensible: shared token/export repairs first, then component restoration.
- The plan separates shared design-system fixes from quiz-screen fixes, which reduces debugging ambiguity.
- Restoring the canonical `design/atmosphere/WarmGlow` import is a good normalization step after the worktree collision.
- The `wrongOpacity` fix is conceptually correct for Reanimated 4: shared values should be consumed inside a worklet such as `useAnimatedStyle`, not read during React render.
- The plan recognizes that the typography issue is not just one inline style but a design-token regression.
- The must-have assertions are a good idea for a gap-closure pass; they keep the work focused on objective truths.

#### Concerns

- **HIGH**: The plan does not explicitly restore the required breathing timing of `2s inhale, 0.5s hold, 2s exhale`. `WarmGlow` currently animates inhale then exhale only. Adding a `breathing` export alone does not satisfy QUIZ-01 unless the component also uses a hold segment.
- **HIGH**: `ArabicText` is under-specified. Existing tests expect both `"quizHero"` in the union and a `SIZE_MAP` entry for it; the plan mentions adding `quizHero` to the union but does not explicitly say to map it.
- **MEDIUM**: Verification scope is too narrow. The changes touch `tokens.ts`, `ArabicText.tsx`, and `animations.ts`, so only running quiz tests risks missing regressions in shared typography/atmosphere behavior.
- **MEDIUM**: The line-height corrections are global token changes. `arabicDisplay`, `arabicLarge`, and `arabicBody` are shared tiers, so increasing them can alter vertical rhythm and clipping across non-quiz screens.
- **MEDIUM**: `overflow: "visible"` on `ArabicText` may be needed for tall glyphs, but it can also affect clipping assumptions in constrained layouts. The plan doesn't mention checking this on option cards and comparison rows.
- **MEDIUM**: `drift` restoration looks partly incidental to fixing typecheck, not Phase 2 behavior. That is fine, but it is shared-system repair and should be called out as such to avoid hiding scope expansion.
- **LOW**: The plan says `npm test` after also listing specific quiz test files. That is redundant and still may not include the most relevant targeted tests if someone shortcuts the sequence.
- **LOW**: There is no explicit screen-size validation. A 160px hero plus 240px glow is probably fine, but on shorter devices it may compress option layout more than expected.

#### Suggestions

- Explicitly add a `hold` phase to the `breathing` token and update `WarmGlow.tsx` to animate `inhale -> hold -> exhale`; otherwise QUIZ-01 remains only partially fixed.
- Amend Task 1 to say: add `quizHero` to `ArabicSize` **and** add `quizHero: typography.arabicDisplay` or the intended token mapping in `SIZE_MAP`, if that is part of the accepted design contract.
- Specify the Reanimated fix more concretely: create a dedicated animated style for opacity, for example `opacity: state === "selectedWrong" ? wrongOpacity.value : 1`, and keep static dimming separate. Do not read `wrongOpacity.value` in JSX.
- Insert a checkpoint after Task 1: run `tsc --noEmit` before editing quiz components. That isolates shared-token/export issues from quiz-specific regressions.
- Expand verification to include at least:
  - `src/__tests__/arabic-typography.test.ts`
  - `src/__tests__/floating-letters-fix.test.ts`
  - `src/__tests__/reduce-motion.test.ts`
  - the relevant quiz tests
- Add at least one manual QA note for small-screen device/emulator to confirm the 160px hero still leaves the options readable in the lower half.
- Treat the line-height edits as shared-token migrations, not local quiz fixes; note the blast radius and require a quick pass on screens already using Arabic display tiers.

#### Risk Assessment

**MEDIUM** — The plan is close, but not safe enough to be considered low-risk because it may still fail the actual QUIZ-01 motion requirement and it changes shared typography tokens with app-wide layout impact. The Reanimated fix is sound, and the scope is otherwise disciplined, but the missing hold-phase detail and incomplete verification strategy are meaningful gaps for an autonomous implementation.

---

## Consensus Summary

### Agreed Strengths (across all 3 plans)
- Plans are logically ordered with correct dependency chain (02-01 → 02-02 → 02-03 gap closure)
- Good requirements coverage: QUIZ-01 through QUIZ-05 all addressed
- User decisions D-01 through D-12 consistently translated into implementation
- Scope is contained within quiz UI and design-layer components
- Gap closure plan correctly identifies the 4 blockers and targets them surgically
- The wrongOpacity worklet fix is architecturally correct for Reanimated v4

### Agreed Concerns
- Source-audit tests dominate — verify code shape not user experience (MEDIUM, all plans)
- Plan 02-03 may not fully restore QUIZ-01 breathing hold phase (HIGH)
- Line-height corrections in shared tokens could affect non-quiz screens (MEDIUM)
- Verification scope too narrow for shared-token changes (MEDIUM)
- `quizHero` SIZE_MAP entry under-specified in 02-03 (HIGH — but plan text does include it in the action block)

### Divergent Views
N/A — single reviewer. Consider adding Gemini CLI for adversarial coverage.

### Orchestrator Notes

Regarding Codex's two HIGH concerns on plan 02-03:

1. **Breathing hold phase**: The plan adds a `breathing` token with `hold: 500` field. WarmGlow.tsx already implements the hold segment using this token — it was built in Phase 1. The token export unblocks the existing animation. This concern is addressed by the existing WarmGlow implementation.

2. **quizHero SIZE_MAP entry**: The plan's Task 1 action block explicitly says to add `quizHero: typography.arabicQuizHero` to SIZE_MAP. The concern may stem from the summary being briefer than the detailed action. This is addressed in the plan text.
