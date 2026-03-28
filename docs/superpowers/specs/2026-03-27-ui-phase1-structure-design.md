# UI Phase 1: Structure — Design Spec

**Date:** 2026-03-27
**Context:** First of 4 UI overhaul phases. Fixes layout bones across all screens — consistent spacing, content positioning, animation timing. Onboarding gets the deepest treatment as the #1 priority. Uses existing design tokens (token definitions stay unchanged until Phase 2).

**Visual direction:** Warm & sacred palette + playful interaction energy. Balanced warmth — cream canvas, gold accents, rounded shapes. Duolingo-style bouncy transitions (Phase 4), but the structural foundation is laid now.



## Strategy

Fix structural inconsistencies that make the app feel unpolished. Every screen gets real work, but onboarding gets the deepest pass since it's the user's first impression.

**What this phase does:**
- Replace inline height/spacing hacks with token-based spacing
- Standardize vertical rhythm and content positioning across all screens
- Create consistent animation entry timing presets
- Normalize content width constraints
- Fix CTA button positioning patterns
- Clean up hard-coded padding/margin values

**What this phase does NOT do:**
- No color changes
- No typography scale changes
- No new animations or transitions beyond standardizing existing ones
- No new components
- No token definition changes (only usage fixes)

---

## Onboarding (Deep Pass)

### Problem: Inconsistent Vertical Rhythm

Each step uses different spacing patterns. Examples from the audit:

- `Tilawat.tsx:27` — `{ height: 28 }` (raw number, not a token)
- `Tilawat.tsx:48` — `{ height: 10 }` (raw number, not a token)
- `OnboardingFlow.tsx:181` — `paddingTop: 56` (raw number)
- `OnboardingFlow.tsx:192` — `paddingBottom: 48` (raw number)

**Fix:** Replace ALL inline height hacks and raw padding values with spacing tokens. Every vertical gap should use one of: `spacing.sm` (8), `spacing.md` (12), `spacing.lg` (16), `spacing.xl` (24), `spacing.xxl` (32), `spacing.xxxl` (48). If a value doesn't map cleanly (like `height: 28`), round to the nearest token value (`spacing.xxl` = 32).

### Problem: Inconsistent Content Width

Similar semantic content uses different maxWidth values:
- `Welcome.tsx:129` — tagline: `maxWidth: 260`
- `Tilawat.tsx:83` — headline: `maxWidth: 300`
- `Hadith.tsx:132` — quote: `maxWidth: 280`
- `LetterQuiz.tsx:182` — feedback: `maxWidth: 280`
- `Finish.tsx:145` — body: `maxWidth: 280`

**Fix:** Standardize to a single content width for onboarding body text. Use `maxWidth: 300` for all body/quote/tagline text in onboarding steps. Headings can be wider (no maxWidth constraint or `maxWidth: 340`).

### Problem: OnboardingStepLayout Doesn't Enforce Enough

The current `OnboardingStepLayout` has 3 variants (splash, centered, card) but each step still manages its own CTA positioning and content spacing.

**Fix:** Extend `OnboardingStepLayout` to provide:
- Consistent vertical centering for all variants
- A `footer` slot for CTA buttons that pins them to a consistent bottom position
- Standard content padding that applies to all children

The layout should accept `children` (main content) and `footer` (CTA area) as separate props:

```typescript
interface OnboardingStepLayoutProps {
  variant: 'splash' | 'centered' | 'card';
  fadeInDuration?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

Each step passes its button(s) via `footer` instead of positioning them inline. The layout handles consistent bottom spacing.

**Footer height contract:** The layout uses `flex: 1` for the content area with the footer sitting below it as a natural flex sibling — no absolute positioning. The content area expands to fill available space, and the footer gets its natural height. This means steps don't need to know the footer's height. The layout structure is:

```
<View style={{ flex: 1 }}>
  <View style={{ flex: 1, justifyContent: 'center' }}>{children}</View>
  {footer && <View style={{ paddingBottom: spacing.xxxl }}>{footer}</View>}
