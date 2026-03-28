# UI Phase 2: Design System — Design Spec

**Date:** 2026-03-27
**Context:** Second of 4 UI overhaul phases. Refines the token system — adds a warm brown secondary color, enforces strict typography role assignments, and introduces one new spacing token for breathing room. Phase 1 fixed structural consistency; Phase 2 makes the design feel premium and intentional.

**Visual direction:** Islamic art-inspired refinement. Calligraphic elegance through serif italic headings, gold-on-cream richness, and a warm brown secondary voice that evokes manuscript tradition. Evolution of the existing palette, not a replacement.

---

## Strategy

The current design has the right ingredients (green, gold, cream, Lora, Inter, Amiri) but uses them without enough intention — everything is the same visual weight, and there's no clear hierarchy of "look at this" vs "read this" vs "tap this." Phase 2 locks every token to a specific role.

**What this phase does:**
- Add warm brown as a secondary color for headings and quiet authority
- Enforce strict font/weight/size→role mappings across all screens
- Add one spacing token (`xxxxl: 64`) for major section breaks
- Update dark theme with brown→warm sand mapping

**What this phase does NOT do:**
- No new components (Phase 3)
- No new animations or transitions (Phase 4)
- No layout or structural changes (done in Phase 1)
- No font family changes — Lora, Inter, Amiri stay
- No font size value changes — same scale, stricter roles

---

## Color Palette Changes

### New: Warm Brown Secondary

Add brown tokens to both light and dark themes. Brown is used for headings, page titles, section labels — the "read this" voice. Green remains the interactive/primary color for buttons, selections, active states.

**Light theme additions:**
```
brown:        #3D2B1F    — deep espresso, headings and page titles
brownLight:   #5C4033    — section headers, card titles
brownSoft:    #F5EDE4    — subtle brown-tinted backgrounds (optional use)
```

**Dark theme mappings:**
```
brown:        #D4C4B0    — warm sand, readable on dark backgrounds
brownLight:   #B8A898    — section headers in dark mode
brownSoft:    #2A2420    — subtle brown surface in dark mode
```

### Existing tokens unchanged

All existing color tokens (`primary`, `accent`, `danger`, `bg`, `bgWarm`, `bgCard`, `text`, `textSoft`, `textMuted`, `border`) remain as-is. The brown tokens are additions, not replacements.

### Color role assignments

| Role | Color token | Example |
|------|-------------|---------|
| Page titles | `brown` | "Your Progress", "tila" app name |
| Card headlines | `brown` | Lesson title in hero card |
| Section headers | `brownLight` | "Phase Progress", "Letter Mastery" |
| Body text | `text` (unchanged) | Descriptions, paragraphs |
| Secondary text | `textSoft` (unchanged) | Sublabels, hints |
| Metadata/captions | `textMuted` or `accent` (unchanged) | Phase pills, timestamps |
| Interactive elements | `primary` (unchanged) | Buttons, selections, active states |
| Decorative accents | `accent` (unchanged) | Gold separators, diamonds, highlights |
| Featured numbers | `primary` | Stats (7 letters, 86% accuracy) — green to signal "data" |

---

## Typography Role Assignments

### Three voices

1. **Serif italic** (Lora italic) — the attention-grabber. Page titles and featured numbers. Says "look at this."
2. **Serif regular** (Lora regular/semibold) — quiet authority. Section titles, card headlines, letter names. Says "this is important."
3. **Sans** (Inter) — functional. Body text, labels, captions, buttons, metadata. Says "read this / tap this."

### Size → role lock

Each size has exactly one role. No exceptions.

