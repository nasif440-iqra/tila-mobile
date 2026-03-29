# Tila Mobile — UI Overhaul Review

**Date:** 2026-03-28
**Scope:** Complete breakdown of all UI work done across Phases 1-4a of the 4-phase UI overhaul.

---

## Table of Contents

1. [Phase Overview](#phase-overview)
2. [Phase 1: Structure](#phase-1-structure)
3. [Phase 2: Design System](#phase-2-design-system)
4. [Phase 3: Polish](#phase-3-polish)
5. [Phase 4a: Transitions](#phase-4a-transitions)
6. [Design Token System](#design-token-system)
7. [Component Inventory](#component-inventory)
8. [Screen-by-Screen Breakdown](#screen-by-screen-breakdown)
9. [Animation System](#animation-system)
10. [Remaining Work](#remaining-work)

---

## Phase Overview

| Phase | Focus | Status | Commits |
|-------|-------|--------|---------|
| **Phase 1** | Structure — layout bones, spacing consistency, animation timing presets | Complete | ~10 commits |
| **Phase 2** | Design System — brown color, typography roles, spacing tokens | Complete | ~12 commits |
| **Phase 3** | Polish — shadows, border widths, padding uniformity, hard-coded cleanup | Complete | ~3 commits |
| **Phase 4a** | Transitions — lesson slide-up, stage fades, exercise/onboarding step transitions | Complete | ~3 commits |
| **Phase 4b** | Celebrations, haptic patterns, empty states | Not started |
| **Phase 4c** | Loading skeletons, micro-interactions | Not started |

**Visual direction:** Warm & sacred + playful encouragement. Cream canvas, gold accents, rounded shapes, spring-damped animations. The content is sacred but the learner needs to feel safe and celebrated. Duolingo's transitions are the quality bar.

---

## Phase 1: Structure

**Goal:** Fix layout bones — spacing consistency, animation timing, layout slots.

### What changed

- **OnboardingStepLayout** got a `footer` slot for CTAs using flex layout (not absolute positioning). SafeAreaView insets applied to footer via `useSafeAreaInsets()`.
- **Animation timing presets** added to `src/components/onboarding/animations.ts` — stagger ladder for content element entrance timing.
- **Raw pixel values replaced with spacing tokens** across HeroCard, LessonGrid, LetterMasteryGrid, PhasePanel, and quiz components.
- **Named constants** introduced for magic numbers (e.g., `OPTIONS_GRID_MAX_WIDTH = 340` in QuizQuestion, `SCROLL_BOTTOM_INSET = 96` for tab bar clearance).
- **Non-token values rounded to nearest token** (e.g., `gap: 20` became `spacing.xl` = 24).

### Files touched

```
src/components/onboarding/OnboardingStepLayout.tsx
src/components/onboarding/animations.ts
src/components/home/HeroCard.tsx
src/components/home/LessonGrid.tsx
src/components/progress/LetterMasteryGrid.tsx
src/components/progress/PhasePanel.tsx
src/components/quiz/QuizQuestion.tsx
app/(tabs)/progress.tsx
```

---

## Phase 2: Design System

**Goal:** Add warm brown secondary color, enforce strict typography role assignments, add `xxxxl` spacing token.

### Color additions

**Light theme:**
| Token | Value | Purpose |
|-------|-------|---------|
| `brown` | `#3D2B1F` | Deep espresso — page titles, card headlines |
| `brownLight` | `#5C4033` | Section headers, card titles |
| `brownSoft` | `#F5EDE4` | Subtle brown-tinted backgrounds |

**Dark theme:**
| Token | Value | Purpose |
|-------|-------|---------|
| `brown` | `#D4C4B0` | Warm sand — readable on dark backgrounds |
| `brownLight` | `#B8A898` | Section headers in dark mode |
| `brownSoft` | `#2A2420` | Subtle brown surface |

### Typography role assignments

Three voices were established:

1. **Serif italic** (Lora italic) — the attention-grabber. Page titles and featured numbers.
2. **Serif regular** (Lora regular/semibold) — quiet authority. Section titles, card headlines.
3. **Sans** (Inter) — functional. Body text, labels, captions, buttons.

New presets added:

| Preset | Size | Font | Weight | Style | Color | Role |
|--------|------|------|--------|-------|-------|------|
| `pageTitle` | 24px | Lora | 400 | italic | brown | Screen titles |
| `cardHeadline` | 20px | Lora | 600 | normal | brown | Hero card, onboarding headlines |
| `sectionHeader` | 13px | Inter | 600 | normal | brownLight | Section titles (uppercase, tracked) |
| `label` | 11px | Inter | 600 | normal | accent/muted | Phase pills, "UP NEXT" |
| `statNumber` | 24px | Lora | 400 | italic | primary | Stats in stat cards |

### Spacing addition

- `xxxxl: 64` added for major section breaks (hero→journey gap, stats→phase progress gap, phase progress→letter mastery gap).

### Color migration

Every heading that previously used `colors.text` was migrated to `colors.brown` or `colors.brownLight`:

- Home screen: app name "tila" → brown
- HeroCard: lesson title → brown, phase pill → label style
- LessonGrid: section title → brownLight, current lesson label → brown
- Progress screen: "Your Progress" → brown, section headers → brownLight
- StatsRow: numbers → statNumber style (Lora italic, primary)
- Onboarding: all step headlines → brown
- Quiz: question prompts → brown

### Files touched (18 files)

```
src/design/tokens.ts
app/(tabs)/index.tsx
src/components/home/HeroCard.tsx
src/components/home/LessonGrid.tsx
app/(tabs)/progress.tsx
src/components/progress/StatsRow.tsx
src/components/progress/PhasePanel.tsx
src/components/progress/LetterMasteryGrid.tsx
src/components/onboarding/steps/Welcome.tsx
src/components/onboarding/steps/Tilawat.tsx
src/components/onboarding/steps/Hadith.tsx
src/components/onboarding/steps/StartingPoint.tsx
src/components/onboarding/steps/LetterReveal.tsx
src/components/onboarding/steps/LetterAudio.tsx
src/components/onboarding/steps/LetterQuiz.tsx
src/components/onboarding/steps/Finish.tsx
src/components/quiz/QuizQuestion.tsx
```

---

## Phase 3: Polish

**Goal:** Fix visual inconsistencies — missing shadows, cramped spacing, hard-coded values, border width standardization.

### New tokens

**Border widths** added to `tokens.ts`:

| Token | Value | Role |
|-------|-------|------|
| `thin` | 1 | Decorative borders, subtle dividers |
| `normal` | 1.5 | Standard card/option borders |
| `thick` | 2 | Interactive state indicators, emphasis |

### Shadow additions

Card-like surfaces that were missing shadows got `shadows.card`:

| Component | Before | After |
|-----------|--------|-------|
| StartingPoint OptionCards | No shadow | `shadows.card` |
| WrongAnswerPanel | No shadow | `shadows.card` |
| LessonSummary content area | No shadow | `shadows.card` |

### Shadow standardization

| Component | Before | After | Reason |
|-----------|--------|-------|--------|
| LessonGrid completed nodes | `shadows.soft` (green tinted) | `shadows.card` | `soft` was semantically wrong |

### Border width migration

All hard-coded border widths replaced with tokens:

| Component | Before | After |
|-----------|--------|-------|
| StartingPoint card | `1.5` | `borderWidths.normal` |
| QuizQuestion correctFeedback | `1.5` | `borderWidths.normal` |
| QuizOption base | `2` | `borderWidths.thick` |
| LessonGrid connectorLine | `borderLeftWidth: 2` | `borderWidths.thick` |
| LessonGrid nodeCurrent | `2.5` | `borderWidths.thick` (normalized to 2) |
| LessonGrid nodeLocked | `2` | `borderWidths.thick` |
| LessonGrid currentLabel | `1` | `borderWidths.thin` |

### Hard-coded cleanup

| Component | Before | After |
|-----------|--------|-------|
| HeroCard phasePill | `borderRadius: 9999` | `radii.full` |

### Spacing fixes

| Component | Property | Before | After |
|-----------|----------|--------|-------|
| StatsRow statCard | padding | `spacing.md` (12px) | `spacing.lg` (16px) |
| Progress "Phase Progress" header | marginBottom | `spacing.md` | `spacing.lg` |
| Progress "Letter Mastery" header | marginBottom | `spacing.md` | `spacing.lg` |

### Bug fix (during Phase 3)

- **StartingPoint vertical centering:** The `cardContent` variant in OnboardingStepLayout was missing `justifyContent: "center"`, causing the "Where are you starting from?" screen content to sit high instead of being centered.

### Files touched (10 files)

```
src/design/tokens.ts
src/components/home/HeroCard.tsx
src/components/home/LessonGrid.tsx
app/(tabs)/progress.tsx
src/components/progress/StatsRow.tsx
src/components/onboarding/steps/StartingPoint.tsx
src/components/onboarding/OnboardingStepLayout.tsx
src/components/quiz/WrongAnswerPanel.tsx
src/components/quiz/QuizQuestion.tsx
src/design/components/QuizOption.tsx
src/components/LessonSummary.tsx
```

---

## Phase 4a: Transitions

**Goal:** Add purposeful transitions to four navigation zones.

### Zone 1: Lesson Entry & Exit

Lesson screens (`lesson/[id]` and `lesson/review`) now use `slide_from_bottom` animation (400ms) instead of the default fade. When entering a lesson, the screen slides up from the bottom like a focused workspace. When exiting, it slides back down.

**Config in `app/_layout.tsx`:**
```typescript
<Stack.Screen name="lesson/[id]" options={{ animation: "slide_from_bottom", animationDuration: 400 }} />
<Stack.Screen name="lesson/review" options={{ animation: "slide_from_bottom", animationDuration: 400 }} />
```

### Zone 2: Lesson Stage Transitions

Inside lesson screens, switching between stages (intro → quiz → summary) now fades smoothly instead of hard-cutting. Each stage is wrapped in `<Animated.View key={effectiveStage}>` with FadeIn (300ms) / FadeOut (200ms).

### Zone 3: Exercise-to-Exercise (LessonHybrid)

Previously, exercises entered with `FadeInDown.springify()` but had **no exit animation** — old exercises just vanished. Now:

- **Exit:** `FadeOut` (200ms)
- **Entry:** `FadeIn` (300ms) with 100ms delay (so the exit starts before the new content appears)

### Zone 4: Onboarding Step Transitions

Previously, onboarding steps had no transition at all — they just appeared. Now each step is wrapped in a keyed `Animated.View` with:

- **Entry:** FadeIn (400ms — slightly longer for dramatic first impression)
- **Exit:** FadeOut (250ms)

Internal stagger animations within each step (FadeInDown on elements) continue to work inside the container fade.

### Timing presets

All transition durations are centralized in `src/components/onboarding/animations.ts`:

```
TRANSITION_FADE_IN      = 300ms
TRANSITION_FADE_OUT     = 200ms
TRANSITION_FADE_IN_DELAY = 100ms
TRANSITION_LESSON_DURATION = 400ms
```

### Files touched (6 files)

```
src/components/onboarding/animations.ts
app/_layout.tsx
app/lesson/[id].tsx
app/lesson/review.tsx
src/components/LessonHybrid.tsx
src/components/onboarding/OnboardingFlow.tsx
```

---

## Design Token System

The complete token system as of Phase 3 completion:

### Colors (22 tokens per theme)

**Light:**
```
bg: #F8F6F0          bgWarm: #F2EADE       bgCard: #FFFFFF
primary: #163323     primaryLight: #255038  primarySoft: #E8F0EB   primaryDark: #0F2419
accent: #C4A464      accentLight: #F5EDDB   accentGlow: rgba(196,164,100,0.3)
danger: #BD524D      dangerLight: #FCE6E5   dangerDark: #7A2E2B
text: #163323        textSoft: #52545C      textMuted: #6B6760
border: #EBE6DC
brown: #3D2B1F       brownLight: #5C4033    brownSoft: #F5EDE4
white: #FFFFFF       black: #000000
```

### Typography (15 presets)

| Preset | Font | Size | Weight/Style |
|--------|------|------|-------------|
| `arabicDisplay` | Amiri | 48px | Regular |
| `arabicLarge` | Amiri | 36px | Regular |
| `arabicBody` | Amiri | 24px | Regular |
| `heading1` | Lora | 24px | Bold |
| `heading2` | Lora | 20px | SemiBold |
| `heading3` | Lora | 17px | Medium |
| `bodyLarge` | Inter | 17px | Medium |
| `body` | Inter | 15px | Regular |
| `bodySmall` | Inter | 13px | Regular |
| `caption` | Inter | 11px | Medium |
| `pageTitle` | Lora | 24px | Italic, -0.5 tracking |
| `cardHeadline` | Lora | 20px | SemiBold, -0.3 tracking |
| `sectionHeader` | Inter | 13px | SemiBold, uppercase, 1.5 tracking |
| `label` | Inter | 11px | SemiBold, uppercase, 1.5 tracking |
| `statNumber` | Lora | 24px | Italic |

### Spacing (8px rhythm)

```
xs: 4    sm: 8    md: 12    lg: 16    xl: 24    xxl: 32    xxxl: 48    xxxxl: 64
```

### Border Radii

```
sm: 8    md: 12    lg: 16    xl: 24    full: 9999
```

### Border Widths

```
thin: 1    normal: 1.5    thick: 2
```

### Shadows

| Token | Blur | Opacity | Elevation | Use |
|-------|------|---------|-----------|-----|
| `card` | 8px | 0.08 | 3 | Standard cards |
| `cardLifted` | 12px | 0.12 | 5 | Elevated/featured cards |
| `soft` | 12px | 0.18 | 4 | Special emphasis (green-tinted) |

---

## Component Inventory

### Design System Components (`src/design/components/`)

| Component | Purpose | Key Features |
|-----------|---------|-------------|
| **Button** | Primary action trigger | 3 variants (primary/secondary/ghost), spring press animation, haptic feedback |
| **Card** | Content container | Elevated option, bgCard bg, lg radius, xl padding, card/cardLifted shadow |
| **ArabicText** | RTL Arabic display | 3 sizes (display/large/body), Amiri font, centered |
| **HearButton** | Audio playback trigger | Circular, loading indicator, primarySoft bg, haptic |
| **QuizOption** | Quiz answer button | 4 states (default/correct/wrong/dimmed), pulse/shake animations, haptic |

### Screen Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **HeroCard** | Home | Displays next lesson with letter preview, phase pill, CTA |
| **LessonGrid** | Home | Journey path with node states (complete/current/locked/available) |
| **StatsRow** | Progress | 4-card row: Letters, Lessons, Accuracy, Phase |
| **PhasePanel** | Progress | Phase header + progress bar |
| **LetterMasteryGrid** | Progress | 4-column grid showing mastery state per letter |
| **LessonIntro** | Lesson | Letter display with audio, phase label, start button |
| **LessonHybrid** | Lesson | Multi-exercise container with progress bar and stage indicator |
| **LessonSummary** | Lesson | Accuracy display, performance messaging, staggered reveal |
| **QuizQuestion** | Quiz | Prompt display + 2x2 option grid with feedback |
| **QuizCelebration** | Quiz | Midway celebration overlay (50% milestone) |
| **WrongAnswerPanel** | Quiz | Slide-up explanation with letter comparison |

### Onboarding Components

| Component | Step | Type | Key Feature |
|-----------|------|------|-------------|
| **Welcome** | 0 | splash | App logo, tagline, floating letters bg |
| **Tilawat** | 1 | splash | Sacred headline, diamond separator |
| **Hadith** | 2 | splash | Hadith quote, attribution |
| **StartingPoint** | 3 | card | 4 option cards with selection state |
| **LetterReveal** | 4 | centered | Large Alif display, auto-advance 3.5s |
| **LetterAudio** | 5 | centered | Audio playback with HearButton |
| **LetterQuiz** | 6 | centered | First quiz question |
| **Finish** | 7 | splash | Completion headline, start button |

---

## Screen-by-Screen Breakdown

### Home Screen (`app/(tabs)/index.tsx`)

```
SafeAreaView (top edge)
  ScrollView
    Header Row
      "tila" (pageTitle, brown)
      Streak Badge (if wird > 0)
    HeroCard (elevated)
      Phase pill (label, accent)
      Letter circle (112px, primarySoft bg)
      Title (cardHeadline, brown)
      Description (body, textSoft)
      CTA Button
    LessonGrid
      Section title (label, brownLight, uppercase)
      Journey path with dashed connector
        Node circles (complete/current/locked)
        Current lesson label card
```

### Progress Screen (`app/(tabs)/progress.tsx`)

```
SafeAreaView (top edge)
  ScrollView
    "Your Progress" (pageTitle, brown)
    StatsRow (4 cards in row)
      Letters | Lessons | Accuracy | Phase
    "PHASE PROGRESS" (sectionHeader, brownLight)
    PhasePanel x4 (one per phase)
      Status dot + label + count + progress bar
    "LETTER MASTERY" (sectionHeader, brownLight)
    LetterMasteryGrid (4-column, 28 letters)
      Mastery state colors + Arabic letter + name
```

### Lesson Flow

```
Home → tap lesson → [SLIDE UP]
  LessonIntro → [FADE] →
  Quiz/Exercises → [FADE between exercises] →
  LessonSummary → [FADE] →
  Continue → [SLIDE DOWN] → Home
```

### Onboarding Flow

```
Welcome → [FADE] →
Tilawat → [FADE] →
Hadith → [FADE] →
StartingPoint → [FADE] →
LetterReveal → [AUTO 3.5s, CROSSFADE] →
LetterAudio → [FADE] →
LetterQuiz → [FADE] →
Finish → [SCREEN FADE OUT] → Home
```

---

## Animation System

### Interaction Animations

| Animation | Trigger | Details |
|-----------|---------|---------|
| Button press | onPressIn/Out | Scale spring 0.97 → 1.0 (stiffness 400, damping 25) |
| Quiz correct | State change | Scale pulse 1.0 → 1.04 → 1.0 (150ms each) + success haptic |
| Quiz wrong | State change | Shake sequence (7 translateX oscillations, ±6px, 50ms each) + error haptic |
| Wrong panel | Appear | SlideInDown spring (stiffness 300, damping 25) |
| Progress bar | Value change | Width spring (stiffness 120, damping 20) |

### Transition Animations

| Transition | Animation | Duration |
|------------|-----------|----------|
| Lesson entry | slide_from_bottom | 400ms |
| Lesson exit | slide_to_bottom | 400ms |
| Stage change (intro→quiz→summary) | FadeIn/FadeOut | 300ms in / 200ms out |
| Exercise change | FadeIn/FadeOut | 300ms in (100ms delay) / 200ms out |
| Onboarding step change | FadeIn/FadeOut | 400ms in / 250ms out |
| Default screen transition | Fade | 300ms |

### Content Entrance Animations

| Context | Animation | Timing |
|---------|-----------|--------|
| Onboarding element stagger | FadeInDown | 150ms between, 500ms each |
| Splash step stagger | FadeInDown | 250ms between, 700ms each |
| LessonSummary cascade | FadeIn | 0→200→400→550→700→900ms delays |
| Summary accuracy counter | withTiming | 800ms, cubic easing |
| Floating letters (bg) | withRepeat + withSequence | 15-20s cycles, 0.07-0.09 opacity |

### Haptic Patterns

| Context | Type | Where |
|---------|------|-------|
| Button press | `ImpactFeedbackStyle.Light` | Button, HearButton, QuizOption |
| Tab switch | `ImpactFeedbackStyle.Light` | Tab bar |
| Exercise advance | `ImpactFeedbackStyle.Light` | BuildUpReader, GuidedReveal, FreeReader |
| Correct answer | `NotificationFeedbackType.Success` | QuizOption, ComprehensionExercise, SpotTheBreak, TapInOrder, FreeReader |
| Wrong answer | `NotificationFeedbackType.Error` | QuizOption, ComprehensionExercise, SpotTheBreak, TapInOrder |

---

## Remaining Work

### Phase 4b: Celebrations, Haptics, Empty States (not started)

- **Celebrations:** QuizCelebration currently uses emoji + text. Options: reanimated-only particle/confetti effects or Lottie animations.
- **Haptic patterns:** Only basic Light/Success/Error used. Could add `selectionAsync()` for option selection, custom sequences for milestones.
- **Empty states:** No empty state UI exists anywhere. Needed for: no lessons available, no review items, no mastery data.

### Phase 4c: Loading Skeletons, Micro-interactions (not started)

- **Loading skeletons:** Currently just `ActivityIndicator` or "Loading..." text. No shimmer/skeleton screens.
- **Micro-interactions:** Small touches like card hover states, selection ripples, scroll-based header transitions.

### Other known issues

- Dark mode is disabled (forced light). Dark theme tokens exist but `theme.ts` type inference has a pre-existing TS error.
- `SpotTheBreak.tsx` has pre-existing TS errors (hard-coded color values don't match token types).
- Home screen streak badge uses hard-coded `borderRadius: 9999` (should be `radii.full`).
