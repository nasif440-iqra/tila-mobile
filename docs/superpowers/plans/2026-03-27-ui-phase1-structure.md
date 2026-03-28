# UI Phase 1: Structure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix structural inconsistencies across all screens — replace inline spacing hacks with token-based spacing, standardize animation timing, add footer slot to OnboardingStepLayout, and normalize content widths.

**Architecture:** Token-first approach — all raw numbers become spacing token references. A new `animations.ts` file provides shared timing presets. `OnboardingStepLayout` gains a `footer` prop for consistent CTA positioning. Each screen is updated independently.

**Tech Stack:** React Native, Expo, react-native-reanimated, react-native-safe-area-context, TypeScript

---

## File Structure

### New files
```
src/components/onboarding/animations.ts  — animation timing presets
```

### Modified files
```
src/components/onboarding/OnboardingStepLayout.tsx  — add footer slot, safe area
src/components/onboarding/OnboardingFlow.tsx         — spacing tokens for hard-coded values
src/components/onboarding/steps/Welcome.tsx          — spacing, widths, animation timing, use footer
src/components/onboarding/steps/Tilawat.tsx          — spacing, widths, animation timing, use footer
src/components/onboarding/steps/Hadith.tsx           — spacing, widths, animation timing, use footer
src/components/onboarding/steps/StartingPoint.tsx    — animation timing, use footer
src/components/onboarding/steps/LetterReveal.tsx     — animation timing
src/components/onboarding/steps/LetterAudio.tsx      — animation timing, use footer
src/components/onboarding/steps/LetterQuiz.tsx       — width standardization, use footer
src/components/onboarding/steps/Finish.tsx           — spacing, widths, animation timing, use footer
app/(tabs)/index.tsx                                 — replace paddingBottom: 100, streak badge tokens
app/(tabs)/progress.tsx                              — normalize section header spacing
src/components/home/HeroCard.tsx                     — replace raw padding values
src/components/home/LessonGrid.tsx                   — replace raw margin/padding/gap values
src/components/progress/PhasePanel.tsx               — move inline marginBottom to parent
src/components/progress/LetterMasteryGrid.tsx        — replace margin: 4 with token
src/components/quiz/QuizQuestion.tsx                 — extract maxWidth constant
```

---

### Task 1: Create Animation Timing Presets

**Files:**
- Create: `src/components/onboarding/animations.ts`

- [ ] **Step 1: Create the animations.ts file**

```typescript
// src/components/onboarding/animations.ts

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

- [ ] **Step 2: Verify file exists**

Run: `ls src/components/onboarding/animations.ts`
Expected: file listed

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/animations.ts
git commit -m "feat(onboarding): add animation timing presets"
```

---

### Task 2: Upgrade OnboardingStepLayout with Footer Slot

**Files:**
- Modify: `src/components/onboarding/OnboardingStepLayout.tsx`

- [ ] **Step 1: Rewrite OnboardingStepLayout with footer prop and safe area**

Replace the entire file content with:

```typescript
import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../design/tokens";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OnboardingStepLayoutProps {
  variant: "splash" | "centered" | "card";
  fadeInDuration?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function OnboardingStepLayout({
  variant,
  fadeInDuration = 600,
  children,
  footer,
}: OnboardingStepLayoutProps) {
  const insets = useSafeAreaInsets();

  const contentStyle =
    variant === "splash"
      ? layoutStyles.splashContent
      : variant === "centered"
      ? layoutStyles.centeredContent
      : layoutStyles.cardContent;

  return (
    <Animated.View entering={FadeIn.duration(fadeInDuration)} style={layoutStyles.root}>
      <View style={[layoutStyles.contentArea, contentStyle]}>
        {children}
      </View>
      {footer && (
        <View style={[layoutStyles.footer, { paddingBottom: Math.max(insets.bottom, spacing.xxxl) }]}>
          {footer}
        </View>
      )}
    </Animated.View>
  );
}

const layoutStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  splashContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: SCREEN_HEIGHT * 0.15,
  },
  centeredContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
  },
  cardContent: {
    alignItems: "stretch",
    paddingVertical: spacing.xxxl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
  },
});
```

- [ ] **Step 2: Verify the app builds**