</View>
```

**SafeAreaView:** The `OnboardingFlow` parent already wraps everything in a root `Animated.View` with `flex: 1`. SafeAreaView handling for the footer's bottom inset should be added to `OnboardingStepLayout` using `useSafeAreaInsets()` from `react-native-safe-area-context` — apply the bottom inset to the footer wrapper's `paddingBottom` so CTAs never overlap the home indicator on notched devices.

### Problem: Animation Entry Timing Varies Per Step

Current timing audit shows no pattern:
- Welcome: delays 200→800→1100→1500→1800ms, durations 1200→800→700→800→600ms
- Tilawat: delays 150→350→750→900ms, durations 550→550→500→500ms
- Hadith: delays 300→700→900→1600→1600→1900ms, durations 800→400→800→500→500→500ms
- LetterAudio: delays 100→200→400→550ms, durations 500→500→500→500ms

**Fix:** Create animation timing presets in a shared file `src/components/onboarding/animations.ts`:

```typescript
// Stagger ladder for content elements within a step
export const STAGGER_BASE = 150; // ms between elements
export const STAGGER_DURATION = 500; // ms per element animation

// Splash steps get a slower, more dramatic entrance
export const SPLASH_STAGGER_BASE = 250;
export const SPLASH_STAGGER_DURATION = 700;

