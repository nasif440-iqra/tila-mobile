# Phase 5: Celebrations & Feedback - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a tiered celebration system with 4 distinct levels (micro, small, big, milestone), add letter mastery and phase completion celebrations, and ensure all encouragement messages use warm Islamic phrases. Phase 4 already delivered correct-answer feedback, lesson summary tiers, and mid-celebration enhancements — this phase completes the full system.

</domain>

<decisions>
## Implementation Decisions

### Tiered Celebration System
- **D-01:** Four tiers, each visually distinct: micro (correct answer sparkle — already exists via QuizOption), small (lesson complete — LessonSummary WarmGlow tiers from Phase 4), big (letter mastered), milestone (phase complete).
- **D-02:** Each tier escalates in visual intensity and haptic strength — micro is subtle, milestone is the peak.
- **D-03:** Celebrations should be elegant but restrained — consistent with the "quiet confidence" direction. No fireworks or over-the-top animations.

### Letter Mastery Celebration
- **D-04:** When a letter reaches "retained" mastery state, it should get a special celebration — noticeably more impactful than a correct answer but not as grand as a phase completion.
- **D-05:** The celebration should acknowledge the achievement with Islamic warmth — something like "MashaAllah! You've mastered [letter name]."

### Phase Completion Celebration
- **D-06:** Phase completion (all lessons in a phase done) triggers the biggest celebration — this should feel like a genuine achievement.
- **D-07:** The `app/phase-complete.tsx` screen already exists — it should be elevated with the milestone tier animation.

### Islamic Encouragement
- **D-08:** Replace all generic encouragement text with warm Islamic phrases across the app. Use Bismillah, MashaAllah, Alhamdulillah, SubhanAllah contextually appropriate.
- **D-09:** Existing engagement.js copy pools should be audited and expanded with Islamic phrases where they don't already have them.

### Animation & Interaction
- **D-10:** Use Phase 1's shared animation presets — no new magic numbers.
- **D-11:** Haptics: micro=hapticTap, small=hapticSuccess, big=hapticMilestone, milestone=hapticMilestone (with visual escalation).

### Claude's Discretion
- Specific animation for letter mastery celebration (scale burst? WarmGlow pulse? gold shimmer?)
- Phase completion screen visual enhancement approach
- Whether to create a shared CelebrationOverlay component or handle per-context
- Which engagement.js copy pools need Islamic phrase additions
- How to detect and trigger letter mastery celebration in the quiz flow
- Whether to add a toast/banner system or use full-screen overlays

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Celebration-Related Code
- `app/phase-complete.tsx` — Existing phase completion screen
- `src/components/quiz/QuizCelebration.tsx` — Mid-lesson celebration (enhanced in Phase 4)
- `src/components/LessonSummary.tsx` — Lesson completion with tiered WarmGlow (Phase 4)
- `src/design/components/QuizOption.tsx` — Correct/wrong answer animations (Phase 1)

### Engagement Copy
- `src/engine/engagement.js` — Copy pools: CLOSING_QUOTES, MID_CELEBRATE_COPY, WRONG_ENCOURAGEMENT, pickCopy

### Mastery System
- `src/engine/mastery.js` — Mastery state machine (not_started → introduced → unstable → accurate → retained)
- `src/hooks/useMastery.ts` — Hook for mastery state
- `src/hooks/useLessonQuiz.ts` — Quiz results that feed into mastery updates

### Design System
- `src/design/animations.ts` — Shared animation presets
- `src/design/haptics.ts` — Haptic feedback presets (tap, success, error, milestone)
- `src/components/onboarding/WarmGlow.tsx` — Animated warm glow (reusable)

</canonical_refs>

<code_context>
## Existing Code Insights

### What Phase 4 Already Delivered
- **QuizCelebration:** Scale entrance + hapticMilestone + dynamic MID_CELEBRATE_COPY — this is the "small" tier
- **LessonSummary:** Tiered WarmGlow (140/100/none) + tiered haptics (milestone/success/tap) + interpolateColor count-up
- **WrongAnswerPanel:** WRONG_ENCOURAGEMENT prefix
- **QuizOption:** Correct sparkle + haptic, wrong shake + haptic (Phase 1)

### What Needs Building
- **Letter mastery celebration** — No existing component. Triggered when mastery state reaches "retained."
- **Phase completion enhancement** — `phase-complete.tsx` exists but is basic.
- **Islamic phrase expansion** — engagement.js pools need audit.
- **Formal tier system** — The tiers exist implicitly but aren't formalized as a reusable system.

### Integration Points
- `src/hooks/useLessonQuiz.ts` — Quiz results → mastery update happens after lesson completion
- `app/lesson/[id].tsx` — Lesson flow (intro → quiz → summary) — mastery celebration could trigger here
- `app/phase-complete.tsx` — Phase completion screen

</code_context>

<specifics>
## Specific Ideas

- Proportional celebrations — don't overdo it for small wins
- Islamic phrases should feel natural, not forced — contextually appropriate
- "MashaAllah" for achievements, "Bismillah" for beginnings, "Alhamdulillah" for completions
- Letter mastery is a bigger deal than a correct answer — the user has truly learned something
- Phase completion is the peak — all lessons done, genuine progress

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-celebrations-feedback*
*Context gathered: 2026-03-29*