Run: `npx expo export --platform ios --dev 2>&1 | head -5`
Expected: no TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/OnboardingStepLayout.tsx
git commit -m "feat(onboarding): add footer slot and safe area to OnboardingStepLayout"
```

---

### Task 3: Fix OnboardingFlow Spacing

**Files:**
- Modify: `src/components/onboarding/OnboardingFlow.tsx`

- [ ] **Step 1: Replace hard-coded padding values in styles**

In `OnboardingFlow.tsx`, replace the `styles` StyleSheet:

Old:
```typescript
  progressContainer: {
    paddingTop: 56,
    paddingHorizontal: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
```

New:
```typescript
  progressContainer: {
    paddingTop: spacing.xxxl + spacing.sm,
    paddingHorizontal: spacing.xl,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
```

Note: `paddingTop: 56` → `spacing.xxxl + spacing.sm` (48 + 8 = 56, preserves exact value). `paddingHorizontal: 20` → `spacing.xl` (24, rounds up). `paddingHorizontal: 24` → `spacing.xl` (24, exact). `paddingBottom: 48` → `spacing.xxxl` (48, exact).

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/OnboardingFlow.tsx
git commit -m "fix(onboarding): replace hard-coded padding with spacing tokens in OnboardingFlow"
```

---

### Task 4: Refactor Welcome Step

**Files:**
- Modify: `src/components/onboarding/steps/Welcome.tsx`

- [ ] **Step 1: Add animation imports and use OnboardingStepLayout with footer**

Replace the entire file content with:

```typescript
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import { useColors } from "../../../design/theme";
import { Button } from "../../../design/components";
import { typography, spacing, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

function LogoMark({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <Svg width={120} height={160} viewBox="0 0 120 160" fill="none">
      {/* Arch */}
      <Path
        d="M24 148 L24 68 Q24 8 60 2 Q96 8 96 68 L96 148"
        stroke={colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.6}
      />
      <Path
        d="M34 148 L34 72 Q34 20 60 12 Q86 20 86 72 L86 148"
        stroke={colors.primary}
        strokeWidth={0.8}
        opacity={0.2}
      />
      {/* Keystone */}
      <Circle cx={60} cy={2} r={3} fill={colors.accent} opacity={0.8} />
      {/* Base dots */}
      <Circle cx={24} cy={148} r={1.5} fill={colors.primary} opacity={0.25} />
      <Circle cx={96} cy={148} r={1.5} fill={colors.primary} opacity={0.25} />
      {/* Crescent */}
      <Circle cx={60} cy={62} r={32} fill={colors.primary} />
      <Circle cx={71} cy={52} r={26} fill={colors.bgWarm} />
      {/* Stars */}
      <Circle cx={38} cy={30} r={2} fill={colors.primary} opacity={0.35} />
      <Circle cx={85} cy={36} r={1.6} fill={colors.primary} opacity={0.3} />
      <Circle cx={78} cy={22} r={1.3} fill={colors.primary} opacity={0.25} />
    </Svg>
  );
}

export function Welcome({ onNext }: { onNext: () => void }) {
  const colors = useColors();

  // Splash stagger: element 0 = logo, 1 = app name, 2 = motto, 3 = tagline
  const logoDelay = 0;
  const nameDelay = SPLASH_STAGGER_BASE;
  const mottoDelay = SPLASH_STAGGER_BASE * 2;
  const taglineDelay = SPLASH_STAGGER_BASE * 3;
  const ctaDelay = SPLASH_STAGGER_BASE * 4 + CTA_DELAY_OFFSET;

  return (
    <OnboardingStepLayout
      variant="splash"
      fadeInDuration={SPLASH_STAGGER_DURATION}
      footer={
        <Animated.View
          entering={FadeInUp.delay(ctaDelay).duration(CTA_DURATION)}
          style={{ zIndex: 1 }}
        >
          <Button title="Get Started" onPress={onNext} style={styles.fullWidthBtn} />
        </Animated.View>
      }
    >
      {/* Warm ambient glow */}
      <WarmGlow size={360} opacity={0.12} />

      {/* Logo mark */}
      <Animated.View
        entering={FadeIn.delay(logoDelay).duration(SPLASH_STAGGER_DURATION)}
        style={{ marginBottom: spacing.xxl, zIndex: 1 }}
      >
        <LogoMark colors={colors} />
      </Animated.View>

      {/* App name */}
      <Animated.Text
        entering={FadeInDown.delay(nameDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[
          styles.appName,
          {
            color: colors.text,
            fontFamily: fontFamilies.headingRegular,
            zIndex: 1,
          },
        ]}
      >
        tila
      </Animated.Text>

      {/* Brand motto */}
      <Animated.Text
        entering={FadeIn.delay(mottoDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.brandMotto, { color: colors.accent, zIndex: 1 }]}
      >
        READ BEAUTIFULLY
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text
        entering={FadeIn.delay(taglineDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.tagline, { color: colors.textSoft, zIndex: 1 }]}
      >
        Learn to read the Quran,{"\n"}one letter at a time.
      </Animated.Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  appName: {
    fontSize: 44,
    letterSpacing: 5.3,
    textAlign: "center",
    lineHeight: 52,
  },
  brandMotto: {
    fontSize: 11,
    fontFamily: fontFamilies.bodySemiBold,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  tagline: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    maxWidth: 300,
  },
  fullWidthBtn: {
    width: "100%",
  },
});
```

Key changes:
- Uses `OnboardingStepLayout` with `footer` prop for CTA
- Replaces all hard-coded animation timings with `SPLASH_STAGGER_BASE`/`SPLASH_STAGGER_DURATION`
- `maxWidth: 260` → `maxWidth: 300` (standardized body text width)
- `marginBottom: 32` → `spacing.xxl` (32, exact)
- `marginBottom: 24` → `spacing.xl` (24, exact)
- Removes inline `splashStep` style (now handled by layout)
- Removes `spacerXl` (footer positioning replaces it)

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/steps/Welcome.tsx
git commit -m "fix(onboarding): standardize Welcome step spacing, widths, and animation timing"
```

---

### Task 5: Refactor Tilawat Step

**Files:**
- Modify: `src/components/onboarding/steps/Tilawat.tsx`

- [ ] **Step 1: Replace full file content**

```typescript
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText, Button } from "../../../design/components";
import { spacing, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

export function Tilawat({ onNext }: { onNext: () => void }) {
  const colors = useColors();

  // Splash stagger: 0 = calligraphy, 1 = headline, 2 = motto
  const calligraphyDelay = 0;
  const headlineDelay = SPLASH_STAGGER_BASE;
  const mottoDelay = SPLASH_STAGGER_BASE * 2;
  const ctaDelay = SPLASH_STAGGER_BASE * 3 + CTA_DELAY_OFFSET;

  return (
    <OnboardingStepLayout
      variant="splash"
      fadeInDuration={SPLASH_STAGGER_DURATION}
      footer={
        <Animated.View
          entering={FadeInUp.delay(ctaDelay).duration(CTA_DURATION)}
          style={{ zIndex: 1 }}
        >
          <Button title="Begin" onPress={onNext} style={styles.fullWidthBtn} />
        </Animated.View>
      }
    >
      {/* Warm glow */}
      <WarmGlow size={300} opacity={0.15} />

      {/* Arabic calligraphy */}
      <Animated.View entering={FadeInDown.delay(calligraphyDelay).duration(SPLASH_STAGGER_DURATION)}>
        <ArabicText
          size="display"
          color={colors.primaryDark}
          style={{ fontSize: 72, lineHeight: 100, zIndex: 1 }}
        >
          {"\u062A\u0650\u0644\u0627\u0648\u064E\u0629"}
        </ArabicText>
      </Animated.View>

      <View style={{ height: spacing.xxl }} />

      {/* Headline */}
      <Animated.Text
        entering={FadeInDown.delay(headlineDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.sacredHeadline, { color: colors.text, zIndex: 1 }]}
      >
        To recite the Quran beautifully is{" "}
        <Text
          style={{
            fontFamily: fontFamilies.headingItalic,
            color: colors.accent,
          }}
        >
          Tilawat
        </Text>
      </Animated.Text>

      <View style={{ height: spacing.md }} />

      {/* Motto */}
      <Animated.Text
        entering={FadeIn.delay(mottoDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.sacredMotto, { color: colors.textMuted, zIndex: 1 }]}
      >
        Recite. Reflect. Return.
      </Animated.Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  sacredHeadline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    lineHeight: 31,
    textAlign: "center",
    maxWidth: 300,
    letterSpacing: -0.2,
  },
  sacredMotto: {
    fontSize: 13,
    letterSpacing: 1,
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },
});
```

Key changes:
- Uses `OnboardingStepLayout` with `footer` prop
- `{ height: 28 }` → `spacing.xxl` (32, rounded from 28)
- `{ height: 10 }` → `spacing.md` (12, rounded from 10)
- All animation timings use presets
- Removes inline `splashStep` and `spacerXl` styles

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/steps/Tilawat.tsx
git commit -m "fix(onboarding): standardize Tilawat step spacing and animation timing"
```

---

### Task 6: Refactor Hadith Step

**Files:**
- Modify: `src/components/onboarding/steps/Hadith.tsx`

- [ ] **Step 1: Replace full file content**

```typescript
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useColors } from "../../../design/theme";
import { Button } from "../../../design/components";
import { spacing, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

function ArchOutline({ color }: { color: string }) {
  return (
    <View style={{ position: "absolute", opacity: 0.12 }} pointerEvents="none">
      <Svg width={200} height={260} viewBox="0 0 200 260" fill="none">
        <Path
          d="M30 250 L30 100 Q30 10 100 2 Q170 10 170 100 L170 250"
          stroke={color}
          strokeWidth={1}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

export function Hadith({ onNext }: { onNext: () => void }) {
  const colors = useColors();

  // Splash stagger: 0 = headline, 1 = diamond, 2 = quote, 3 = divider+source
  const headlineDelay = 0;
  const diamondDelay = SPLASH_STAGGER_BASE;
  const quoteDelay = SPLASH_STAGGER_BASE * 2;
  const sourceDelay = SPLASH_STAGGER_BASE * 3;
  const ctaDelay = SPLASH_STAGGER_BASE * 4 + CTA_DELAY_OFFSET;

  return (
    <OnboardingStepLayout
      variant="splash"
      fadeInDuration={SPLASH_STAGGER_DURATION}
      footer={
        <Animated.View
          entering={FadeInUp.delay(ctaDelay).duration(CTA_DURATION)}
          style={{ zIndex: 1 }}
        >
          <Button title="Continue" onPress={onNext} style={styles.fullWidthBtn} />
        </Animated.View>
      }
    >
      {/* Ambient glow */}
      <WarmGlow size={340} opacity={0.12} />

      {/* Arch outline */}
      <ArchOutline color={colors.accent} />

      {/* Headline */}
      <Animated.Text
        entering={FadeInDown.delay(headlineDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.hadithHeadline, { color: colors.text, zIndex: 1 }]}
      >
        Struggling is not failing
      </Animated.Text>

      {/* Gold diamond separator */}
      <Animated.View
        entering={FadeIn.delay(diamondDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.diamond, { backgroundColor: colors.accent, zIndex: 1 }]}
      />

      <View style={{ height: spacing.lg }} />

      {/* Hadith quote */}
      <Animated.Text
        entering={FadeIn.delay(quoteDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.hadithQuote, { color: colors.textSoft, zIndex: 1 }]}
      >
        {"\u201C"}The one who struggles with the Qur{"\u2019"}an receives
        a double reward.{"\u201D"}
      </Animated.Text>

      <View style={{ height: spacing.lg }} />

      {/* Divider line */}
      <Animated.View
        entering={FadeIn.delay(sourceDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.dividerLine, { backgroundColor: colors.accent, zIndex: 1 }]}
      />

      {/* Source */}
      <Animated.Text
        entering={FadeIn.delay(sourceDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.hadithSource, { color: colors.textMuted, zIndex: 1 }]}
      >
        SAHIH AL-BUKHARI 4937
      </Animated.Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  hadithHeadline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    letterSpacing: -0.5,
    fontStyle: "italic",
    marginBottom: spacing.xl,
  },
  diamond: {
    width: 6,
    height: 6,
    transform: [{ rotate: "45deg" }],
    opacity: 0.6,
  },
  hadithQuote: {
    fontFamily: fontFamilies.headingRegular,
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 29,
    textAlign: "center",
    maxWidth: 300,
  },
  dividerLine: {
    width: 28,
    height: 1,
    opacity: 0.4,
    marginBottom: spacing.sm,
  },
  hadithSource: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },
});
```

Key changes:
- Uses `OnboardingStepLayout` with `footer`
- `marginBottom: 20` → `spacing.xl` (24, rounded)
- `maxWidth: 280` → `maxWidth: 300` (standardized)
- All animation timings use splash presets
- Removes inline `splashStep` and `spacerXl`

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/steps/Hadith.tsx
git commit -m "fix(onboarding): standardize Hadith step spacing, widths, and animation timing"
```

---

### Task 7: Refactor StartingPoint Step

**Files:**
- Modify: `src/components/onboarding/steps/StartingPoint.tsx`

- [ ] **Step 1: Replace full file content**

```typescript
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { Button } from "../../../design/components";
import { typography, spacing, radii } from "../../../design/tokens";
import { playTap } from "../../../audio/player";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import { STAGGER_BASE, STAGGER_DURATION } from "../animations";

const startingPointOptions = [
  { label: "I'm completely new", value: "new" as const },
  { label: "I know a few letters", value: "some_arabic" as const },
  { label: "I used to learn, but forgot a lot", value: "rusty" as const },
  { label: "I can read a little, but want stronger basics", value: "can_read" as const },
];

function OptionCard({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={() => {
        playTap();
        onPress();
      }}
      style={[
        optionStyles.card,
        {
          backgroundColor: selected ? colors.primarySoft : colors.bgCard,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          optionStyles.label,
          { color: selected ? colors.primary : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const optionStyles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodyLarge,
    textAlign: "center",
  },
});

export function StartingPoint({
  startingPoint,
  onSelectStartingPoint,
  onNext,
}: {
  startingPoint: string | null;
  onSelectStartingPoint: (value: string) => void;
  onNext: () => void;
}) {
  const colors = useColors();

  return (
    <OnboardingStepLayout
      variant="card"
      fadeInDuration={STAGGER_DURATION}
      footer={
        <Button
          title="Continue"
          onPress={onNext}
          disabled={!startingPoint}
          style={styles.fullWidthBtn}
        />
      }
    >
      <Text style={[styles.headline, { color: colors.text }]}>
        Where are you starting from?
      </Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        Choose what feels most true right now.
      </Text>

      <View style={{ height: spacing.xl }} />

      {startingPointOptions.map((opt, idx) => (
        <Animated.View
          key={`sp-${idx}`}
          entering={FadeInDown.delay(STAGGER_BASE * (idx + 1)).duration(STAGGER_DURATION)}
        >
          <OptionCard
            label={opt.label}
            selected={startingPoint === opt.value}
            onPress={() => onSelectStartingPoint(opt.value)}
            colors={colors}
          />
        </Animated.View>
      ))}
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  headline: {
    ...typography.heading1,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },
});
```

Key changes:
- Uses `OnboardingStepLayout` with `footer`
- Animation timing uses `STAGGER_BASE`/`STAGGER_DURATION` (interactive step)
- Removes inline `cardStep` and `spacerMd` styles

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/steps/StartingPoint.tsx
git commit -m "fix(onboarding): standardize StartingPoint step with layout footer and animation presets"
```

---

### Task 8: Refactor LetterReveal Step

**Files:**
- Modify: `src/components/onboarding/steps/LetterReveal.tsx`

- [ ] **Step 1: Replace full file content**

```typescript
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText } from "../../../design/components";
import { spacing, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
} from "../animations";

export function LetterReveal() {
  const colors = useColors();

  // Splash stagger: 0 = label, 1 = alif, 2 = name
  const labelDelay = 0;
  const alifDelay = SPLASH_STAGGER_BASE;
  const nameDelay = SPLASH_STAGGER_BASE * 2;

  return (
    <OnboardingStepLayout variant="splash" fadeInDuration={SPLASH_STAGGER_DURATION}>
      {/* Label */}
      <Animated.Text
        entering={FadeInDown.delay(labelDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.firstWinLabel, { color: colors.textMuted }]}
      >
        Your first letter
      </Animated.Text>

      <View style={{ height: spacing.xxl }} />

      {/* Warm glow behind Alif */}
      <WarmGlow size={200} opacity={0.18} />

      {/* Large Alif */}
      <Animated.View entering={FadeIn.delay(alifDelay).duration(SPLASH_STAGGER_DURATION)}>
        <ArabicText
          size="display"
          color={colors.primaryDark}
          style={{ fontSize: 120, lineHeight: 170, zIndex: 1 }}
        >
          {"\u0627"}
        </ArabicText>
      </Animated.View>

      <View style={{ height: spacing.lg }} />

      {/* Name */}
      <Animated.Text
        entering={FadeInUp.delay(nameDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.letterRevealName, { color: colors.text, zIndex: 1 }]}
      >
        Alif
      </Animated.Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  firstWinLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  letterRevealName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
```

Key changes:
- Uses `OnboardingStepLayout` (no footer — this step auto-advances)
- Animation timings use splash presets
- Removes inline `splashStep` style

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/steps/LetterReveal.tsx
git commit -m "fix(onboarding): standardize LetterReveal step with layout and animation presets"
```

---

### Task 9: Refactor LetterAudio Step

**Files:**
- Modify: `src/components/onboarding/steps/LetterAudio.tsx`

- [ ] **Step 1: Replace full file content**

```typescript
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText, Button, HearButton } from "../../../design/components";
import { typography, spacing, fontFamilies } from "../../../design/tokens";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  STAGGER_BASE,
  STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

export function LetterAudio({
  onNext,
  onPlayAudio,
  hasPlayedAudio,
}: {
  onNext: () => void;
  onPlayAudio: () => Promise<void>;
  hasPlayedAudio: boolean;
}) {
  const colors = useColors();

  // Standard stagger: 0 = label, 1 = letter circle, 2 = play button
  const labelDelay = 0;
  const circleDelay = STAGGER_BASE;
  const playDelay = STAGGER_BASE * 2;
  const ctaDelay = STAGGER_BASE * 3 + CTA_DELAY_OFFSET;

  return (
    <OnboardingStepLayout
      variant="centered"
      fadeInDuration={STAGGER_DURATION}
      footer={
        <Animated.View entering={FadeInUp.delay(ctaDelay).duration(CTA_DURATION)}>
          <Button title="Continue" onPress={onNext} style={styles.fullWidthBtn} />
        </Animated.View>
      }
    >
      {/* Label */}
      <Animated.Text
        entering={FadeInDown.delay(labelDelay).duration(STAGGER_DURATION)}
        style={[styles.firstWinLabel, { color: colors.textMuted }]}
      >
        Your first letter
      </Animated.Text>

      <View style={{ height: spacing.xxl }} />

      {/* Letter in circle with glow */}
      <Animated.View
        entering={FadeIn.delay(circleDelay).duration(STAGGER_DURATION)}
        style={styles.letterCircleOuter}
      >
        {/* Soft glow behind circle */}
        <View
          style={[
            styles.letterCircleGlow,
            { backgroundColor: colors.accentGlow },
          ]}
        />
        {/* Circle */}
        <View
          style={[
            styles.letterCircle,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <ArabicText size="display" color={colors.primary}>
            {"\u0627"}
          </ArabicText>
        </View>
        {/* Name */}
        <Text style={[styles.letterCircleName, { color: colors.text }]}>
          Alif
        </Text>
      </Animated.View>

      <View style={{ height: spacing.xxl }} />

      {/* Play button */}
      <Animated.View
        entering={FadeIn.delay(playDelay).duration(STAGGER_DURATION)}
        style={{ alignItems: "center" }}
      >
        <HearButton
          onPlay={onPlayAudio}
          size={56}
          accessibilityLabel="Hear Alif"
        />
        <Text
          style={[
            styles.hearLabel,
            { color: colors.textSoft, marginTop: spacing.sm },
          ]}
        >
          {hasPlayedAudio ? "Hear again" : "Hear it"}
        </Text>
      </Animated.View>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  firstWinLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  letterCircleOuter: {
    alignItems: "center",
  },
  letterCircleGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -10,
  },
  letterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  letterCircleName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 17,
    marginTop: spacing.md,
    textAlign: "center",
  },
  hearLabel: {
    ...typography.bodySmall,
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },
});
```

Key changes:
- Uses `OnboardingStepLayout` with `footer`
- Animation timings use standard presets (interactive step)
- Removes inline `centeredStep` and `spacerXl`

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/steps/LetterAudio.tsx
git commit -m "fix(onboarding): standardize LetterAudio step with layout footer and animation presets"
```

---

### Task 10: Refactor LetterQuiz Step

**Files:**
- Modify: `src/components/onboarding/steps/LetterQuiz.tsx`

- [ ] **Step 1: Replace full file content**

```typescript
import { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText, Button } from "../../../design/components";
import { spacing, radii, fontFamilies } from "../../../design/tokens";
import { playCorrect, playTap, playWrong } from "../../../audio/player";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import { STAGGER_BASE, STAGGER_DURATION } from "../animations";

export function LetterQuiz({ onNext }: { onNext: () => void }) {
  const colors = useColors();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  function handleAnswerSelect(name: string) {
    if (answerChecked) return;
    playTap();
    setSelectedAnswer(name);
  }

  function handleCheckAnswer() {
    const correct = selectedAnswer === "Alif";
    setIsCorrect(correct);
    setAnswerChecked(true);
    if (correct) {
      playCorrect();
    } else {
      playWrong();
      setTimeout(() => {
        setAnswerChecked(false);
        setIsCorrect(null);
        setSelectedAnswer(null);
      }, 1200);
    }
  }

  return (
    <OnboardingStepLayout
      variant="centered"
      fadeInDuration={STAGGER_DURATION}
      footer={
        !answerChecked ? (
          <Button
            title="Check"
            onPress={handleCheckAnswer}
            disabled={!selectedAnswer}
            style={styles.fullWidthBtn}
          />
        ) : isCorrect ? (
          <Button title="Continue" onPress={onNext} style={styles.fullWidthBtn} />
        ) : null
      }
    >
      {/* Prompt */}
      <Animated.Text
        entering={FadeInDown.delay(0).duration(STAGGER_DURATION)}
        style={[styles.quizPrompt, { color: colors.text }]}
      >
        Which one is Alif?
      </Animated.Text>

      <View style={{ height: spacing.xxl }} />

      {/* Answer cards */}
      <Animated.View
        entering={FadeIn.delay(STAGGER_BASE).duration(STAGGER_DURATION)}
        style={styles.answerRow}
      >
        {[
          { name: "Alif", arabic: "\u0627" },
          { name: "Ba", arabic: "\u0628" },
        ].map(({ name, arabic }) => {
          const isThisCorrect = name === "Alif";
          const showCorrectReveal = answerChecked && isThisCorrect && isCorrect;
          const showWrongReveal =
            answerChecked && name === selectedAnswer && !isCorrect;
          const isSelected = !answerChecked && selectedAnswer === name;

          let bgColor: string = colors.bgCard;
          let borderColor: string = colors.border;

          if (showCorrectReveal) {
            bgColor = colors.primarySoft;
            borderColor = colors.primary;
          } else if (showWrongReveal) {
            bgColor = colors.dangerLight;
            borderColor = colors.danger;
          } else if (isSelected) {
            bgColor = colors.primarySoft;
            borderColor = colors.primary;
          }

          return (
            <Pressable
              key={name}
              onPress={() => handleAnswerSelect(name)}
              style={[
                styles.answerBtn,
                {
                  backgroundColor: bgColor,
                  borderColor: borderColor,
                },
              ]}
            >
              <ArabicText size="display" color={colors.text} style={{ fontSize: 56, lineHeight: 80 }}>
                {arabic}
              </ArabicText>

              {/* Reveal name on correct */}
              {answerChecked && isCorrect && isThisCorrect && (
                <Animated.Text
                  entering={FadeIn.delay(STAGGER_BASE).duration(300)}
                  style={[styles.answerLabel, { color: colors.primary }]}
                >
                  Alif
                </Animated.Text>
              )}
            </Pressable>
          );
        })}
      </Animated.View>

      {/* Feedback */}
      {answerChecked && (
        <Animated.Text
          entering={FadeIn.duration(350)}
          style={[
            styles.feedbackText,
            {
              color: isCorrect ? colors.primary : colors.textSoft,
              marginTop: spacing.xl,
            },
          ]}
        >
          {isCorrect
            ? "Beautiful. You just read your first letter."
            : "That\u2019s Ba \u2014 try the other one."}
        </Animated.Text>
      )}
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  quizPrompt: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 23,
    lineHeight: 31,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  answerRow: {
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "center",
  },
  answerBtn: {
    width: 130,
    height: 160,
    borderRadius: radii.xl,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  answerLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 15,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  feedbackText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },
  fullWidthBtn: {
    width: "100%",
  },
});
```

Key changes:
- Uses `OnboardingStepLayout` with `footer`
- `maxWidth: 280` → `maxWidth: 300` (standardized)
- Animation timings use standard presets (interactive step)
- Removes inline `centeredStep` and `spacerXl`

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/steps/LetterQuiz.tsx
git commit -m "fix(onboarding): standardize LetterQuiz step with layout footer, widths, and animation presets"
```

---

### Task 11: Refactor Finish Step

**Files:**
- Modify: `src/components/onboarding/steps/Finish.tsx`

- [ ] **Step 1: Replace full file content**

```typescript
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useColors } from "../../../design/theme";
import { ArabicText, Button } from "../../../design/components";
import { spacing, radii, fontFamilies } from "../../../design/tokens";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function Finish({
  onFinish,
  finishing,
  finishError,
}: {
  onFinish: () => void;
  finishing: boolean;
  finishError: boolean;
}) {
  const colors = useColors();

  // Splash stagger: 0 = checkmark, 1 = headline, 2 = subtext
  const checkDelay = 0;
  const headlineDelay = SPLASH_STAGGER_BASE;
  const subtextDelay = SPLASH_STAGGER_BASE * 2;
  const ctaDelay = SPLASH_STAGGER_BASE * 3 + CTA_DELAY_OFFSET;

  return (
    <OnboardingStepLayout
      variant="splash"
      fadeInDuration={SPLASH_STAGGER_DURATION}
      footer={
        <View>
          {finishError && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderRadius: radii.md }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>
                Something went wrong saving your progress. Please try again.
              </Text>
            </View>
          )}
          <Animated.View
            entering={FadeIn.delay(ctaDelay).duration(CTA_DURATION)}
            style={{ zIndex: 1 }}
          >
            <Button
              title={finishError ? "Try Again" : "Start Lesson 1"}
              onPress={onFinish}
              style={styles.fullWidthBtn}
            />
          </Animated.View>
        </View>
      }
    >
      {/* Ambient Alif watermark */}
      <Animated.View
        entering={FadeIn.duration(1500)}
        style={{
          position: "absolute",
          top: -SCREEN_HEIGHT * 0.05,
        }}
      >
        <ArabicText
          size="display"
          color={colors.text}
          style={{ fontSize: 200, lineHeight: 260, opacity: 0.06 }}
        >
          {"\u0627"}
        </ArabicText>
      </Animated.View>

      {/* Checkmark circle */}
      <Animated.View
        entering={FadeIn.delay(checkDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[
          styles.checkCircle,
          {
            backgroundColor: colors.accentLight,
            borderColor: "rgba(196,164,100,0.40)",
          },
        ]}
      >
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 6L9 17L4 12"
            stroke={colors.accent}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      <View style={{ height: spacing.xl }} />

      {/* Headline */}
      <Animated.Text
        entering={FadeInDown.delay(headlineDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.finishHeadline, { color: colors.text, zIndex: 1 }]}
      >
        You{"\u2019"}ve already begun
      </Animated.Text>

      <View style={{ height: spacing.md }} />

      {/* Subtext */}
      <Animated.Text
        entering={FadeIn.delay(subtextDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.finishBody, { color: colors.textSoft, zIndex: 1 }]}
      >
        Now let{"\u2019"}s take your first real lesson.
      </Animated.Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  finishHeadline: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  finishBody: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 300,
  },
  errorBox: {
    padding: spacing.md,
    marginBottom: spacing.md,
    width: "100%",
  },
  errorText: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },
});
```

Key changes:
- Uses `OnboardingStepLayout` with `footer`
- `maxWidth: 280` → `maxWidth: 300` (standardized)
- Animation timings use splash presets
- Error box moved into footer
- Removes inline `splashStep` and `spacerXl`

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/steps/Finish.tsx
git commit -m "fix(onboarding): standardize Finish step with layout footer, widths, and animation presets"
```