| Token name | Size | Font | Weight | Style | Color | Role | Tracking |
|------------|------|------|--------|-------|-------|------|----------|
| `pageTitle` | 24px | Lora | 400 | italic | `brown` | Screen titles: "Your Progress", "tila" | -0.5px |
| `cardHeadline` | 20px | Lora | 600 | normal | `brown` | Hero card title, onboarding headlines | -0.3px |
| `sectionHeader` | 13px | Inter | 600 | normal | `brownLight` | Section titles, uppercase with tracking | 1.5px |
| `bodyLarge` | 17px | Inter | 500 | normal | `text` | Emphasized body text, option labels | — |
| `body` | 15px | Inter | 400 | normal | `text` | Default body text, descriptions | — |
| `bodySmall` | 13px | Inter | 400 | normal | `textSoft` | Secondary info, sublabels | — |
| `caption` | 11px | Inter | 500 | normal | `textMuted` | Captions, metadata, phase pills | 0.5px+ |
| `label` | 11px | Inter | 600 | normal | `accent` | Uppercase decorative labels (phase pills, "UP NEXT") | 1.5px+ |
| `statNumber` | 24px | Lora | 400 | italic | `primary` | Featured numbers in stat cards | — |

**Note:** `sectionHeader` (13px, uppercase, tracked, brownLight) and `bodySmall` (13px, regular, textSoft) share the same size but serve completely different roles. `sectionHeader` is always uppercase with letter-spacing; `bodySmall` is sentence-case body text.

### Arabic typography (unchanged)

| Token name | Size | Font | Weight |
|------------|------|------|--------|
| `arabicDisplay` | 48px | Amiri | 400 |
| `arabicLarge` | 36px | Amiri | 400 |
| `arabicBody` | 24px | Amiri | 400 |

---

## Spacing Addition

Add one token to the existing scale:

```
xxxxl: 64    — major section breaks
```

**Where to use `xxxxl`:**
- Between hero card and journey path on home screen
- Between stats row and phase progress on progress screen
- Between phase progress and letter mastery on progress screen
- Top padding in onboarding splash steps (consider replacing `SCREEN_HEIGHT * 0.15` with a fixed `xxxxl` value for consistency — only if it looks right on multiple screen sizes)

The existing `xxxl` (48) continues to be used for standard large gaps. `xxxxl` (64) is reserved for the 2-3 places per screen where content needs to visually "breathe."

---

## Screen-by-Screen Changes

### Home Screen (`app/(tabs)/index.tsx`)

- App name "tila": change from `heading1` to `pageTitle` style (Lora italic, brown)
- Hero card → journey path gap: increase from `spacing.xxl` to `spacing.xxxxl`

### Hero Card (`src/components/home/HeroCard.tsx`)

- Phase pill text: use `label` style (Inter 600, accent, uppercase, tracked)
- Lesson title: use `cardHeadline` style (Lora 600, brown)
- Description: use `body` style (Inter 400, textSoft) — already close, just lock the color

### Lesson Grid (`src/components/home/LessonGrid.tsx`)

- Section title ("PHASE 1 — LETTER RECOGNITION"): use `label` style
- Current lesson label title: use `cardHeadline` style (Lora 600, brown) — currently heading bold
- "Up next" text: use `label` style (accent)

### Progress Screen (`app/(tabs)/progress.tsx`)

- "Your Progress" title: use `pageTitle` style (Lora italic, brown)
- Stats row → phase progress gap: increase to `spacing.xxxxl`
- "Phase Progress" / "Letter Mastery" headers: use `sectionHeader` style (Inter 600, brownLight, uppercase, tracked)
- Phase progress → letter mastery gap: increase to `spacing.xxxxl`

### Stats Row (`src/components/progress/StatsRow.tsx`)

- Stat numbers (7, 86%, 4): use `statNumber` style (Lora italic, green/primary)
- Stat labels ("Letters", "Accuracy"): use `caption` style (uppercase, tracked)

### Phase Panel (`src/components/progress/PhasePanel.tsx`)

- Phase label: use serif regular (Lora 500 medium, `text` color) — quiet authority voice
- Count text (3/7): use `bodySmall` style

### Letter Mastery Grid (`src/components/progress/LetterMasteryGrid.tsx`)

- Letter names below cells: use `caption` style

### Onboarding Steps

Onboarding already has stronger type hierarchy from Phase 1. Phase 2 changes are:

