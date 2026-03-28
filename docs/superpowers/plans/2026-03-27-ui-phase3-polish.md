# UI Phase 3: Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix visual inconsistencies — add missing shadows, standardize spacing, replace hard-coded values with tokens, and add border width tokens — to make the app feel cohesive and premium.

**Architecture:** Token-first — add `borderWidths` tokens to `tokens.ts`, then sweep each component to use them. Shadow additions use the existing `shadows.card` token. Spacing fixes use existing spacing tokens. No new components.

**Tech Stack:** React Native, Expo, TypeScript

---

## File Structure

### Modified files
```
src/design/tokens.ts                                — add borderWidths tokens
src/components/home/HeroCard.tsx                    — radii.full for pill
src/components/home/LessonGrid.tsx                  — shadow + border width tokens
app/(tabs)/progress.tsx                             — section header bottom margins
src/components/progress/StatsRow.tsx                — card padding
src/components/onboarding/steps/StartingPoint.tsx   — shadow + border width token
src/components/quiz/WrongAnswerPanel.tsx             — shadow
src/components/quiz/QuizQuestion.tsx                 — border width token
src/design/components/QuizOption.tsx                 — border width token
src/components/LessonSummary.tsx                     — shadow on content area
```

---

### Task 1: Add Border Width Tokens

**Files:**
- Modify: `src/design/tokens.ts`

- [ ] **Step 1: Add borderWidths tokens**

After the `radii` block (after line 177), add:

```typescript
// ── Border Widths ──

export const borderWidths = {
  thin: 1,
  normal: 1.5,
  thick: 2,
} as const;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add src/design/tokens.ts
git commit -m "feat(tokens): add borderWidths tokens (thin, normal, thick)"
```

---

### Task 2: Polish HeroCard

**Files:**
- Modify: `src/components/home/HeroCard.tsx`

- [ ] **Step 1: Replace hard-coded borderRadius 9999 with radii.full**

In the `phasePill` style (line 103):

Old:
```typescript
    borderRadius: 9999,
```

New:
```typescript
    borderRadius: radii.full,
```

The file already imports `radii` from `../../design/tokens` (line 4). No import change needed.

- [ ] **Step 2: Commit**

```bash
git add src/components/home/HeroCard.tsx
git commit -m "fix(home): use radii.full for HeroCard phase pill"
```

---

### Task 3: Polish LessonGrid

**Files:**
- Modify: `src/components/home/LessonGrid.tsx`

- [ ] **Step 1: Add borderWidths import**

Change line 5:

Old:
```typescript
import { spacing, typography, radii, shadows, fontFamilies } from "../../design/tokens";
```

New:
```typescript
import { spacing, typography, radii, shadows, borderWidths, fontFamilies } from "../../design/tokens";
```

- [ ] **Step 2: Change completed node shadow from soft to card**

In `nodeComplete` style (line 261-263):

Old:
```typescript
  nodeComplete: {
    ...shadows.soft,
  },
```

New:
```typescript
  nodeComplete: {
    ...shadows.card,
  },
```

- [ ] **Step 3: Change connectorLine borderLeftWidth to token**

In `connectorLine` style (line 244):

Old:
```typescript
    borderLeftWidth: 2,
```

New:
```typescript
    borderLeftWidth: borderWidths.thick,
```

- [ ] **Step 4: Change nodeCurrent borderWidth to token**

In `nodeCurrent` style (line 268):

Old:
```typescript
    borderWidth: 2.5,
```

New:
```typescript
    borderWidth: borderWidths.thick,
```

- [ ] **Step 5: Change nodeLocked borderWidth to token**

In `nodeLocked` style (line 272):

Old:
```typescript
    borderWidth: 2,
```

New:
```typescript
    borderWidth: borderWidths.thick,
```

- [ ] **Step 6: Change currentLabel borderWidth to token**

In `currentLabel` style (line 283):

Old:
```typescript
    borderWidth: 1,
```

New:
```typescript
    borderWidth: borderWidths.thin,
```

- [ ] **Step 7: Commit**

```bash
git add src/components/home/LessonGrid.tsx
git commit -m "fix(home): standardize LessonGrid shadows and border widths with tokens"
```

---

### Task 4: Polish Progress Screen Spacing

**Files:**
- Modify: `app/(tabs)/progress.tsx`

- [ ] **Step 1: Update "Phase Progress" header marginBottom**

Change line 118:

Old:
```typescript
            { color: colors.brownLight, marginTop: spacing.xxxxl, marginBottom: spacing.md },
```

New:
```typescript
            { color: colors.brownLight, marginTop: spacing.xxxxl, marginBottom: spacing.lg },
```

- [ ] **Step 2: Update "Letter Mastery" header marginBottom**

Change line 141:

Old:
```typescript
              marginBottom: spacing.md,
```

New:
```typescript
              marginBottom: spacing.lg,
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/progress.tsx
git commit -m "fix(progress): increase section header bottom margins for breathing room"
```

---

### Task 5: Polish StatsRow Spacing

**Files:**
- Modify: `src/components/progress/StatsRow.tsx`

- [ ] **Step 1: Increase statCard padding from md to lg**

Change line 64:

Old:
```typescript
    padding: spacing.md,
```

New:
```typescript
    padding: spacing.lg,
```

The `statsRow` already has `gap: spacing.sm` (line 59) — no change needed there.