---

### Task 12: Fix Home Screen Spacing

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Add scroll bottom inset constant and replace raw values**

At the top of the file (after imports), add:

```typescript
const SCROLL_BOTTOM_INSET = 96;
```

Replace in `scrollContent` style:

Old:
```typescript
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
```

New:
```typescript
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: SCROLL_BOTTOM_INSET,
  },
```

Replace streak badge raw values:

Old:
```typescript
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
```

New:
```typescript
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 9999,
    borderWidth: 1,
  },
```

Note: `gap: 5` → `spacing.xs` (4). `paddingVertical: 6` → `spacing.xs` (4, rounds down — acceptable for a badge). `paddingHorizontal: 12` → `spacing.md` (12, exact).

- [ ] **Step 2: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "fix(home): replace raw padding/margin values with spacing tokens"
```

---

### Task 13: Fix HeroCard Spacing

**Files:**
- Modify: `src/components/home/HeroCard.tsx`

- [ ] **Step 1: Replace raw padding values in phasePill**

Old:
```typescript
  phasePill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    marginBottom: spacing.lg,
  },
```

New:
```typescript
  phasePill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 9999,
    marginBottom: spacing.lg,
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/HeroCard.tsx
git commit -m "fix(home): replace raw padding values with tokens in HeroCard"
```

---

### Task 14: Fix LessonGrid Spacing

**Files:**
- Modify: `src/components/home/LessonGrid.tsx`

- [ ] **Step 1: Replace raw values in nodeRow style**

Old:
```typescript
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 44,
  },
