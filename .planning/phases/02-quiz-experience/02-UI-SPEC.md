---
phase: 2
slug: quiz-experience
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-05
---

# Phase 2 — UI Design Contract: Quiz Experience

> Visual and interaction contract for quiz screen redesign. The quiz screen is where users spend the most time. This phase makes Arabic letters feel like living presences and answer feedback feel warm and encouraging, never punitive.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (React Native -- shadcn not applicable) |
| Preset | not applicable |
| Component library | Custom design system in `src/design/` |
| Icon library | Not applicable to this phase |
| Font (Arabic) | Amiri (Amiri_400Regular) |
| Font (Body) | Inter (400, 500, 600) |
| Font (Heading) | Lora (500, 600) |

Source: `src/design/tokens.ts` (existing), Phase 1 UI-SPEC

---

## Spacing Scale

Existing scale in `src/design/tokens.ts`. No changes in this phase.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing, hear button gap |
| md | 12px | Default element spacing, panel internal gaps |
| lg | 16px | Section padding, panel padding |
| xl | 24px | Prompt-to-options gap, letter comparison gap |
| xxl | 32px | Not used in quiz screen |
| xxxl | 48px | Not used in quiz screen |
| xxxxl | 64px | Not used in quiz screen |

Exceptions:
- LetterHero circle: 160px diameter (not a spacing token -- component dimension)
- Quiz option touch target: minimum 80px height (existing `minHeight: 80` in QuizOption)
- Options grid gap: 14px (existing, not a token -- keep as-is for backward compatibility)

Source: `src/design/tokens.ts` (existing, unchanged)

---

## Typography

### Arabic Tiers Used in Quiz (from Phase 1)

| Tier | fontSize | lineHeight | Ratio | Usage in this phase |
|------|----------|------------|-------|---------------------|
| arabicDisplay | 72px | 158px | 2.20x | LetterHero prompt letter inside circle |
| arabicQuizHero | 52px | 114px | 2.20x | NOT used -- see quizOption below |
| arabicLarge | 36px | 72px | 2.00x | WrongAnswerPanel comparison letters |
| arabicBody | 24px | 48px | 2.00x | Not used in quiz screen |

### New Arabic Tier (this phase adds)

| Tier | fontSize | lineHeight | Ratio | Usage |
|------|----------|------------|-------|-------|
| arabicQuizOption | 52px | 114px | 2.20x | Quiz option button Arabic text. Letters read as primary content, never labels. |

Implementation: Add `quizOption` to `ArabicSize` union in ArabicText.tsx. Map to `arabicQuizHero` token values in tokens.ts (same 52px/114px). The name `quizOption` is the semantic alias; the underlying token is the existing `arabicQuizHero`.

Rationale: D-11 from CONTEXT.md specifies a `quizOption` tier at 52px. The Phase 1 `arabicQuizHero` token already defines 52px/114px. Add `quizOption` as a semantic size alias pointing to the same values rather than duplicating tokens.

### Latin Typography Used in Quiz (unchanged)

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| heading2 | 20px | Lora SemiBold (600) | 28px | Prompt text ("Which letter is this?") |
| body | 15px | Inter Regular (400) | 22px | Prompt subtext, replay link |
| bodySmall | 13px | Inter Regular (400) | 18px | Encouragement text in WrongAnswerPanel |
| caption | 11px | Inter Medium (500) | 16px | Letter name labels in comparison, hear labels |
| heading3 | 17px | Lora Medium (500) | 24px | Non-Arabic option text |

Source: D-11, D-12 from CONTEXT.md; Phase 1 UI-SPEC typography section

---

## Color

### Base Palette (unchanged from Phase 1)

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F8F6F0` (warm cream) | Quiz screen background via AtmosphereBackground `quiz` preset |
| Secondary (30%) | `#F2EADE` (warm beige) | LetterHero circle background, WrongAnswerPanel background |
| Accent (10%) | `#C4A464` (gold) | LetterHero breathing glow, correct-answer ripple border |
| Primary | `#163323` (deep green) | LetterHero letter color, correct-answer text, correct-answer border |

### Quiz-Specific Color Mappings

