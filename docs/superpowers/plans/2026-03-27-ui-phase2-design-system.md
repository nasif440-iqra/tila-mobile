# UI Phase 2: Design System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add warm brown secondary color, enforce strict typography roles, and add `xxxxl` spacing token to make the app feel premium and intentional.

**Architecture:** Token-first — add new tokens to `tokens.ts`, then migrate each screen/component to use them. New typography presets (`pageTitle`, `cardHeadline`, `sectionHeader`, `label`, `statNumber`) replace ad-hoc font/weight/color combinations. Brown tokens added to both light and dark themes.

**Tech Stack:** React Native, Expo, TypeScript

---

## File Structure

### Modified files
```
src/design/tokens.ts                                — new color/spacing/typography tokens
src/design/theme.ts                                 — update ColorTokens type
app/(tabs)/index.tsx                                — page title style, hero→journey gap
src/components/home/HeroCard.tsx                    — headline, pill, description styles
src/components/home/LessonGrid.tsx                  — section title, current label styles
app/(tabs)/progress.tsx                             — page title, section headers, section gaps
src/components/progress/StatsRow.tsx                — stat numbers, stat labels
src/components/progress/PhasePanel.tsx              — phase label style
src/components/progress/LetterMasteryGrid.tsx       — letter name caption style
src/components/onboarding/steps/Welcome.tsx         — app name color
src/components/onboarding/steps/Tilawat.tsx         — headline color
src/components/onboarding/steps/Hadith.tsx          — headline color
src/components/onboarding/steps/StartingPoint.tsx   — headline color
src/components/onboarding/steps/LetterReveal.tsx    — label + letter name style
src/components/onboarding/steps/LetterAudio.tsx     — label + letter name style
src/components/onboarding/steps/LetterQuiz.tsx      — prompt color
src/components/onboarding/steps/Finish.tsx          — headline color
src/components/quiz/QuizQuestion.tsx                — prompt style
```

---

### Task 1: Add New Tokens

**Files:**
- Modify: `src/design/tokens.ts`

- [ ] **Step 1: Add brown color tokens to lightColors**

After line 20 (`border: "#EBE6DC",`), add:

```typescript
  brown: "#3D2B1F",
  brownLight: "#5C4033",
  brownSoft: "#F5EDE4",
```

- [ ] **Step 2: Add brown color tokens to darkColors**

After line 42 (`border: "#2A3028",`), add:

```typescript
  brown: "#D4C4B0",
  brownLight: "#B8A898",
  brownSoft: "#2A2420",
```

- [ ] **Step 3: Add xxxxl to spacing**

Change the spacing object:

Old:
```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;
```

New:
```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  xxxxl: 64,
} as const;
```

- [ ] **Step 4: Add new typography presets**

After the existing `caption` preset (around line 115), add these new presets before the closing `} as const;`:

```typescript
  // ── Role-based presets (Phase 2) ──
  pageTitle: {
    fontFamily: fontFamilies.headingItalic,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  cardHeadline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  },
  statNumber: {
    fontFamily: fontFamilies.headingItalic,
    fontSize: 24,
    lineHeight: 32,
  },
```

- [ ] **Step 5: Commit**

```bash
git add src/design/tokens.ts
git commit -m "feat(tokens): add brown colors, xxxxl spacing, and role-based typography presets"
```

---

### Task 2: Update Theme Type

**Files:**
- Modify: `src/design/theme.ts`

The `ColorTokens` type is derived from `typeof lightColors`, so adding brown tokens to `lightColors` and `darkColors` (Task 1) automatically updates the type. No code change is needed in `theme.ts` — the type inference handles it.

- [ ] **Step 1: Verify type is correct**

Run: `npx tsc --noEmit 2>&1 | grep -i brown`
Expected: no errors referencing brown tokens

- [ ] **Step 2: Commit (skip if no changes needed)**

If no changes needed, skip this commit.

---

### Task 3: Update Home Screen Page Title

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Add typography import**

Change import:

Old:
```typescript
import { spacing, fontFamilies } from "../../src/design/tokens";
```