```

New:
```typescript
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    marginBottom: spacing.xxxl,
  },
```

- [ ] **Step 2: Replace raw values in currentLabel style**

Old:
```typescript
  currentLabel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.card,
  },
```

New:
```typescript
  currentLabel: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.card,
  },
```

- [ ] **Step 3: Replace raw marginTop in upNextRow**

Old:
```typescript
  upNextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
```

New:
```typescript
  upNextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
```

Note: `gap: 6` → `spacing.xs` (4). `marginTop: 3` → `spacing.xs` (4). Both round to nearest token.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/LessonGrid.tsx
git commit -m "fix(home): replace raw margin/padding/gap values with tokens in LessonGrid"
```

---

### Task 15: Fix Progress Screen Section Spacing

**Files:**
- Modify: `app/(tabs)/progress.tsx`
- Modify: `src/components/progress/PhasePanel.tsx`

- [ ] **Step 1: Standardize section header spacing in progress.tsx**

Replace the "Phase Progress" header:

Old:
```typescript
        <Text
          style={[
            typography.heading3,
            { color: colors.text, marginBottom: spacing.md },
          ]}
        >
          Phase Progress
        </Text>
```

New:
```typescript
        <Text
          style={[
            typography.heading3,
            { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
          ]}
        >
          Phase Progress
        </Text>
```