- [ ] **Step 2: Commit**

```bash
git add src/components/progress/StatsRow.tsx
git commit -m "fix(progress): increase StatsRow card padding for breathing room"
```

---

### Task 6: Polish StartingPoint OptionCards

**Files:**
- Modify: `src/components/onboarding/steps/StartingPoint.tsx`

- [ ] **Step 1: Add shadows and borderWidths imports**

Change line 5:

Old:
```typescript
import { typography, spacing, radii } from "../../../design/tokens";
```

New:
```typescript
import { typography, spacing, radii, shadows, borderWidths } from "../../../design/tokens";
```

- [ ] **Step 2: Add shadow and update borderWidth on card style**

In the `card` style (lines 55-60):

Old:
```typescript
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
```

New:
```typescript
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: borderWidths.normal,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
```

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/steps/StartingPoint.tsx
git commit -m "fix(onboarding): add shadow and border width token to StartingPoint option cards"
```

---

### Task 7: Polish WrongAnswerPanel

**Files:**
- Modify: `src/components/quiz/WrongAnswerPanel.tsx`

- [ ] **Step 1: Add shadows import**

Change line 4:

Old:
```typescript
import { typography, spacing, radii } from "../../design/tokens";
```

New:
```typescript
import { typography, spacing, radii, shadows } from "../../design/tokens";
```

- [ ] **Step 2: Add shadow to wrongPanel style**

In the `wrongPanel` style (lines 108-112):

Old:
```typescript
  wrongPanel: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
```

New:
```typescript
  wrongPanel: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
```

- [ ] **Step 3: Commit**

```bash
git add src/components/quiz/WrongAnswerPanel.tsx
git commit -m "fix(quiz): add shadow to WrongAnswerPanel"
```

---

### Task 8: Polish QuizQuestion

**Files:**
- Modify: `src/components/quiz/QuizQuestion.tsx`

- [ ] **Step 1: Add borderWidths import**

Change line 4:

Old:
```typescript
import { typography, spacing, radii } from "../../design/tokens";
```

New:
```typescript
import { typography, spacing, radii, borderWidths } from "../../design/tokens";
```

- [ ] **Step 2: Update correctFeedback borderWidth to token**

In the `correctFeedback` style (line 218):

Old:
```typescript
    borderWidth: 1.5,
```

New:
```typescript
    borderWidth: borderWidths.normal,
```

- [ ] **Step 3: Commit**

```bash
git add src/components/quiz/QuizQuestion.tsx
git commit -m "fix(quiz): use borderWidths token for correctFeedback pill"
```

---

### Task 9: Polish QuizOption

**Files:**
- Modify: `src/design/components/QuizOption.tsx`

- [ ] **Step 1: Add borderWidths import**

Change line 11:

Old:
```typescript
import { typography, spacing, radii } from "../tokens";
```

New:
```typescript
import { typography, spacing, radii, borderWidths } from "../tokens";
```

- [ ] **Step 2: Update base borderWidth to token**

In the `base` style (line 141):

Old:
```typescript
    borderWidth: 2,
```

New:
```typescript
    borderWidth: borderWidths.thick,
```

- [ ] **Step 3: Commit**

```bash
git add src/design/components/QuizOption.tsx
git commit -m "fix(quiz): use borderWidths token for QuizOption"
```

---

### Task 10: Polish LessonSummary

**Files:**
- Modify: `src/components/LessonSummary.tsx`

- [ ] **Step 1: Add shadows import**

Change line 15:

Old:
```typescript
import { typography, spacing, radii, fontFamilies } from "../design/tokens";
```

New:
```typescript
import { typography, spacing, radii, shadows, fontFamilies } from "../design/tokens";
```

- [ ] **Step 2: Add shadow to content style**

In the `content` style (lines 214-221):

Old:
```typescript
  content: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    borderRadius: radii.xl,
  },
```

New:
```typescript
  content: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    borderRadius: radii.xl,
    ...shadows.card,
  },
```

- [ ] **Step 3: Commit**

```bash
git add src/components/LessonSummary.tsx
git commit -m "fix(lesson): add shadow to LessonSummary content area"
```

---

### Task 11: Verify Build

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: no NEW errors (pre-existing errors are OK)

- [ ] **Step 2: Run Expo bundle check**

Run: `npx expo export --platform ios --dev 2>&1 | tail -5`
Expected: clean build

- [ ] **Step 3: Final fixup commit if needed**

Only if build issues are found:
```bash
git add -A
git commit -m "fix: resolve build issues from UI Phase 3 polish changes"
```

---

## Success Criteria Traceability

| Criterion | Task |
|-----------|------|
| `borderWidths` tokens exist (thin: 1, normal: 1.5, thick: 2) | Task 1 |
| All card-like surfaces have shadows | Tasks 6, 7, 10 |
| No `borderRadius: 9999` — all use `radii.full` | Task 2 |
| All border widths use `borderWidths` tokens | Tasks 3, 6, 8, 9 |
| StatsRow cards have `spacing.lg` padding | Task 5 |
| Section headers have `spacing.lg` bottom margin | Task 4 |
| LessonGrid completed nodes use `shadows.card` | Task 3 |
| LessonGrid current node uses `borderWidths.thick` | Task 3 |
| App builds correctly | Task 11 |