New:
```typescript
import { spacing, typography, fontFamilies } from "../../src/design/tokens";
```

- [ ] **Step 2: Update app name style**

Change the `appName` style:

Old:
```typescript
  appName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    letterSpacing: 0.8,
  },
```

New:
```typescript
  appName: {
    ...typography.pageTitle,
  },
```

- [ ] **Step 3: Update color reference in JSX**

Change line ~102:

Old:
```typescript
          <Text style={[styles.appName, { color: colors.text }]}>tila</Text>
```

New:
```typescript
          <Text style={[styles.appName, { color: colors.brown }]}>tila</Text>
```

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "fix(home): update app name to pageTitle style with brown color"
```

---

### Task 4: Update HeroCard Styles

**Files:**
- Modify: `src/components/home/HeroCard.tsx`

- [ ] **Step 1: Add typography import**

The file already imports `typography` from tokens. Verify it does. If not, add it.

- [ ] **Step 2: Update phasePillText style**

Old:
```typescript
  phasePillText: {
    fontSize: 10,
    fontFamily: fontFamilies.bodyBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
```

New:
```typescript
  phasePillText: {
    ...typography.label,
  },
```

- [ ] **Step 3: Update heroTitle style**

Old:
```typescript
  heroTitle: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
```

New:
```typescript
  heroTitle: {
    ...typography.cardHeadline,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
```

- [ ] **Step 4: Update heroDescription style**

Old:
```typescript
  heroDescription: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyRegular,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
```

New:
```typescript
  heroDescription: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
```

- [ ] **Step 5: Update color references in JSX**

For the hero title (line ~76):

Old:
```typescript
      <Text style={[styles.heroTitle, { color: colors.text }]}>{lesson.title}</Text>
```

New:
```typescript
      <Text style={[styles.heroTitle, { color: colors.brown }]}>{lesson.title}</Text>
```

For the pill text (line ~65):

The pill text already uses `colors.accent` — keep it as-is.

For the "All lessons complete" title (line ~43):

Old:
```typescript
        <Text style={[styles.heroTitle, { color: colors.text }]}>All lessons complete!</Text>
```

New:
```typescript
        <Text style={[styles.heroTitle, { color: colors.brown }]}>All lessons complete!</Text>
```

For the description (line ~44 and ~77-78):

Change `colors.textMuted` to `colors.textSoft` if not already. These are body descriptions — keep with `textSoft` or `textMuted` as they are (not headings, no brown needed).

- [ ] **Step 6: Update heroCard marginBottom for xxxxl gap**

Old:
```typescript
  heroCard: {
    alignItems: "center",
    marginBottom: spacing.xxl,
    borderRadius: radii.xl,
    paddingVertical: spacing.xxl,
  },
```

New:
```typescript
  heroCard: {
    alignItems: "center",
    marginBottom: spacing.xxxxl,
    borderRadius: radii.xl,
    paddingVertical: spacing.xxl,
  },
```

- [ ] **Step 7: Commit**

```bash
git add src/components/home/HeroCard.tsx
git commit -m "fix(home): apply cardHeadline, label, and brown color to HeroCard"
```

---

### Task 5: Update LessonGrid Styles

**Files:**
- Modify: `src/components/home/LessonGrid.tsx`

- [ ] **Step 1: Add typography import**

Change import:

Old:
```typescript
import { spacing, radii, shadows, fontFamilies } from "../../design/tokens";
```

New:
```typescript
import { spacing, typography, radii, shadows, fontFamilies } from "../../design/tokens";
```

- [ ] **Step 2: Update journeySectionTitle style**

Old:
```typescript
  journeySectionTitle: {
    fontSize: 10,
    fontFamily: fontFamilies.bodyBold,
    letterSpacing: 1.2,
    marginBottom: spacing.xl,
  },
```

New:
```typescript
  journeySectionTitle: {
    ...typography.label,
    marginBottom: spacing.xl,
  },
```

- [ ] **Step 3: Update section title color in JSX**

Find line ~82-84:

Old:
```typescript
      <Text style={[styles.journeySectionTitle, { color: colors.textMuted }]}>
```

New:
```typescript
      <Text style={[styles.journeySectionTitle, { color: colors.brownLight }]}>
```

- [ ] **Step 4: Update currentLabelTitle style**

Old:
```typescript
  currentLabelTitle: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 15,
  },
```

New:
```typescript
  currentLabelTitle: {
    ...typography.cardHeadline,
    fontSize: 15,
  },
```

Note: We keep `fontSize: 15` override — the current label is smaller than a full card headline. The `cardHeadline` preset gives us the right font family and weight.

- [ ] **Step 5: Update current label title color in JSX**

Find line ~187:

Old:
```typescript
                  <Text style={[styles.currentLabelTitle, { color: colors.text }]}>
```

New:
```typescript
                  <Text style={[styles.currentLabelTitle, { color: colors.brown }]}>
```

- [ ] **Step 6: Update upNextText style**

Old:
```typescript
  upNextText: {
    fontSize: 11,
    fontFamily: fontFamilies.bodySemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
```

New:
```typescript
  upNextText: {
    ...typography.label,
  },
```

- [ ] **Step 7: Commit**

```bash
git add src/components/home/LessonGrid.tsx
git commit -m "fix(home): apply label, cardHeadline, and brown colors to LessonGrid"
```

---

### Task 6: Update Progress Screen

**Files:**
- Modify: `app/(tabs)/progress.tsx`

- [ ] **Step 1: Update page title**

Change line ~100:

Old:
```typescript
        <Text style={[typography.heading1, { color: colors.text, marginBottom: spacing.xl }]}>
          Your Progress
        </Text>
```

New:
```typescript
        <Text style={[typography.pageTitle, { color: colors.brown, marginBottom: spacing.xl }]}>
          Your Progress
        </Text>
```

- [ ] **Step 2: Update "Phase Progress" section header**

Change lines ~115-122:

Old:
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

New:
```typescript
        <Text
          style={[
            typography.sectionHeader,
            { color: colors.brownLight, marginTop: spacing.xxxxl, marginBottom: spacing.md },
          ]}
        >
          Phase Progress
        </Text>
```

- [ ] **Step 3: Update "Letter Mastery" section header**

Change lines ~135-146:

Old:
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

New:
```typescript
        <Text
          style={[
            typography.sectionHeader,
            {
              color: colors.brownLight,
              marginTop: spacing.xxxxl,
              marginBottom: spacing.md,
            },
          ]}
        >
          Letter Mastery
        </Text>
```

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/progress.tsx
git commit -m "fix(progress): apply pageTitle, sectionHeader, brown colors, and xxxxl gaps"
```

---

### Task 7: Update StatsRow

**Files:**
- Modify: `src/components/progress/StatsRow.tsx`

- [ ] **Step 1: Update stat number style in JSX**

Change lines ~39-46:

Old:
```typescript
          <Text
            style={[
              typography.heading2,
              { color: colors.primary, textAlign: "center" },
            ]}
          >
            {stat.value}
          </Text>
```

New:
```typescript
          <Text
            style={[
              typography.statNumber,
              { color: colors.primary, textAlign: "center" },
            ]}
          >
            {stat.value}
          </Text>
```

- [ ] **Step 2: Update statLabel style**

Old:
```typescript
  statLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.bodySemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
```

New:
```typescript
  statLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
```

- [ ] **Step 3: Add spacing import**

Verify `spacing` is already imported. It is (line 3). No change needed.

- [ ] **Step 4: Commit**

```bash
git add src/components/progress/StatsRow.tsx
git commit -m "fix(progress): apply statNumber and caption styles to StatsRow"
```

---

### Task 8: Update PhasePanel

**Files:**
- Modify: `src/components/progress/PhasePanel.tsx`

- [ ] **Step 1: Update phase label style in JSX**

Change lines ~69-76:

Old:
```typescript
            <Text
              style={[
                typography.bodyLarge,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.headingSemiBold,
                },
              ]}
            >
```

New:
```typescript
            <Text
              style={[
                typography.bodyLarge,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.headingMedium,
                },
              ]}
            >
```

Note: Changed from `headingSemiBold` to `headingMedium` (Lora 500) for quiet authority — spec says "Lora 500 medium."

- [ ] **Step 2: Update phaseCount style**

Old:
```typescript
  phaseCount: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyBold,
  },
```

New:
```typescript
  phaseCount: {
    ...typography.bodySmall,
  },
```

- [ ] **Step 3: Commit**

```bash
git add src/components/progress/PhasePanel.tsx
git commit -m "fix(progress): apply Lora medium and bodySmall to PhasePanel"
```

---

### Task 9: Update LetterMasteryGrid

**Files:**
- Modify: `src/components/progress/LetterMasteryGrid.tsx`

- [ ] **Step 1: Add typography import**

Change import:

Old:
```typescript
import { spacing, radii, fontFamilies } from "../../design/tokens";
```

New:
```typescript
import { spacing, typography, radii, fontFamilies } from "../../design/tokens";
```

- [ ] **Step 2: Update letterName style**

Old:
```typescript
  letterName: {
    fontSize: 9,
    fontFamily: fontFamilies.bodySemiBold,
    marginTop: spacing.xs,
  },
```

New:
```typescript
  letterName: {
    ...typography.caption,
    fontSize: 9,
    marginTop: spacing.xs,
  },
```

Note: We keep `fontSize: 9` override — letter names in the grid are intentionally smaller than standard captions due to the tight cell layout.

- [ ] **Step 3: Commit**

```bash
git add src/components/progress/LetterMasteryGrid.tsx
git commit -m "fix(progress): apply caption base style to letter names in mastery grid"
```

---

### Task 10: Update Onboarding Steps — Splash Steps (Welcome, Tilawat, Hadith)

**Files:**
- Modify: `src/components/onboarding/steps/Welcome.tsx`
- Modify: `src/components/onboarding/steps/Tilawat.tsx`
- Modify: `src/components/onboarding/steps/Hadith.tsx`

- [ ] **Step 1: Update Welcome.tsx — app name color**

Change line ~89:

Old:
```typescript
            color: colors.text,
```

New:
```typescript
            color: colors.brown,
```

- [ ] **Step 2: Update Tilawat.tsx — headline color**

Change line ~56:

Old:
```typescript
        style={[styles.sacredHeadline, { color: colors.text, zIndex: 1 }]}
```

New:
```typescript
        style={[styles.sacredHeadline, { color: colors.brown, zIndex: 1 }]}
```

- [ ] **Step 3: Update Hadith.tsx — headline color**

Change line ~63:

Old:
```typescript
        style={[styles.hadithHeadline, { color: colors.text, zIndex: 1 }]}
```

New:
```typescript
        style={[styles.hadithHeadline, { color: colors.brown, zIndex: 1 }]}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/steps/Welcome.tsx src/components/onboarding/steps/Tilawat.tsx src/components/onboarding/steps/Hadith.tsx
git commit -m "fix(onboarding): apply brown color to splash step headlines"
```

---

### Task 11: Update Onboarding Steps — Interactive Steps (StartingPoint, LetterReveal, LetterAudio)

**Files:**
- Modify: `src/components/onboarding/steps/StartingPoint.tsx`
- Modify: `src/components/onboarding/steps/LetterReveal.tsx`
- Modify: `src/components/onboarding/steps/LetterAudio.tsx`

- [ ] **Step 1: Update StartingPoint.tsx — headline color**

Change line ~92:

Old:
```typescript
      <Text style={[styles.headline, { color: colors.text }]}>
```

New:
```typescript
      <Text style={[styles.headline, { color: colors.brown }]}>
```

- [ ] **Step 2: Update LetterReveal.tsx — label style and letter name color**

For the "Your first letter" label, change line ~26:

Old:
```typescript
        style={[styles.firstWinLabel, { color: colors.textMuted }]}
```

New:
```typescript
        style={[styles.firstWinLabel, { color: colors.textMuted }]}
```

No color change here — `textMuted` is correct for labels per spec.

For the letter name "Alif", change line ~52:

Old:
```typescript
        style={[styles.letterRevealName, { color: colors.text, zIndex: 1 }]}
```

New:
```typescript
        style={[styles.letterRevealName, { color: colors.brown, zIndex: 1 }]}
```

- [ ] **Step 3: Update LetterAudio.tsx — letter name color**

Change line ~78:

Old:
```typescript
        <Text style={[styles.letterCircleName, { color: colors.text }]}>
```

New:
```typescript
        <Text style={[styles.letterCircleName, { color: colors.brown }]}>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/steps/StartingPoint.tsx src/components/onboarding/steps/LetterReveal.tsx src/components/onboarding/steps/LetterAudio.tsx
git commit -m "fix(onboarding): apply brown color to interactive step headlines and letter names"
```

---

### Task 12: Update Onboarding Steps — Final Steps (LetterQuiz, Finish)

**Files:**
- Modify: `src/components/onboarding/steps/LetterQuiz.tsx`
- Modify: `src/components/onboarding/steps/Finish.tsx`

- [ ] **Step 1: Update LetterQuiz.tsx — prompt color**

Change line ~59:

Old:
```typescript
        style={[styles.quizPrompt, { color: colors.text }]}
```

New:
```typescript
        style={[styles.quizPrompt, { color: colors.brown }]}
```

- [ ] **Step 2: Update Finish.tsx — headline color**

Change line ~104:

Old:
```typescript
        style={[styles.finishHeadline, { color: colors.text, zIndex: 1 }]}
```

New:
```typescript
        style={[styles.finishHeadline, { color: colors.brown, zIndex: 1 }]}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/steps/LetterQuiz.tsx src/components/onboarding/steps/Finish.tsx
git commit -m "fix(onboarding): apply brown color to quiz prompt and finish headline"
```

---

### Task 13: Update QuizQuestion Prompt Style

**Files:**
- Modify: `src/components/quiz/QuizQuestion.tsx`

- [ ] **Step 1: Update prompt text color in JSX**

Find the promptText usage. The prompt text uses `colors.text` in several places (lines ~51, ~107-108). Change them:

Old:
```typescript
            style={[
              styles.promptText,
              { color: colors.text, marginTop: spacing.lg },
            ]}
```

New:
```typescript
            style={[
              styles.promptText,
              { color: colors.brown, marginTop: spacing.lg },
            ]}
```

And:

Old:
```typescript
          <Text
            style={[styles.promptText, { color: colors.text }]}
          >
```

New:
```typescript
          <Text
            style={[styles.promptText, { color: colors.brown }]}
          >
```

Note: There are multiple prompt rendering paths (audio, letter-to-sound, letter-to-name, visual). Update ALL instances of `colors.text` on `promptText` to `colors.brown`. The `promptSubtext` stays `colors.textSoft`.

- [ ] **Step 2: Commit**

```bash
git add src/components/quiz/QuizQuestion.tsx
git commit -m "fix(quiz): apply brown color to question prompts"
```

---

### Task 14: Verify Build and Tests

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: no NEW errors (pre-existing errors in SpotTheBreak.tsx etc. are OK)

- [ ] **Step 2: Run Expo bundle check**

Run: `npx expo export --platform ios --dev 2>&1 | tail -5`
Expected: `Exported: dist` — clean build

- [ ] **Step 3: Final fixup commit if needed**

```bash
git add -A
git commit -m "fix: resolve any build issues from UI Phase 2 design system changes"
```

---

## Success Criteria Traceability

| Criterion | Tasks |
|-----------|-------|
| Brown tokens in light + dark themes | Task 1 |
| `xxxxl: 64` spacing token | Task 1 |
| New typography presets | Task 1 |
| Page titles use `pageTitle` + brown | Tasks 3, 6 |
| Card headlines use `cardHeadline` + brown | Tasks 4, 5 |
| Section headers use `sectionHeader` + brownLight | Tasks 5, 6 |
| Stat numbers use `statNumber` | Task 7 |
| Decorative labels use `label` | Tasks 4, 5 |
| Major section breaks use `xxxxl` | Tasks 4, 6 |
| No heading uses `colors.text` | Tasks 3-6, 10-13 |
| Dark theme works (type inference) | Task 2 |
| App builds correctly | Task 14 |