Replace the "Letter Mastery" header:

Old:
```typescript
        <Text
          style={[
            typography.heading3,
            {
              color: colors.text,
              marginTop: spacing.lg,
              marginBottom: spacing.md,
            },
          ]}
        >
          Letter Mastery
        </Text>
```

New:
```typescript
        <Text
          style={[
            typography.heading3,
            {
              color: colors.text,
              marginTop: spacing.xl,
              marginBottom: spacing.md,
            },
          ]}
        >
          Letter Mastery
        </Text>
```

- [ ] **Step 2: Move PhasePanel inline marginBottom to parent**

In `PhasePanel.tsx`, replace the inline Card style:

Old:
```typescript
    <Card style={{ marginBottom: spacing.md, padding: spacing.lg }}>
```

New:
```typescript
    <Card style={{ padding: spacing.lg }}>
```

In `progress.tsx`, add marginBottom to the PhasePanel mapping:

Old:
```typescript
        {PHASES.map((phase) => (
          <PhasePanel
            key={phase.key}
            label={phase.label}
            done={phaseCounts[phase.done] as number}
            total={phaseCounts[phase.total] as number}
          />
        ))}
```

New:
```typescript
        {PHASES.map((phase) => (
          <View key={phase.key} style={{ marginBottom: spacing.md }}>
            <PhasePanel
              label={phase.label}
              done={phaseCounts[phase.done] as number}
              total={phaseCounts[phase.total] as number}
            />
          </View>
        ))}
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/progress.tsx src/components/progress/PhasePanel.tsx
git commit -m "fix(progress): standardize section header spacing and move PhasePanel margin to parent"
```

