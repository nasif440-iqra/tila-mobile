---
quick_id: 260406-m5t
description: Fix letter circles - theme-aware colors for dark mode readability
completed: 2026-04-06
commit: d3f9893
---

# Quick Task 260406-m5t: Letter Circle Dark Mode Fix

## Problem

Arabic letter circles used hardcoded `#F2F5F3` (light mint) backgrounds and white borders across 4 components. In dark mode, this created unreadable light-on-light text and jarring white circles against the dark theme.

## Fix

Replaced all hardcoded colors with theme-aware tokens:
- Background: `colors.primarySoft` (adapts to light/dark)
- Border: `colors.primary` (dark green in light, soft green in dark)
- Letter text: `colors.primary` (readable against primarySoft in both modes)

## Files Modified

- `src/components/home/HeroCard.tsx` — Hero card letter circle
- `src/components/onboarding/steps/LetterAudio.tsx` — Onboarding letter reveal
- `src/components/LessonIntro.tsx` — Lesson intro letter display
- `src/components/quiz/QuizQuestion.tsx` — Quiz prompt letter circle
