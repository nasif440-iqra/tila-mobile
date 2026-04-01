# Phase 4: Lesson Experience - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish the core learning loop — lesson intro, quiz interactions, lesson summary, and all exercise screens. Every interaction should feel responsive, warm, and emotionally supportive. Same design philosophy as prior phases: subtle polish, life in the interactions, warm encouragement. The quiz mechanics already work (Phase 1 polished QuizOption); this phase elevates the surrounding experience.

</domain>

<decisions>
## Implementation Decisions

### Lesson Intro Screen
- **D-01:** Letter presentation should feel beautiful — the intro sets the tone before quiz questions begin. Similar quiet confidence to home screen.
- **D-02:** Use WarmGlow behind letter circles for visual warmth (reuse from Phase 2/3).
- **D-03:** Staggered entrance animations — header, letters, description, CTA fade in naturally.

### Quiz Interactions
- **D-04:** QuizOption already polished in Phase 1 (springs, haptics, correct/wrong state animations). This phase ensures the SURROUNDING quiz experience matches — question presentation, progress bar, feedback messages.
- **D-05:** Correct answer feedback: warm sparkle + haptic (hapticSuccess from Phase 1). Brief encouraging message.
- **D-06:** Wrong answer feedback: gentle shake + encouraging correction (hapticError from Phase 1). Not punishing — the WrongAnswerPanel should feel supportive, not like a failure.

### Lesson Summary / Completion
- **D-07:** Celebration proportional to score — great scores (80%+) get visual excitement (confetti/particles or animated burst), okay scores get warm encouragement.
- **D-08:** Animated accuracy count-up should feel satisfying — the number rising is already implemented, but could be enhanced with color transitions.
- **D-09:** Closing quotes and encouragement messages should feel warm and Islamic in character (aligned with Phase 2's Bismillah/encouragement direction).

### Exercise Screens
- **D-10:** All 6 exercise types (GuidedReveal, TapInOrder, BuildUpReader, FreeReader, SpotTheBreak, ComprehensionExercise) should share a consistent polished look.
- **D-11:** Stage indicator badges ("Learning" | "Building" | "Reading") should use design tokens consistently.
- **D-12:** Exercise transitions (switching between exercises within a hybrid lesson) should be smooth fades.

### Animation & Interaction
- **D-13:** Use Phase 1's shared animation presets — no new magic numbers.
- **D-14:** Haptics on all interactive elements using Phase 1 haptic presets.
- **D-15:** Same "life in the polish" principle — subtle micro-animations that make screens feel alive.

### Claude's Discretion
- Specific visual treatment for lesson intro letter presentation
- Celebration animation approach for lesson summary (Reanimated-based particles/burst vs simpler approach)
- How to make the progress bar feel more alive (animated fill, color transitions)
- Exercise screen polish priorities (which exercises need the most work)
- QuizCelebration (mid-lesson) enhancement approach
- Whether to add WarmGlow to any exercise screens
- Specific encouraging messages for wrong answers and lesson completion

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Lesson Screen Code
- `app/lesson/[id].tsx` — Lesson entry screen (intro → quiz → summary flow)
- `src/components/LessonIntro.tsx` — Lesson intro with letter cards
- `src/components/LessonQuiz.tsx` — Standard quiz lesson component
- `src/components/LessonHybrid.tsx` — Hybrid (Phase 4+) lesson component
- `src/components/LessonSummary.tsx` — Post-lesson results with accuracy count-up

### Quiz Components
- `src/components/quiz/QuizProgress.tsx` — Progress bar
- `src/components/quiz/QuizCelebration.tsx` — Mid-lesson celebration overlay
- `src/components/quiz/QuizQuestion.tsx` — Question display
- `src/components/quiz/WrongAnswerPanel.tsx` — Wrong answer feedback panel

### Exercise Components
- `src/components/exercises/GuidedReveal.tsx` — Progressive letter form revelation
- `src/components/exercises/TapInOrder.tsx` — Tap letters in reading order
- `src/components/exercises/BuildUpReader.tsx` — Progressive word building
- `src/components/exercises/FreeReader.tsx` — Full text reading
- `src/components/exercises/SpotTheBreak.tsx` — Identify word breaks
- `src/components/exercises/ComprehensionExercise.tsx` — Multiple choice with feedback

### Design System (from Phase 1)
- `src/design/animations.ts` — Shared animation presets
- `src/design/haptics.ts` — Haptic feedback presets
- `src/design/tokens.ts` — Color tokens, typography, spacing
- `src/design/components/QuizOption.tsx` — Polished quiz option (Phase 1)

### Reusable from Phase 2/3
- `src/components/onboarding/WarmGlow.tsx` — Animated warm glow (reusable)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **WarmGlow (Phase 2):** Animated pulsing warm glow — can add warmth to lesson intro letter circles.
- **QuizOption (Phase 1):** Already polished with springs, haptics, correct/wrong animations.
- **Animation presets (Phase 1):** springs, durations, staggers, easings — for all new animations.
- **Haptic presets (Phase 1):** tap, success, error, milestone.

### Established Patterns
- **Lesson flow:** intro → quiz → summary (or hybrid with exercises).
- **Quiz flow:** question + options → answer feedback → auto-advance (800ms) → next question.
- **Exercise flow:** stage indicator → exercise content → next exercise (fade transition).
- **Accuracy count-up:** Already animated 0 → percentage over 800ms with cubic easing.

### Integration Points
- `LessonIntro.tsx` — Letter cards presentation, "Start Quiz" CTA.
- `LessonSummary.tsx` — Results display, accuracy animation, closing quotes.
- `LessonHybrid.tsx` — Exercise orchestrator with stage transitions.
- `QuizProgress.tsx` — Progress bar during quiz.

</code_context>

<specifics>
## Specific Ideas

- Same design philosophy throughout: subtle polish, life in interactions, warm encouragement
- Wrong answers should feel supportive, not punishing — this is for converts who may feel intimidated
- Celebration should be proportional — don't overdo it for mediocre scores
- Exercise screens need consistency more than individual flair

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-lesson-experience*
*Context gathered: 2026-03-28*
