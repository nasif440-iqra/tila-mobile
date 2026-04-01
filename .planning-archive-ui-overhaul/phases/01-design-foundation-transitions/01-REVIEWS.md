---
phase: 1
reviewers: [claude]
reviewed_at: 2026-03-28
plans_reviewed: [01-01-PLAN.md, 01-02-PLAN.md, 01-03-PLAN.md, 01-04-PLAN.md]
---

# Cross-AI Plan Review — Phase 1

## Claude Review (Separate Session)

# Phase 1 Plan Review: Design Foundation & Transitions

## Plan 01-01: Animation Presets Module & Haptics Utility

**Summary:** A clean, well-scoped plan that creates two foundational utility modules. The task breakdown is appropriate — two independent modules with TDD approach. Values are directly traceable to user decisions D-04 through D-09. This is the simplest plan in the phase and the lowest risk.

**Strengths:**
- Values are explicitly tied to user decisions (D-04 through D-09), making them auditable
- TDD approach with tests written first
- Zero new dependencies — just organizing existing capabilities
- `as const` for type narrowing is the right call
- Haptics as plain utility (not a hook) is correct — no React state needed

**Concerns:**
- **LOW:** The `easings` export uses `Easing` from Reanimated at module scope. Vitest won't have Reanimated available natively — you'll need a mock or the tests will fail on import. The test spec doesn't mention mocking Reanimated's `Easing`. The haptics tests correctly mention mocking `expo-haptics`, but animations tests don't address the Reanimated dependency.
- **LOW:** No barrel export update — `src/design/index.ts` exists as an empty barrel. Not blocking, but worth noting for discoverability.

**Suggestions:**
- Add a Reanimated mock to the animations test (or a `vitest.setup.ts` mock) so `Easing` imports don't blow up. Something like `vi.mock('react-native-reanimated', () => ({ Easing: { out: vi.fn(x => x), in: vi.fn(x => x), inOut: vi.fn(x => x), cubic: 'cubic', exp: 'exp', ease: 'ease' } }))`.
- Consider testing that `easings` values are defined (not undefined) rather than testing specific function return values, since the Easing factory functions return opaque objects.

**Risk Assessment:** **LOW** — Straightforward constants file with clear specs. The only risk is the test environment mock for Reanimated.

---

## Plan 01-02: Component Polish with Shared Presets

**Summary:** Solid migration plan that replaces hardcoded values across 4 components and the tab layout. The task split (Button+Card in Task 1, HearButton+QuizOption+TabLayout in Task 2) is reasonable. The Card interactive mode addition is the only new feature; everything else is a refactor.

**Strengths:**
- Clear before/after mapping for every replacement
- Card interactive mode is backward-compatible (defaults to non-interactive)
- Acceptance criteria are grep-verifiable — good for automation
- Correctly identifies that ArabicText needs no changes
- QuizOption shake timing (50ms) deliberately stays below preset thresholds — good judgment call documented

**Concerns:**
- **MEDIUM:** Card.tsx adding `AnimatedPressable` wrapping introduces a conditional render path. If `interactive` is true, the component tree changes (Pressable wrapper appears). Any snapshot tests or layout-dependent code downstream could break. The plan doesn't check for existing Card consumers to verify this is safe.
- **MEDIUM:** HearButton currently has a loading/playing state. Adding press animation (scale) on top of existing disabled/loading states could create conflicting visual feedback — e.g., user taps while loading, scale animates but nothing happens. The plan doesn't address interaction between press animation and the loading state.
- **LOW:** The plan modifies `app/(tabs)/_layout.tsx` but Plan 03 modifies `app/_layout.tsx`. These are different files, but reviewers might confuse them. Clear enough in the plan text.

**Suggestions:**
- For HearButton: disable press animation when `loading` or `disabled` state is active. Don't scale down on press if the button can't respond.
- For Card: grep for existing Card usage (`grep -r "<Card" src/ app/`) during `read_first` to verify no consumers depend on the exact DOM structure.
- Consider whether `AnimatedPressable` should be created once at module scope in Card.tsx (not inside the component function) to avoid recreating it on each render.

**Risk Assessment:** **LOW-MEDIUM** — The refactoring is mechanical and well-defined. The Card interactive mode and HearButton animation additions carry minor risk of visual state conflicts but are unlikely to cause functional regressions.

---

## Plan 01-03: Screen Transitions & Consumer Migration

**Summary:** This plan has two distinct concerns: (1) configuring screen transitions in the root layout, and (2) migrating consumers off `onboarding/animations.ts`. Both are well-defined. The constant-mapping table from old to new is the critical piece, and it's carefully worked out.

**Strengths:**
- Explicit mapping table from old constants to new presets with rationale for each
- Smart decision to keep `TRANSITION_FADE_IN_DELAY` (100ms) as a local constant rather than forcing it into the preset system
- Bridge file approach for `onboarding/animations.ts` preserves onboarding-specific constants while removing the duplicated transition constants
- Screen transition mapping covers all known routes

