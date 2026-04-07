---
created: 2026-04-07T15:31:35.136Z
title: Fix later lesson quiz and UI issues
area: ui
files:
  - src/engine/questions/ (question generators — option count)
  - src/components/quiz/ (quiz layout, progress bar placement)
  - src/components/exercises/ (connected forms intro, reading order exercise)
  - src/engine/insights.ts (lesson summary "undefined" text)
---

## Problem

Several issues found in later lessons (connected forms, connected reading) from device testing screenshots:

### 1. Only 3 quiz options instead of 4
Later lessons still show only 3 answer options in quizzes. All quizzes should always have 4 options. This likely affects connectedForms and connectedReading question generators which may not be padding options to 4.

### 2. Bad formatting — Connected Forms intro (Badformat.png)
The connected forms learning screen has layout issues:
- Progress bar is weirdly placed (crammed at top, partially behind status bar)
- The form cards (ALONE, START, MIDDLE, END) and content area have too much empty space above
- Overall vertical spacing feels unbalanced

### 3. Bad formatting — Connected Forms quiz (Badformat2.png)
The "Which position is this form of Ba?" quiz screen:
- Progress bar placement is off (too close to top edge)
- Options are left-aligned text-style buttons instead of consistent quiz option cards
- Doesn't match the visual style of earlier quiz screens

### 4. Reading order exercise too small (Reading-rtol-toosmall.png)
The "Tap the letters in reading order (right to left)" exercise:
- Letter tiles are very small and pushed to center-bottom
- Huge empty space above — content should be vertically centered or larger
- Only 3 letters shown with tiny answer slots below

### 5. Lesson summary shows "undefined" (You-practiced-reading-undefined.png)
Post-lesson summary screen shows: `You practiced reading: "undefined", "undefined", "undefined", "undefined"`
- The WHAT YOU LEARNED section is failing to resolve letter/combo names
- Likely a bug in insights.ts or lesson summary component where entity names aren't being looked up properly

## Solution

1. **3 options → 4**: Check connectedForms and connectedReading question generators — ensure they always generate 4 options (pad with distractors if needed)
2. **Connected forms layout**: Fix progress bar positioning, rebalance vertical spacing on intro and quiz screens
3. **Quiz option styling**: Make connected forms quiz options use the same QuizOption card component as other lessons
4. **Reading order size**: Increase letter tile size and center content vertically in the reading order exercise
5. **Undefined in summary**: Trace the entity key → display name lookup in insights/summary to fix the undefined values
