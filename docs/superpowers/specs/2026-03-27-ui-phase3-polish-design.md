# UI Phase 3: Polish — Design Spec

**Date:** 2026-03-27
**Context:** Third of 4 UI overhaul phases. Fixes visual inconsistencies — missing shadows, cramped spacing, hard-coded values, inconsistent border widths — to make the app feel cohesive and premium. Phase 1 fixed structure; Phase 2 locked the design system; Phase 3 makes every detail consistent.

**Visual direction:** No new visual language — this phase enforces the existing one. Every card should cast a shadow. Every border should use a token. Every spacing value should feel intentional.

---

## Strategy

The app has good bones (Phase 1) and a strong design system (Phase 2), but inconsistencies undermine the polish: some cards have shadows while similar ones don't, spacing varies between similar components, hard-coded values bypass the token system, and border widths are arbitrary. Phase 3 is a consistency pass.

**What this phase does:**
- Add missing shadows to card-like surfaces
- Fix cramped spacing in StatsRow and section headers
- Replace all hard-coded border-radius and border-width values with tokens
- Add `borderWidths` tokens for consistent stroke weights
- Standardize card padding where inconsistent
- Minor visual hierarchy adjustments

**What this phase does NOT do:**
- No new components or abstractions
- No animations or transitions (Phase 4)
- No color or typography changes (Phase 2 done)
- No layout or structural changes (Phase 1 done)
- No Lottie, skeletons, or haptics (Phase 4)

---

## New Tokens

### Border Widths

Add `borderWidths` to `tokens.ts`:

```
borderWidths:
  thin:   1      — subtle borders, decorative dividers
  normal: 1.5    — standard card/option borders, informational
  thick:  2      — interactive element state borders, emphasis
```

**Role assignments:**
| Role | Token | Examples |
|------|-------|---------|
| Decorative/subtle | `thin` (1) | Current label border in LessonGrid |
| Standard card borders | `normal` (1.5) | OptionCard border, correctFeedback pill border |
| Interactive state indicators | `thick` (2) | Quiz option borders, current lesson node, connector lines, progress track dots |

Note: The current lesson node in LessonGrid uses `borderWidth: 2.5` — change to `thick` (2) for consistency.

---

## Shadow Additions

### Rule: Every card-like surface gets a shadow

Currently, `Card` component and `LessonGrid` nodes have shadows. These card-like surfaces are missing them:

| Component | Current | Change |
|-----------|---------|--------|
| StartingPoint OptionCards | No shadow | Add `shadows.card` |
| WrongAnswerPanel | No shadow | Add `shadows.card` |
| LessonSummary content area | No shadow | Add `shadows.card` |
| QuizQuestion correctFeedback pill | No shadow | No change (pills don't need shadow) |

### Shadow standardization

| Component | Current shadow | Change |
|-----------|---------------|--------|
| LessonGrid completed nodes | `shadows.soft` (green tinted) | Change to `shadows.card` — `soft` is semantically wrong for completed state |

---

## Spacing Fixes

### StatsRow (Progress Screen)

Currently cramped — 4 cards with `padding: spacing.md` (12px) and no explicit gap.

| Property | Current | Change | Reason |
|----------|---------|--------|--------|
| `statCard` padding | `spacing.md` (12px) | `spacing.lg` (16px) | More breathing room inside cards |
| Stats container gap | (via flex) | Add explicit `gap: spacing.sm` (8px) | Consistent card separation |

### Section Headers (Progress Screen)

| Property | Current | Change | Reason |
|----------|---------|--------|--------|
| "Phase Progress" `marginBottom` | `spacing.md` (12px) | `spacing.lg` (16px) | More space between header and content |
| "Letter Mastery" `marginBottom` | `spacing.md` (12px) | `spacing.lg` (16px) | Same |

### PhasePanel

| Property | Current | Change | Reason |
|----------|---------|--------|--------|
| Card padding | `spacing.lg` (16px) | No change | Already reasonable for compact list items |

---

## Hard-coded Value Cleanup

### Border Radius

All proportional circles (where `borderRadius = width / 2`) should remain hard-coded since they're derived from the element's dimensions, not from the design system. But magic numbers like `9999` should use tokens.

| File | Current | Change |
|------|---------|--------|
| HeroCard `phasePill` | `borderRadius: 9999` | `borderRadius: radii.full` |

Proportional circles (no change needed — `width/2` is the correct pattern):
- HeroCard letterCircle: 112/2 = 56 ✓
- LessonIntro letterCircle: 120/2 = 60 ✓
- LessonIntro letterCircleSmall: 88/2 = 44 ✓
- LessonSummary iconCircle: 80/2 = 40 ✓
- PhasePanel phaseDot: 28/2 = 14 ✓
- LessonGrid nodeCircle: 40/2 = 20 ✓
- LessonGrid nodeCurrent: 44/2 = 22 ✓
- LessonGrid currentDot: 12/2 = 6 ✓
- LessonGrid upNextDot: 6/2 = 3 ✓

### Progress Track Border Radius

| File | Current | Change |
|------|---------|--------|
| PhasePanel `progressTrack` | `borderRadius: 2` | `borderRadius: radii.sm / 4` → just keep `2`, it's derived from the 4px track height |
| PhasePanel `progressFill` | `borderRadius: 2` | Same — keep `2` |

These are proportional to the track height (4px), not design tokens. Leave as-is.

### Border Widths (migrate to tokens)

| File | Component | Current | Change |
|------|-----------|---------|--------|
| StartingPoint | `card` | `borderWidth: 1.5` | `borderWidth: borderWidths.normal` |
| QuizQuestion | `correctFeedback` | `borderWidth: 1.5` | `borderWidth: borderWidths.normal` |
| LessonGrid | `connectorLine` | `borderLeftWidth: 2` | `borderLeftWidth: borderWidths.thick` |
| LessonGrid | `nodeCurrent` | `borderWidth: 2.5` | `borderWidth: borderWidths.thick` (2) |
| LessonGrid | `currentLabel` border | `borderWidth: 1` | `borderWidth: borderWidths.thin` |

QuizOption.tsx uses `borderWidth: 2` (line 141) — migrate to `borderWidths.thick`.

---

## Screen-by-Screen Changes

### Home Screen (`app/(tabs)/index.tsx`)

No changes needed — structure and tokens are clean.

### HeroCard (`src/components/home/HeroCard.tsx`)

- `phasePill`: change `borderRadius: 9999` → `radii.full`

### LessonGrid (`src/components/home/LessonGrid.tsx`)

- `nodeComplete`: change `shadows.soft` → `shadows.card`
- `connectorLine`: change `borderLeftWidth: 2` → `borderWidths.thick`
- `nodeCurrent`: change `borderWidth: 2.5` → `borderWidths.thick`
- `currentLabel`: if it has `borderWidth: 1`, change to `borderWidths.thin`

### Progress Screen (`app/(tabs)/progress.tsx`)

- "Phase Progress" header: change `marginBottom: spacing.md` → `spacing.lg`
- "Letter Mastery" header: change `marginBottom: spacing.md` → `spacing.lg`

### StatsRow (`src/components/progress/StatsRow.tsx`)

- `statCard`: change `padding: spacing.md` → `spacing.lg`
- Stats container: add `gap: spacing.sm` if not present

### PhasePanel (`src/components/progress/PhasePanel.tsx`)

- No spacing changes
- `progressTrack`/`progressFill`: keep `borderRadius: 2` (proportional to height)

### StartingPoint (`src/components/onboarding/steps/StartingPoint.tsx`)

- `card`: add `...shadows.card` to style
- `card`: change `borderWidth: 1.5` → `borderWidths.normal`

### WrongAnswerPanel (`src/components/quiz/WrongAnswerPanel.tsx`)

- `wrongPanel`: add `...shadows.card` to style

### QuizQuestion (`src/components/quiz/QuizQuestion.tsx`)

- `correctFeedback`: change `borderWidth: 1.5` → `borderWidths.normal`

### QuizOption (`src/design/components/QuizOption.tsx`)

- `base`: change `borderWidth: 2` → `borderWidths.thick`

### LessonIntro (`src/components/LessonIntro.tsx`)

- No changes (letter circle border-radius values are proportional, already correct)

### LessonSummary (`src/components/LessonSummary.tsx`)

- `content`: add `...shadows.card` to style
- `iconCircle`: keep hard-coded `borderRadius: 40` (proportional)

---

## Files Changed

### Modified files
```
src/design/tokens.ts                                — add borderWidths tokens
src/components/home/HeroCard.tsx                    — radii.full for pill
src/components/home/LessonGrid.tsx                  — shadow + border width tokens
app/(tabs)/progress.tsx                             — section header bottom margins
src/components/progress/StatsRow.tsx                — card padding + gap
src/components/onboarding/steps/StartingPoint.tsx   — shadow + border width token
src/components/quiz/WrongAnswerPanel.tsx             — shadow
src/components/quiz/QuizQuestion.tsx                 — border width token
src/design/components/QuizOption.tsx                 — border width tokens
src/components/LessonSummary.tsx                     — shadow on content area
```

---

## Success Criteria

- [ ] `borderWidths` tokens exist in `tokens.ts` (thin: 1, normal: 1.5, thick: 2)
- [ ] All card-like surfaces have shadows (OptionCard, WrongAnswerPanel, LessonSummary content)
- [ ] No `borderRadius: 9999` — all use `radii.full`
- [ ] All border widths use `borderWidths` tokens (no hard-coded 1, 1.5, 2, 2.5)
- [ ] StatsRow cards have `spacing.lg` padding with `spacing.sm` gap
- [ ] Section headers on progress screen have `spacing.lg` bottom margin
- [ ] LessonGrid completed nodes use `shadows.card` (not `shadows.soft`)
- [ ] LessonGrid current node uses `borderWidths.thick` (2, not 2.5)
- [ ] App builds and runs correctly
- [ ] Dark theme renders correctly
- [ ] All existing tests pass

---

## Non-Goals

- No new components (no LetterCircle, FeedbackPill, etc.)
- No animations or transitions (Phase 4)
- No color or typography changes (Phase 2 complete)
- No layout or structural changes (Phase 1 complete)
- No Lottie, skeletons, or haptics (Phase 4)
- No font changes of any kind
- Proportional border-radius values (width/2) stay hard-coded — they're derived from dimensions, not design tokens