---

### Task 16: Fix LetterMasteryGrid Spacing

**Files:**
- Modify: `src/components/progress/LetterMasteryGrid.tsx`

- [ ] **Step 1: Replace raw margin with token**

Old:
```typescript
  letterCell: {
    aspectRatio: 1,
    margin: 4,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs,
  },
```

New:
```typescript
  letterCell: {
    aspectRatio: 1,
    margin: spacing.xs,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs,
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/components/progress/LetterMasteryGrid.tsx
git commit -m "fix(progress): replace raw margin with spacing token in LetterMasteryGrid"
```

---

### Task 17: Extract QuizQuestion maxWidth Constant

**Files:**
- Modify: `src/components/quiz/QuizQuestion.tsx`

- [ ] **Step 1: Add named constant and use it**

At the top of the file (after imports), add:

```typescript
const OPTIONS_GRID_MAX_WIDTH = 340;
```

Replace in styles:

Old:
```typescript
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    width: "100%",
    maxWidth: 340,
  },
```

New:
```typescript
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    width: "100%",
    maxWidth: OPTIONS_GRID_MAX_WIDTH,
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/components/quiz/QuizQuestion.tsx
git commit -m "fix(quiz): extract options grid maxWidth as named constant"
```

---

### Task 18: Verify Build and Tests

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Run tests**

Run: `npx jest --passWithNoTests`
Expected: all tests pass (or no tests)

- [ ] **Step 3: Run Expo export check**

Run: `npx expo export --platform ios --dev 2>&1 | tail -5`
Expected: no build errors

- [ ] **Step 4: Final commit (if any fixups needed)**

```bash
git add -A
git commit -m "fix: resolve any build issues from UI Phase 1 structural changes"
```

---

## Success Criteria Traceability

| Criterion | Tasks |
|-----------|-------|
| Zero inline height hacks in onboarding | Tasks 4-11 |
| Zero raw padding/margin in onboarding | Tasks 3-11 |
| All onboarding steps use footer prop | Tasks 4-7, 9-11 |
| All animation timings use presets | Tasks 1, 4-11 |
| All body text maxWidth: 300 | Tasks 4, 6, 10, 11 |
| Home: zero raw values | Tasks 12-14 |
| Progress: consistent section spacing | Tasks 15-16 |
| Quiz: maxWidth named constant | Task 17 |
| App builds, no regressions | Task 18 |