**Concerns:**
- **MEDIUM:** The plan references `src/components/LessonHybrid.tsx` as a consumer of `onboarding/animations.ts`, but it's listed in `files_modified` without being confirmed via grep. If LessonHybrid doesn't actually import from that file, the task action will be looking for something that doesn't exist. The `read_first` step should catch this, but it's worth flagging.
- **MEDIUM:** The onboarding components themselves (the step components that use `STAGGER_BASE`, `STAGGER_DURATION`, `SPLASH_STAGGER_BASE`, etc.) are NOT migrated in this plan. They continue importing from `onboarding/animations.ts`. This means the bridge file must continue exporting those constants directly — the re-export of `durations` and `staggers` from the shared module is additive, not a replacement. This is fine but creates a file that both defines its own constants AND re-exports from another module, which could be confusing.
- **LOW:** `wird-intro`, `phase-complete`, and `post-lesson-onboard` screen files must actually exist as routes for the Stack.Screen declarations to work. If any of these routes don't exist yet (they're flow screens that may be conditionally rendered), Expo Router will warn. The plan doesn't verify route file existence.

**Suggestions:**
- Verify `LessonHybrid.tsx` actually imports from `onboarding/animations.ts` before including it in the task. If it doesn't, remove it from scope.
- Verify all screen route files exist (`ls app/wird-intro.tsx app/phase-complete.tsx app/post-lesson-onboard.tsx`) in the `read_first` step. Missing routes would cause warnings.
- The bridge re-export (`export { durations, staggers } from "../../design/animations"`) might not be needed if no onboarding file actually imports `durations` or `staggers` from `onboarding/animations.ts`. Verify actual usage before adding.

**Risk Assessment:** **LOW-MEDIUM** — The core transition config is straightforward. The consumer migration has some assumptions about which files import what that need verification during execution. No functional risk since constant values are preserved exactly.

---

## Plan 01-04: Validation & Verification Checkpoint

**Summary:** A hybrid automated + manual verification plan. Task 1 runs grep-based checks and test suites. Task 2 is a human-gated checkpoint where Nasif tests on device. This is the right approach for a phase that's primarily about visual and tactile quality.

**Strengths:**
- Comprehensive verification checklist covering all 4 success criteria
- Human gate is correctly marked as blocking — Phase 2 can't start without approval
- Verification covers the full matrix: transitions (6 routes), button press, card interactive, hear button, quiz option (3 states), tab bar
- Clear resume signal ("approved" or describe issues)

**Concerns:**
- **MEDIUM:** The plan assumes the user can easily trigger all verification scenarios. Some routes like `wird-intro`, `phase-complete`, and `post-lesson-onboard` are conditional flows — the user may not be able to navigate to them naturally during testing. The checklist says "if accessible" for some but not all.
- **LOW:** No guidance on what happens if the user reports issues. The plan says "describe specific issues to fix" but doesn't specify whether fixes loop back through Plans 01-02/01-03 or are handled inline in Plan 04.

**Suggestions:**
- Add "(if accessible)" qualifier to `wird-intro`, `phase-complete`, and `post-lesson-onboard` in the transition checklist, since these require specific app state to trigger.
- Clarify that issues reported by the user should be fixed and re-verified before marking the phase complete — not deferred to Phase 2.

**Risk Assessment:** **LOW** — This is a verification plan, not an implementation plan. The risk is only that some verification scenarios may be hard to trigger.

---

## Overall Phase Assessment

**Overall Risk: LOW**

The 4 plans form a coherent, well-ordered implementation:
1. Foundation modules (Wave 1, independent)
2. Component polish + transition config (Wave 2, parallel, depends on Wave 1)
3. Verification (Wave 3, depends on Wave 2)

**Cross-plan observations:**

- **Dependency ordering is correct.** Wave structure makes sense. Plans 02 and 03 can genuinely run in parallel since they touch different files (components vs. layout/consumers).
- **No scope creep.** The plans stay tightly within "centralize presets, polish components, configure transitions." No new features sneak in beyond the Card interactive mode, which is justified by D-03.
- **The constant value mapping is lossless.** Every old hardcoded value maps to a preset with the same numeric value. No behavioral changes in animation timing or feel — just indirection through named presets. This minimizes regression risk.
- **One gap across plans:** After all 4 plans complete, there will still be ~10+ files outside `src/design/components/` that import `expo-haptics` directly (exercises, quiz components, other screens). The phase scope correctly defers those to downstream phases, but it's worth noting that DES-04 ("All interactive elements have consistent haptic feedback") won't be fully satisfied until those files are migrated too. The success criteria say "every tappable element provides haptic feedback" — this is true at the design system component level but not at the feature component level.

**Recommendation:** Proceed with execution. The Reanimated mock for tests (Plan 01) is the only technical concern worth addressing before starting. Everything else can be handled during the `read_first` verification steps.

---

## Consensus Summary

Single reviewer — consensus not applicable. Key findings summarized below.

### Strengths (Agreed)
- Values explicitly tied to user decisions (D-04 through D-09), making them auditable
- TDD approach for foundation modules
- Zero new dependencies — reorganizing existing capabilities
- Lossless constant value mapping (no behavioral changes)
- Correct dependency ordering across waves

### Key Concerns
- **MEDIUM:** Reanimated mock needed for animation tests in Vitest (Plan 01-01)
- **MEDIUM:** Card interactive mode could affect downstream consumers (Plan 01-02)
- **MEDIUM:** HearButton press animation may conflict with loading state (Plan 01-02)
- **MEDIUM:** LessonHybrid import from onboarding/animations.ts needs verification (Plan 01-03)
- **LOW:** DES-04 (all interactive elements have haptics) only satisfied at design system level, not feature components — deferred to downstream phases

### Overall Risk: LOW
Recommend proceeding with execution. Only the Reanimated mock concern needs pre-addressing.