| Element | Current Color | Target Color | Token |
|---------|--------------|--------------|-------|
| **Correct option background** | `colors.primarySoft` (#E8F0EB) | `colors.primarySoft` (#E8F0EB) | Unchanged |
| **Correct option border** | `colors.primary` (#163323) | `colors.accent` (#C4A464) | Changed -- gold ripple border |
| **Correct option text** | `colors.primaryDark` (#0F2419) | `colors.primaryDark` (#0F2419) | Unchanged |
| **Wrong option background** | `colors.dangerLight` (#FCE6E5) | `colors.accentLight` (#F5EDDB) | Changed -- warm cream, not red |
| **Wrong option border** | `colors.danger` (#BD524D) | `colors.border` (#EBE6DC) | Changed -- neutral, not red |
| **Wrong option text** | `colors.danger` (#BD524D) | `colors.brown` (#3D2B1F) | Changed -- warm brown, not red |
| **Dimmed option opacity** | 0.45 | 0.35 | Changed -- slightly more dimmed to focus attention |
| **Revealed correct bg** | `colors.primarySoft` | `colors.primarySoft` | Unchanged |
| **Revealed correct border** | `colors.primary` | `colors.primary` | Unchanged |
| **WrongAnswerPanel bg** | `colors.dangerLight` (#FCE6E5) | `colors.accentLight` (#F5EDDB) | Changed -- warm cream |
| **WrongAnswerPanel text** | `colors.dangerDark` (#7A2E2B) | `colors.brown` (#3D2B1F) | Changed -- warm brown |
| **WrongAnswerPanel icon** | `colors.danger` + X symbol | Removed entirely | No icon |
| **Chosen letter (comparison)** | `colors.danger` | `colors.textMuted` (#6B6760) | Changed -- de-emphasized, not punitive |
| **Correct letter (comparison)** | `colors.primary` | `colors.primary` | Unchanged |

### Accent Reserved For (in quiz context)

- LetterHero WarmGlow breathing animation (gold radial gradient)
- Correct-answer ripple border expansion
- "Hear correct" label in WrongAnswerPanel (if sound question)
- Never for wrong-answer states, error indicators, or backgrounds

Source: D-03, D-07, D-10 from CONTEXT.md; Phase 1 UI-SPEC color section

---

## LetterHero Component Contract

The letter is a living presence, not a label. It dominates the top half of the quiz screen.

### Visual Specification

| Property | Value | Rationale |
|----------|-------|-----------|
| Circle diameter | 160px | Large enough to dominate top half; 120px current feels too small for "living presence" |
| Circle background | `#F2F5F3` (existing) | Soft, slightly cool -- lets the letter stand forward |
| Circle border | `rgba(255, 255, 255, 0.8)`, 2px | Existing -- subtle containment |
| Circle shadow | `shadowOffset: {0, 2}`, opacity 0.06, radius 6 | Existing -- gentle lift |
| Letter size | `display` (72px) via ArabicText | Fills the larger circle with breathing room for diacritics |
| Letter color | `colors.primaryDark` (#0F2419) | Dark, grounded, authoritative |
| WarmGlow size | 240px | 1.5x circle diameter for visible glow beyond circle edge |
| WarmGlow color | `rgba(196, 164, 100, 0.3)` | Existing gold glow |
| WarmGlow pulseMin | 0.10 | Slightly more visible than current 0.1 resting state |
| WarmGlow pulseMax | 0.30 | Existing peak |

### Breathing Animation

| Property | Value | Token Source |
|----------|-------|-------------|
| Inhale duration | 2000ms | `breathing.inhale` |
| Hold duration | 500ms | `breathing.hold` |
| Exhale duration | 2000ms | `breathing.exhale` |
| Full cycle | 4500ms | `breathing.cycle` |
| Easing | `Easing.inOut(Easing.ease)` | Phase 1 animation rules |
| WarmGlow animated | `true` | Uses AnimatedWarmGlow path |

### Reduce Motion Fallback

When `useReducedMotion()` returns true:
- WarmGlow renders as static at `pulseMin` opacity (0.10)
- No breathing scale animation
- Letter and circle render normally (they are not animated)

Source: D-01, D-02 from CONTEXT.md; Phase 1 animation tiers; WarmGlow.tsx existing API

---

## Correct Answer Feedback Contract

The ripple IS the celebration. No floating "+1", no score indicator.

### Animation Sequence (on selectedCorrect)

| Step | Property | From | To | Duration | Easing |
|------|----------|------|----|----------|--------|
| 1 | Border color | `colors.border` | `colors.accent` (#C4A464) | 0ms | Instant (state change) |
| 2 | Border width | 1.5px | 3px | 200ms | `Easing.out(Easing.cubic)` |
| 3 | Scale pulse | 1.0 | 1.04 | 150ms | `withTiming` |
| 4 | Scale settle | 1.04 | 1.0 | 150ms | `withTiming` |
| 5 | Gold glow overlay | opacity 0 | 0.15 | 200ms | `Easing.out(Easing.cubic)` |
| 6 | Gold glow fade | opacity 0.15 | 0 | 300ms | `Easing.in(Easing.cubic)` |

### Simultaneous Effects

| Effect | Timing | Detail |
|--------|--------|--------|
| All other options dim | Simultaneous with step 1 | Opacity to 0.35 over 200ms |
| Haptic feedback | On tap | `hapticSuccess()` (existing) |
| Glow overlay color | -- | `colors.accent` (#C4A464) at 15% opacity, not `colors.primary` |

### Removed Elements

| Element | Current Code | Action |
|---------|-------------|--------|
| `plusOneOpacity` shared value | Lines 53-54 in QuizOption.tsx | Remove entirely |
| `plusOneY` shared value | Line 55 | Remove entirely |
| `plusOneScale` shared value | Line 56 | Remove entirely |
| `plusOneContainer` View | Lines 214-218 | Remove entirely |
| `plusOneText` style | Lines 259-261 | Remove entirely |
| Floating "+1" animation sequence | Lines 71-79 | Remove entirely |

### Reduce Motion Fallback

When `useReducedMotion()` returns true:
- No scale pulse (steps 3-4 skip)
- No glow overlay animation (steps 5-6 skip)
- Border color and width change instantly (visual state only)
- Other options dim instantly (no 200ms transition)
- Haptic feedback still fires (haptics respect system setting independently)

Source: D-03, D-04, D-05, D-06 from CONTEXT.md; REQUIREMENTS.md QUIZ-02

---

## Wrong Answer Feedback Contract

Wrong answers feel like gentle redirection, not punishment.

### Animation Sequence (on selectedWrong)

| Step | Property | From | To | Duration | Easing |
|------|----------|------|----|----------|--------|
| 1 | Wrong option opacity | 1.0 | 0.5 | 200ms | `Easing.out(Easing.cubic)` |
| 2 | Wrong option opacity | 0.5 | 0.7 | 200ms | `Easing.in(Easing.cubic)` |
| 3 | Wrong option bg | `colors.bgCard` | `colors.accentLight` | 0ms | Instant (state change) |
| 4 | Wrong option border | `colors.border` | `colors.border` | 0ms | No change -- neutral |
| 5 | Correct option glow | opacity 0 | 0.20 | 400ms | `Easing.inOut(Easing.ease)` |
| 6 | Correct option border | `colors.border` | `colors.primary` | 200ms | Instant (state change) |
| 7 | All other options dim | 1.0 | 0.35 | 200ms | `Easing.out(Easing.cubic)` |

### Haptic Change

| Current | Target | Rationale |
|---------|--------|-----------|
| `hapticError()` (NotificationFeedbackType.Error) | `hapticTap()` (ImpactFeedbackStyle.Light) | Soft acknowledgment, not a buzzer |

### Removed Elements

| Element | Current Code | Action |
|---------|-------------|--------|
| Shake animation (translateX oscillation) | Lines 83-89 in QuizOption.tsx | Remove entirely |
| `translateX` shared value usage for wrong state | Line 52 | Keep shared value for press only, remove wrong-state usage |

### Reduce Motion Fallback

When `useReducedMotion()` returns true:
- No opacity dip animation (steps 1-2 skip, set to 0.7 instantly)
- No glow animation on correct option (step 5 -- set instantly)
- All state colors apply instantly
- Haptic tap still fires

Source: D-07, D-08, D-09 from CONTEXT.md; REQUIREMENTS.md QUIZ-03

---

## WrongAnswerPanel Redesign Contract

The panel feels like a gentle teacher redirecting: "Look here instead."

### Visual Changes

| Property | Current | Target |
|----------|---------|--------|
| Background | `colors.dangerLight` (#FCE6E5) | `colors.accentLight` (#F5EDDB) |
| Explanation text color | `colors.dangerDark` (#7A2E2B) | `colors.brown` (#3D2B1F) |
| Icon | X symbol in `colors.danger` | Removed entirely -- no icon |
| Chosen letter color | `colors.danger` | `colors.textMuted` (#6B6760) |
| Chosen letter name color | `colors.dangerDark` | `colors.textMuted` (#6B6760) |
| Correct letter color | `colors.primary` | `colors.primary` (unchanged) |
| Correct letter name color | `colors.primary` | `colors.primary` (unchanged) |
| "Hear your pick" label color | `colors.danger` | `colors.textMuted` (#6B6760) |
| "Hear correct" label color | `colors.primary` | `colors.primary` (unchanged) |
| Arrow between letters | `colors.textMuted` | `colors.textMuted` (unchanged) |
| Border radius | 20px | 20px (unchanged) |
| Entrance animation | FadeInUp 350ms | FadeInUp 350ms (unchanged) |

### Copywriting (existing, preserved)

The `WRONG_ENCOURAGEMENT` pool from `src/engine/engagement.ts` and `pickCopy` function are retained. The encouragement text is already warm and non-punitive.

### Layout Changes

| Change | Detail |
|--------|--------|
| Remove icon column | `explanationRow` loses the X icon `Text` element. Explanation text gets full width. |
| Remove `icon` style | No longer needed |
| Remove `marginTop: 1` on icon | No longer needed |

Source: D-10 from CONTEXT.md; REQUIREMENTS.md QUIZ-04

---

## Quiz Option Arabic Sizing Contract

Arabic letters in quiz options are primary content, not small labels.

### Current vs Target

| Property | Current | Target |
|----------|---------|--------|
| ArabicText size prop in QuizOption | `"large"` (36px) | `"quizOption"` (52px) |
| Min option height | 80px | 80px (unchanged -- 52px text + 114px lineHeight handles overflow via `overflow: visible`) |
| Option padding | vertical 24px, horizontal 16px | vertical 24px, horizontal 16px (unchanged) |

### ArabicText Changes

Add `quizOption` to the `ArabicSize` type union:

```
type ArabicSize = "display" | "quizHero" | "quizOption" | "large" | "body";
```

Add to `SIZE_MAP`:

```
quizOption: typography.arabicQuizHero,  // reuses 52px/114px token
```

This means `<ArabicText size="quizOption">` renders at 52px fontSize with 114px lineHeight -- same underlying token as `quizHero`, different semantic name for quiz option context.

Source: D-11, D-12 from CONTEXT.md; REQUIREMENTS.md QUIZ-05

---

## Shared Value Budget

Phase 1 established a budget of 15-20 concurrent shared values per screen. The quiz preset disables FloatingLettersLayer (0 shared values from atmosphere).

### Quiz Screen Shared Value Inventory

| Component | Shared Values | Notes |
|-----------|--------------|-------|
| LetterHero WarmGlow | 2 | pulseOpacity, pulseScale (inside WarmGlow) |
| StaggeredOption (x4) | 8 | opacity + translateY per option |
| QuizOption pressed | 1 | scale (reused across options, only active on default state) |
| Correct answer feedback | 2 | scale, glowOpacity |
| Wrong answer feedback | 1 | opacity (dim/brighten) |
| **Total** | **14** | Within 15-20 budget |

Removed from budget: `plusOneOpacity`, `plusOneY`, `plusOneScale` (3 values freed), `translateX` shake (1 value freed).

Source: Phase 1 UI-SPEC animation rules; CONTEXT.md code_context section

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | "Got It" (existing WrongAnswerPanel continue button -- unchanged) |
| Empty state heading | Not applicable -- quiz always has a question loaded |
| Empty state body | Not applicable |
| Error state | Not applicable -- quiz error handling is in engine layer, out of scope |
| Destructive confirmation | Not applicable -- no destructive actions in quiz |
| Encouragement (wrong answer) | Existing pool from `WRONG_ENCOURAGEMENT` in `src/engine/engagement.ts` -- unchanged |
| Prompt text | Existing per-question prompts from question generators -- unchanged |

Source: D-10 from CONTEXT.md (keep encouraging copy); REQUIREMENTS.md QUIZ-04

---

## Component Inventory

| Component | Location | New/Modified | Responsibility |
|-----------|----------|-------------|----------------|
| ArabicText | `src/design/components/ArabicText.tsx` | Modified | Add `quizOption` size alias |
| QuizOption | `src/design/components/QuizOption.tsx` | Modified | Remove +1/shake, add gold ripple, warm wrong colors, use `quizOption` size |
| QuizQuestion | `src/components/quiz/QuizQuestion.tsx` | Modified | Enlarge LetterHero circle to 160px, update WarmGlow size to 240px |
| WrongAnswerPanel | `src/components/quiz/WrongAnswerPanel.tsx` | Modified | Replace danger colors with warm palette, remove X icon |

No new components. No new files. All changes modify existing components.

---

## Cross-Platform Verification

| Check | iOS | Android |
|-------|-----|---------|
| LetterHero 160px circle renders without clipping | Arabic display (72px) fits with diacritics | Arabic display (72px) fits with diacritics |
| WarmGlow 240px breathing animation smooth | 60fps, no jank | 60fps on mid-range device |
| Gold ripple on correct answer visible | Border expansion + glow overlay | Border expansion + glow overlay |
| Wrong answer dim/brighten smooth | Opacity transitions at 60fps | Opacity transitions at 60fps |
| Arabic 52px in quiz options readable | Fits within option bounds with overflow:visible | Fits within option bounds with overflow:visible |
| WrongAnswerPanel warm colors render | accentLight bg, brown text visible | accentLight bg, brown text visible |
| Reduce Motion disables quiz animations | Static states only, haptics respect system | Static states only, haptics respect system |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| Not applicable | React Native project -- no shadcn registry | Not applicable |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS (not applicable -- React Native)

**Approval:** pending
