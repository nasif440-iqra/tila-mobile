---
phase: 3
reviewers: [codex]
reviewed_at: 2026-04-06T18:00:00Z
plans_reviewed: [03-01-PLAN.md, 03-02-PLAN.md]
---

# Cross-AI Plan Review — Phase 3

## Codex Review (GPT-5.4)

### Plan 01 Review

#### Summary
Plan 01 is directionally correct and mostly matches the locked decisions for shared infrastructure first: `PhraseReveal`, onboarding-wide atmosphere, and a calmer Finish step are the right foundation before touching Bismillah, Tilawah, and Hadith. The main weakness is that it treats the primitive as a visual component only. In this codebase, the hard parts are animation lifecycle, skip behavior, reduced-motion fallback, Arabic/transliteration layout stability, and onboarding orchestration. Without those being explicit in Wave 1, Plan 02 inherits avoidable risk.

#### Strengths
- Establishes the shared primitive first, which aligns with D-01 and reduces duplication across Bismillah, Tilawah, and Hadith.
- Moves atmosphere to `OnboardingFlow`, which matches D-09 and avoids per-screen background drift.
- Separates Finish animation cleanup into its own task, which keeps SACR-06 scoped and testable.
- Removes `FloatingLettersLayer` from onboarding once atmosphere is centralized, which should simplify the visual stack and avoid duplicate ambient layers.

#### Concerns
- **HIGH**: `PhraseReveal` is underspecified for behavior. D-02, D-03, D-07 require auto-timed reveal, tap-to-skip, transliteration under each word, and CTA gating after completion. Plan 01 only says "build component," not how state completion, skip, and callback semantics work.
- **HIGH**: No explicit reduced-motion path. This repo already cares about `useReducedMotion` in ambient components, and a sacred reveal primitive without a motion fallback is a likely accessibility regression.
- **HIGH**: Arabic rendering details are missing. Word-by-word Arabic with transliteration beneath each token is prone to broken shaping, bidi issues, and line-wrap instability if implemented as plain `Text` runs. Existing `ArabicText` sets `writingDirection: "rtl"`, but per-word grouping needs explicit layout rules.
- **MEDIUM**: Wrapping `OnboardingFlow` in `AtmosphereBackground` may duplicate animation layers if `WarmGlow` or other step-local atmospherics remain in children. Hadith already uses `WarmGlow`; the plan should define whether that stays additive or gets tuned down.
- **MEDIUM**: "Remove `FloatingLettersLayer`" is broader than the requirement. D-09 says wrap the flow in onboarding atmosphere, but D-14 separately locks the Alif watermark only for Finish. The plan should verify that removing the onboarding-local letters does not flatten Welcome too much relative to SACR-03.
- **MEDIUM**: Test strategy is weak as written. "6 Wave 0 test scaffolds (source-scan pattern)" suggests file-content tests, but this phase's main risk is runtime sequencing and completion state, not static imports/strings.
- **LOW**: Finish animation task does not mention preserving current save/error behavior. `Finish.tsx` also owns retry/error UI, so animation changes should avoid disturbing CTA timing and failure states.

#### Suggestions
- Define `PhraseReveal` API up front: `words`, `transliterations`, optional `meanings`, `showPerWordMeaning`, `onComplete`, `skipMode`, `revealDurationMs`, `staggerMs`.
- Make completion semantics explicit: reveal completes naturally or via skip, then parent can show CTA.
- Add a reduced-motion contract: either instant reveal or significantly shortened stagger with no repeated motion.
- Specify layout constraints for Arabic: each semantic word should be a grouped column containing Arabic and transliteration; avoid splitting one Arabic token across lines; verify `flexWrap` / RTL behavior on narrow screens.
- Replace most scaffold tests with behavioral tests around skip/completion callbacks.
- In the atmosphere task, explicitly decide whether step-level `WarmGlow` remains on Hadith or is rebalanced against the new onboarding preset.

#### Risk Assessment
**MEDIUM**. The sequencing is good, but the shared primitive is the critical path and its hardest requirements are not specified. If `PhraseReveal` lands as a superficial animation wrapper, Wave 2 will either fork logic per screen or require rework.

---

### Plan 02 Review

#### Summary
Plan 02 covers the right screen-level changes and maps well to SACR-02, SACR-04, and SACR-05. The risk is that it assumes Plan 01 delivered a fully capable reveal primitive and that the existing steps can absorb it without layout, timing, or interaction problems. Bismillah in particular is not a simple content swap: it changes from timed auto-advance to a semantic micro-lesson with vertical units, gated CTA, and per-word meaning only on that screen.