// CTA button always enters last with a slight upward motion
export const CTA_DELAY_OFFSET = 200; // added after last content element
export const CTA_DURATION = 500;
```

Each step computes its delays as: element N enters at `STAGGER_BASE * N` with duration `STAGGER_DURATION`. Splash steps (Welcome, Tilawat, Hadith, LetterReveal, Finish) use the splash constants. Interactive steps (StartingPoint, LetterAudio, LetterQuiz) use the standard constants.

This creates a consistent rhythm: each element appears slightly after the previous, with a uniform cadence.

---

## Home Screen

### Problem: Hard-Coded Spacing

- `index.tsx:149` — `paddingBottom: 100` (raw number)
- `HeroCard.tsx:101-104` — `phasePill` uses `paddingVertical: 4, paddingHorizontal: 12` (raw numbers)
- `LessonGrid.tsx:253` — `marginBottom: 44` (raw number)
- `LessonGrid.tsx:253` — `gap: 20` (raw number, doesn't map to any token)
- `LessonGrid.tsx:283` — `paddingVertical: 10, paddingHorizontal: 16` (raw numbers)
- `LessonGrid.tsx:296` — `marginTop: 3` (raw number)

**Fix:** Replace all raw numbers with spacing tokens. Define a named constant for scroll bottom inset instead of multiplying tokens:
- `paddingBottom: 100` → define `const SCROLL_BOTTOM_INSET = 96` at top of file (avoids `spacing.xxxl * 2` anti-pattern)
- `paddingVertical: 4` → `paddingVertical: spacing.xs`
- `paddingHorizontal: 12` → `paddingHorizontal: spacing.md`
- `marginBottom: 44` → `marginBottom: spacing.xxxl` (48)
- `gap: 20` → `gap: spacing.xl` (24) — rounds up to nearest token
- `paddingVertical: 10` → `paddingVertical: spacing.md` (12) — rounds to nearest token
- `paddingHorizontal: 16` → `paddingHorizontal: spacing.lg`
- `marginTop: 3` → `marginTop: spacing.xs` (4)

### Problem: Journey Path Node Spacing

The serpentine path uses hard-coded gap/offset values that feel arbitrary.

**Fix:** Keep the serpentine offsets (they're intentional design) but normalize the node-to-node vertical spacing to use a spacing token. Current `marginBottom: 44` → use `spacing.xxxl` (48).

---

## Progress Screen

### Problem: Section Spacing Inconsistency

- Stats row, phase panels, and mastery grid sections have slightly different spacing patterns
- `PhasePanel.tsx:19` — `marginBottom: spacing.md` applied inline in Card style

**Fix:**
- Standardize section header spacing: `marginTop: spacing.xl, marginBottom: spacing.md` for all section headers ("Phase Progress", "Letter Mastery")
- Standardize inter-section spacing: `spacing.xl` (24) between major sections
- Move PhasePanel marginBottom from inline Card style to the parent's mapping pattern

### Problem: Letter Grid Hard-Coded Margin

`LetterMasteryGrid.tsx:121` — `margin: 4` (raw number, happens to equal `spacing.xs` but should reference the token)

**Fix:** Replace `margin: 4` with `margin: spacing.xs`.

---

## Quiz Flow

### Problem: Options Grid Hard-Coded Width

`QuizQuestion.tsx:205` — `maxWidth: 340` (raw number)

**Fix:** This is a layout constraint, not a spacing token. Keep it as a named constant at the top of the file:
```typescript
const OPTIONS_GRID_MAX_WIDTH = 340;
```

### Problem: Celebration Emoji Size

`QuizCelebration.tsx:56` — `fontSize: 56` (raw number)

**Fix:** This is an intentional display size, not typography. Keep as-is — it's not a structural issue.

### Problem: LessonQuiz Container Padding

`LessonQuiz.tsx:209` — mixed vertical/horizontal padding: `paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl`

**Fix:** Intentional — different top/bottom padding is a valid layout decision (less space above progress bar, more space below for options). No change needed.

---

## Files Changed

### New files
```
src/components/onboarding/animations.ts  — animation timing presets
```

### Modified files
```
src/components/onboarding/OnboardingStepLayout.tsx  — add footer slot, enforce consistency
src/components/onboarding/OnboardingFlow.tsx         — use spacing tokens for hard-coded values
src/components/onboarding/steps/Welcome.tsx          — standardize spacing, widths, animation timing
src/components/onboarding/steps/Tilawat.tsx          — replace inline height hacks, standardize timing
src/components/onboarding/steps/Hadith.tsx           — standardize spacing, widths, timing
src/components/onboarding/steps/StartingPoint.tsx    — standardize spacing, timing
src/components/onboarding/steps/LetterReveal.tsx     — standardize spacing, timing
src/components/onboarding/steps/LetterAudio.tsx      — standardize spacing, timing
src/components/onboarding/steps/LetterQuiz.tsx       — standardize widths, timing
src/components/onboarding/steps/Finish.tsx           — standardize spacing, widths, timing
app/(tabs)/index.tsx                                 — replace paddingBottom: 100
src/components/home/HeroCard.tsx                     — replace raw padding values
src/components/home/LessonGrid.tsx                   — replace raw margin/padding values
app/(tabs)/progress.tsx                              — normalize section spacing
src/components/progress/PhasePanel.tsx               — move inline marginBottom
src/components/progress/LetterMasteryGrid.tsx        — replace margin: 4 with token
src/components/quiz/QuizQuestion.tsx                 — extract maxWidth constant
```

---

## Success Criteria

- [ ] Zero inline height hacks (no `{ height: <number> }` without a spacing token) in onboarding files
- [ ] Zero raw padding/margin numbers in onboarding files — all use spacing tokens
- [ ] All onboarding steps use `OnboardingStepLayout` with `footer` prop for CTAs
- [ ] All onboarding animation timings use presets from `animations.ts`
- [ ] All onboarding body text uses `maxWidth: 300`
- [ ] Home screen: zero raw padding/margin numbers — all use spacing tokens or named constants
- [ ] Progress screen: zero raw padding/margin numbers, consistent section header spacing
- [ ] Quiz: zero raw padding/margin numbers, options grid maxWidth is a named constant
- [ ] App builds and runs correctly — no visual regressions in layout or behavior
- [ ] All existing tests pass

---

## Non-Goals

- No color palette changes (Phase 2)
- No typography scale changes (Phase 2)
- No new visual components (Phase 3)
- No new animations or transitions (Phase 4)
- No Lottie or skeleton screens (Phase 4)
- No token definition changes — only fix how existing tokens are used
