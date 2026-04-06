---
status: diagnosed
phase: 02-quiz-experience
source: [02-VERIFICATION.md]
started: 2026-04-05T11:35:00Z
updated: 2026-04-06T10:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. LetterHero breathing animation feel
expected: The 160px circle with 2s inhale/exhale breathing glow creates a "living presence" quality — the Arabic letter is the dominant visual element in the top half, not a label. The warm gold glow breathes slowly around it.
result: issue
reported: "The circle looks very choppy edges, the Arabic letter is barely visible — nearly invisible light color on white/cream circle background in dark mode. Zero contrast."
severity: major

### 2. Wrong answer opacity animation
expected: Tapping a wrong answer dims the option briefly (opacity 1.0 → 0.5 → 0.7 over ~200ms) with hapticTap. No shake, no red flash. The correct answer illuminates with a warm glow.
result: pass

### 3. Correct answer gold glow
expected: Tapping the correct answer triggers a warm gold flash at ~15% opacity expanding from the tapped option with hapticSuccess. No floating "+1" appears anywhere.
result: pass

### 4. Diacritic rendering on non-quiz screens
expected: overflow: visible and corrected lineHeights (arabicDisplay 158, arabicLarge 72, arabicBody 48) don't cause text bleeding or layout issues on non-quiz screens (home, progress, lesson list).
result: issue
reported: "Progress screen Arabic looks good. But on the home screen, the Arabic letter in the circle (next lesson hero) is super translucent and off-centre."
severity: major

## Summary

total: 4
passed: 2
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "The 160px circle with 2s breathing glow creates a living presence — Arabic letter is dominant visual element with warm gold glow"
  status: failed
  reason: "User reported: circle edges choppy, Arabic letter barely visible — near-invisible light color on white/cream circle in dark mode, zero contrast"
  severity: major
  test: 1
  root_cause: "Circle background hardcoded #F2F5F3 (light cream) not theme-aware. Letter color uses colors.primaryDark which is #D4EAE0 in dark mode — near-identical lightness to cream circle. Border hardcoded rgba(255,255,255,0.8)."
  artifacts:
    - path: "src/components/quiz/QuizQuestion.tsx"
      issue: "Lines 96-100: letterCircle backgroundColor and borderColor hardcoded for light mode only"
    - path: "src/components/quiz/QuizQuestion.tsx"
      issue: "Line 100: ArabicText color={colors.primaryDark} has no contrast against #F2F5F3 in dark mode"
  missing:
    - "Use theme-aware colors for circle background (dark bg in dark mode)"
    - "Use high-contrast letter color (dark text on light circle in light mode, light text on dark circle in dark mode)"
    - "Use theme-aware border color"
  debug_session: ""

- truth: "Arabic text renders without clipping or layout issues on non-quiz screens (home, progress, lesson list)"
  status: failed
  reason: "User reported: home screen next-lesson hero circle — Arabic letter is super translucent and off-centre"
  severity: major
  test: 4
  root_cause: "HeroCard letterCircle has same hardcoded #F2F5F3 background problem. Letter uses colors.text (#E8E4DC in dark mode) — light on light, barely visible. marginTop: 6 on ArabicText causes off-centre positioning."
  artifacts:
    - path: "src/components/home/HeroCard.tsx"
      issue: "Lines 199-212: letterCircle backgroundColor #F2F5F3 and borderColor hardcoded for light mode"
    - path: "src/components/home/HeroCard.tsx"
      issue: "Line 124: marginTop: 6 on ArabicText causes off-centre letter"
    - path: "src/components/home/HeroCard.tsx"
      issue: "Line 124: colors.text (#E8E4DC) has no contrast against #F2F5F3 circle in dark mode"
  missing:
    - "Use theme-aware circle background and border colors"
    - "Remove or adjust marginTop: 6 to centre the letter properly"
    - "Ensure letter color has strong contrast against circle background in both themes"
  debug_session: ""