#### Strengths
- Correctly treats Bismillah as a dedicated micro-lesson, not just another quote replacement.
- Replaces the exact legacy elements called out in the decisions: Tilawat `ShimmerWord`, Hadith static quote.
- Keeps Hadith's decorative frame language, which aligns with D-12 rather than over-redesigning.
- Keeps scope bounded to the three sacred screens.

#### Concerns
- **HIGH**: Bismillah task is under-scoped relative to requirements. It needs four semantic units, vertical layout, no auto-advance, CTA only after reveal, tap-to-skip, and per-word meaning only here. The current `BismillahMoment` auto-advances after 4 seconds and has no button, so this is a structural rewrite, not a content update.
- **HIGH**: Tilawah and Hadith requirements include full English after reveal, not per-word meaning. The plan mentions this for Hadith but not clearly for Tilawah, leaving SACR-04 partially unspecified.
- **HIGH**: No explicit handling of user interaction during reveal. If the user taps CTA area, scrolls, or navigates quickly, the component must avoid stale timers or duplicate `onComplete` events.
- **MEDIUM**: Layout shift risk. Revealing Arabic word-by-word with transliteration beneath each word can cause major reflow if space is not reserved.
- **MEDIUM**: Hadith's visual density may become too high if ArchOutline, WarmGlow, Arabic reveal, transliteration, full English, source line, and CTA all stack.
- **MEDIUM**: Plan does not mention accessibility labels or screen reader output for split Arabic phrases.
- **LOW**: Audio/haptic side effects should be checked. Bismillah currently triggers `playSacredMoment()` and `hapticSelection()` on mount.

#### Suggestions
- Split the Bismillah task into explicit sub-steps: semantic data model, reveal sequencing, CTA gating, removal of auto-advance timer, accessibility label and skip behavior.
- Add a screen-by-screen content contract: Bismillah per-word meaning, Tilawah/Hadith transliteration per word during reveal + full English only after reveal.
- Reserve layout space before reveal begins to avoid reflow.
- Define unmount/timer hygiene: cancel pending JS timers, ensure `onComplete` fires once, ensure skip transitions to completed state.
- Add test cases for: Bismillah no auto-advance, CTA hidden until reveal complete, skip reveals all words, Hadith/Tilawah show English only after completion.

#### Risk Assessment
**MEDIUM-HIGH**. The intent is right, but Bismillah is materially more complex than the plan implies, and the reveal screens are sensitive to layout/timing bugs.

---

### Cross-Plan Risks
- `PhraseReveal` must be fully specified before any screen migration.
- Reduced-motion support should be solved in Plan 01, not deferred to per-screen work.
- The atmosphere wrapper and Hadith local glow need a clear layering decision to avoid over-animation.
- Arabic token layout needs one canonical solution shared by all three screens.

### Overall Assessment
**Overall risk: MEDIUM**. The phase split is sensible and not obviously over-engineered, but the plans are currently too light on behavioral contracts. The likely failure mode is not "can't implement animation," it is shipping a reveal that technically works while missing skip, accessibility, layout stability, reduced-motion, or exact content gating requirements.

---

## Consensus Summary

### Agreed Strengths
*(Single reviewer — consensus N/A, reported as Codex findings)*
- Wave structure is correct: shared primitive first, screen rewrites second
- Scope is well-bounded to sacred screens only
- Decision coverage is comprehensive (D-01 through D-15)
- AtmosphereBackground centralization is the right approach

### Agreed Concerns
*(Highest priority from single reviewer)*
1. **PhraseReveal behavioral spec** — the plan's action blocks are actually very detailed (skip, reduced-motion, onComplete, Pressable, RevealWord internals) but the reviewer may not have seen the full plan text. **Verify the full plan covers these**.
2. **Arabic layout stability** — word-by-word Arabic rendering with flexWrap on narrow screens needs attention during execution
3. **Timer/unmount hygiene** — cleanup on skip and component unmount should be explicit
4. **Tilawah English after reveal** — Tilawah shows only one word, so post-reveal English may not apply. Verify against D-04.

### Divergent Views
*(N/A — single reviewer)*

### Reviewer Assessment vs Actual Plan Detail

**Important note:** The Codex reviewer received a summary of the plans, not the full plan text. Several HIGH concerns (PhraseReveal underspecified, no reduced-motion path, no Bismillah sub-steps) are actually addressed in detail in the full plan actions:
- Plan 01 Task 1 has full PhraseReveal API, RevealWord internals, useReducedMotion, Pressable skip, onComplete callback
- Plan 01 Task 3 has useReducedMotion for Finish
- Plan 02 Task 1 has full Bismillah data model, timer removal, CTA gating
- Plan 02 Task 3 has conditional English after revealComplete

The valid concerns that remain actionable:
1. Arabic layout stability on narrow screens (flexWrap + RTL)
2. Timer cleanup on unmount (useEffect return)
3. Layout space reservation to prevent reflow during reveal