- Step headlines ("Struggling is not failing", "Where are you starting from?"): use `cardHeadline` style with `brown` color
- Body text / mottos: use `body` or `bodySmall` with `textSoft` — already close
- "Your first letter" labels: use `label` style (uppercase, tracked, `textMuted`)
- Featured letter name "Alif": use serif regular (Lora semibold, brown)

### Quiz Screens

- Question prompt ("Which one is Alif?"): use `cardHeadline` style with `brown` color
- Feedback text: use `body` style with appropriate color (primary for correct, textSoft for hint)

### Lesson Screens

- Lesson intro title: use `cardHeadline` style
- Section headers within lessons: use `sectionHeader` style

---

## Implementation Approach

### Token file changes (`src/design/tokens.ts`)

1. Add `brown`, `brownLight`, `brownSoft` to `lightColors`
2. Add corresponding dark theme values to `darkColors`
3. Add `xxxxl: 64` to `spacing`
4. Add new typography presets: `pageTitle`, `cardHeadline`, `sectionHeader`, `label`, `statNumber`
5. Keep all existing presets — add new ones alongside them

### Migration pattern

For each screen/component:
1. Find heading text that uses `colors.text` → change to `colors.brown` or `colors.brownLight`
2. Find heading styles that use `typography.heading1` etc → change to new role-based presets
3. Find stat numbers → apply `statNumber` style
4. Find section headers → apply `sectionHeader` style
5. Find label/pill text → apply `label` style
6. Find major section gaps → upgrade to `spacing.xxxxl` where appropriate

---

## Files Changed

### Modified files
```
src/design/tokens.ts                                — new color/spacing/typography tokens
src/design/theme.ts                                 — dark mode brown mapping
app/(tabs)/index.tsx                                — page title, section gap
src/components/home/HeroCard.tsx                    — headline, pill, description styles
src/components/home/LessonGrid.tsx                  — section title, label styles
app/(tabs)/progress.tsx                             — page title, section headers, gaps
src/components/progress/StatsRow.tsx                — stat numbers, labels
src/components/progress/PhasePanel.tsx              — phase label style
src/components/progress/LetterMasteryGrid.tsx       — letter name style
src/components/onboarding/steps/Welcome.tsx         — headline color
src/components/onboarding/steps/Tilawat.tsx         — headline color
src/components/onboarding/steps/Hadith.tsx          — headline color
src/components/onboarding/steps/StartingPoint.tsx   — headline color
src/components/onboarding/steps/LetterReveal.tsx    — letter name style
src/components/onboarding/steps/LetterAudio.tsx     — letter name style
src/components/onboarding/steps/LetterQuiz.tsx      — prompt style
src/components/onboarding/steps/Finish.tsx          — headline color
src/components/quiz/QuizQuestion.tsx                — prompt style
```

---

## Success Criteria

- [ ] Brown tokens exist in both light and dark themes
- [ ] `xxxxl: 64` spacing token exists
- [ ] New typography presets (`pageTitle`, `cardHeadline`, `sectionHeader`, `label`, `statNumber`) exist in tokens
- [ ] All page-level titles use `pageTitle` style (Lora italic, brown)
- [ ] All card headlines use `cardHeadline` style (Lora semibold, brown)
- [ ] All section headers use `sectionHeader` style (Inter semibold, brownLight, uppercase, tracked)
- [ ] All stat numbers use `statNumber` style (Lora italic, primary)
- [ ] All decorative labels use `label` style (Inter semibold, accent/muted, uppercase, tracked)
- [ ] Major section breaks use `spacing.xxxxl`
- [ ] No heading text uses `colors.text` — all headings use `brown` or `brownLight`
- [ ] Dark theme renders correctly with brown→sand mapping
- [ ] App builds and runs correctly
- [ ] All existing tests pass

---

## Non-Goals

- No new components (Phase 3)
- No new animations or transitions (Phase 4)
- No layout or structural changes (done in Phase 1)
- No font family changes (Lora, Inter, Amiri stay)
- No font size value changes (same pixel values, stricter roles)
- No Lottie or skeleton screens (Phase 4)
