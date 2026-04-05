# Phase 2: Quiz Experience - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the quiz screen so Arabic letters feel like living presences and answer feedback feels warm and encouraging, never punitive. This phase modifies the existing quiz components (QuizQuestion, QuizOption, WrongAnswerPanel) and adds a quizOption typography tier. It does NOT change quiz logic, question generation, mastery tracking, or progression.

</domain>

<decisions>
## Implementation Decisions

### LetterHero Presentation
- **D-01:** Claude's Discretion on LetterHero prominence — Claude picks the approach that best serves "the letter is a living presence, not a label." Options range from full hero takeover (160-180px circle, quizHero 72px text, breathing glow) to enhanced current (120px with breathing added). Optimize for the letter being the dominant visual element in the top half.
- **D-02:** Use WarmGlow (from `src/design/atmosphere/WarmGlow.tsx`) with breathing animation token timing from Phase 1 for the letter's personal glow. Do not integrate AtmosphereBackground into the quiz screen for this phase — keep it focused on the letter.

### Correct Answer Feedback
- **D-03:** Gold border expansion ripple — when the user taps the correct answer, a warm gold border expands outward from the option like a ring, then settles. Clean Reanimated shared values, no particle effects.
- **D-04:** Remove the floating "+1" animation entirely. No `plusOneOpacity`, `plusOneY`, `plusOneScale` shared values. The ripple IS the celebration.
- **D-05:** All other options dim simultaneously with the correct option's ripple — no staggered delay. Focus attention immediately.
- **D-06:** Keep hapticSuccess() on correct answers.

### Wrong Answer Feedback
- **D-07:** Remove shake animation on wrong answers — no horizontal translateX oscillation. Instead, dim the wrong option briefly.
- **D-08:** Illuminate the correct answer with a warm glow when user picks wrong — guide the eye to what's right.
- **D-09:** Replace hapticError() with hapticTap() on wrong answers — soft acknowledgment, not a buzzer.
- **D-10:** WrongAnswerPanel redesign: replace `colors.dangerLight`/`colors.danger`/`colors.dangerDark` with warm cream background + brown text. Remove the ✗ icon entirely. Keep encouraging copy from `engagement.ts`. The panel should feel like gentle guidance, not punishment.

### Quiz Arabic Sizing
- **D-11:** Add a new `quizOption` size tier to ArabicText at 52px — between `large` (36px) and `quizHero` (72px). This goes through the design system tokens, not hardcoded.
- **D-12:** Apply `quizOption` tier to all Arabic text in quiz option buttons so letters read as primary content.

### Claude's Discretion
- LetterHero circle size and overall prominence approach
- Exact gold color for the correct-answer ripple (should work with existing accent `#C4A464`)
- Exact dim opacity for wrong/other options
- WrongAnswerPanel warm cream/brown exact colors (derive from existing token palette)
- Whether to show the correct letter's name alongside the glow in wrong-answer state
- Animation easing curves for ripple expansion and option dimming
- Reduce Motion fallback behavior for new quiz animations

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Quiz Components (modify these)
- `src/components/quiz/QuizQuestion.tsx` — Main quiz screen with LetterPrompt, StaggeredOption, option grid layout
- `src/components/quiz/WrongAnswerPanel.tsx` — Wrong answer explanation panel (currently uses danger colors + X icon)
- `src/design/components/QuizOption.tsx` — 5-state option model with shake/pulse/glow/+1 animations

### Design System (extend these)
- `src/design/tokens.ts` — Typography tiers (add quizOption), color tokens
- `src/design/animations.ts` — Breathing/drift/settle tokens from Phase 1 (use breathing for LetterHero)
- `src/design/components/ArabicText.tsx` — Size tier component (add quizOption tier)
- `src/design/haptics.ts` — hapticTap, hapticSuccess, hapticError functions

### Atmosphere (reference, do not modify)
- `src/design/atmosphere/WarmGlow.tsx` — Relocated in Phase 1 with breathing + useReducedMotion. Use for LetterHero glow.

### Phase 1 Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Phase 1 decisions (animation tokens, reduce motion, atmosphere approach)
- `.planning/phases/01-foundation/01-01-SUMMARY.md` — What was built: typography fixes, animation tiers
- `.planning/phases/01-foundation/01-02-SUMMARY.md` — What was built: atmosphere system, reduce motion

### Project Context
- `.planning/PROJECT.md` — Emotional Design Contract, constraints
- `.planning/REQUIREMENTS.md` — QUIZ-01 through QUIZ-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WarmGlow` (atmosphere/WarmGlow.tsx): SVG RadialGradient with breathing animation, useReducedMotion support. Already used in LetterPrompt — enhance rather than replace.
- `QuizOption` 5-state model: selectedCorrect, selectedWrong, revealedCorrect, dimmed, default. Rework animations within this existing state machine.
- `breathing` animation token (4.5s cycle): Use for LetterHero glow pulse timing.
- `hapticTap`/`hapticSuccess` from `src/design/haptics.ts`: Already available, just need to swap hapticError → hapticTap.
- `WRONG_ENCOURAGEMENT` + `pickCopy` from engagement.ts: Keep for warm encouragement text.

### Established Patterns
- All quiz animations use Reanimated shared values + useAnimatedStyle
- Typography sizes defined as named tiers in tokens.ts, consumed via ArabicText component
- Colors accessed via `useColors()` hook from ThemeContext
- Option entrance uses StaggeredOption wrapper with per-question key

### Integration Points
- `QuizQuestion.tsx` renders `LetterPrompt` + option grid — LetterHero changes go here
- `QuizOption.tsx` handles all 5 answer states — feedback animation changes go here
- `WrongAnswerPanel.tsx` renders after wrong answer — color/icon changes go here
- `tokens.ts` typography section — new quizOption tier added here
- `ArabicText.tsx` size prop union — extend with 'quizOption'

</code_context>

<specifics>
## Specific Ideas

- From Phase 1 context: "Arabic letters are living presences" — the LetterHero breathing makes the letter feel alive, like it's waiting for the learner
- The gold ripple on correct answers should feel like warmth spreading — not a game reward, a moment of recognition
- Wrong answer panel should feel like a gentle teacher redirecting: "Look here instead" rather than "That was wrong"
- The overall emotional register: quiet confidence, not gamification

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-quiz-experience*
*Context gathered: 2026-04-05*
