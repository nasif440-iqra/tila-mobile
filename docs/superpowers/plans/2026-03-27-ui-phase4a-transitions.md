# UI Phase 4a: Screen & Step Transitions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add purposeful transitions to the four key navigation zones: lesson entry/exit (slide up/down), lesson stage transitions (cross-fade), exercise-to-exercise (fade with delay), and onboarding step progression (fade).

**Architecture:** Zone 1 uses expo-router's built-in `slide_from_bottom` animation via Stack.Screen config. Zones 2-4 use reanimated `FadeIn`/`FadeOut` layout animations with `key` prop to trigger mount/unmount transitions. Timing constants are centralized in `animations.ts`.

**Tech Stack:** React Native, Expo Router, react-native-reanimated 4.2.1

---

## File Structure

### Modified files
```
src/components/onboarding/animations.ts             — add transition timing presets
app/_layout.tsx                                     — lesson route slide_from_bottom config
app/lesson/[id].tsx                                 — stage transition animations + exit nav fix
app/lesson/review.tsx                               — stage transition animations
src/components/LessonHybrid.tsx                     — exercise exit animation
src/components/onboarding/OnboardingFlow.tsx        — step transition animations
```

---

### Task 1: Add Transition Timing Presets

**Files:**
- Modify: `src/components/onboarding/animations.ts`

- [ ] **Step 1: Add transition presets**

After line 11 (the `CTA_DURATION` constant), add:

```typescript

// ── Transition presets (Phase 4a) ──
export const TRANSITION_FADE_IN = 300; // ms — container-level fade in
export const TRANSITION_FADE_OUT = 200; // ms — container-level fade out
export const TRANSITION_FADE_IN_DELAY = 100; // ms — delay before new content fades in
export const TRANSITION_LESSON_DURATION = 400; // ms — lesson slide up/down
```

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/animations.ts
git commit -m "feat(animations): add transition timing presets for Phase 4a"
```

---

### Task 2: Lesson Route Slide-from-Bottom

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add Stack.Screen entries for lesson routes**

The current Stack (lines 85-92) uses only `screenOptions` with no per-screen overrides:

```typescript
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: "fade",
            animationDuration: 300,
          }}
        />
```

Change the self-closing `/>` to open/close tags and add Screen entries inside:

Old:
```typescript
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: "fade",
            animationDuration: 300,
          }}
        />
```

New:
```typescript
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: "fade",
            animationDuration: 300,
          }}
        >
          <Stack.Screen
            name="lesson/[id]"
            options={{
              animation: "slide_from_bottom",
              animationDuration: 400,
            }}
          />
          <Stack.Screen
            name="lesson/review"
            options={{
              animation: "slide_from_bottom",
              animationDuration: 400,
            }}
          />
        </Stack>
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(nav): lesson screens slide up from bottom on entry/exit"
```

---

### Task 3: Lesson Stage Transition Animations

**Files:**
- Modify: `app/lesson/[id].tsx`

- [ ] **Step 1: Add reanimated imports**

Change line 1-2:

Old:
```typescript
import { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
```

New:
```typescript
import { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
```

- [ ] **Step 2: Import transition presets**

After the existing import block (after line 18 `import { track } from '../../src/analytics';`), add:

```typescript
import {
  TRANSITION_FADE_IN,
  TRANSITION_FADE_OUT,
} from "../../src/components/onboarding/animations";
```

- [ ] **Step 3: Wrap stage rendering in Animated.View**

Replace the stage rendering block (lines 189-226):

Old:
```typescript
  const isHybrid = lesson?.lessonType === "hybrid";

  // Show intro unless we're skipping it (retry flow) or it's a hybrid lesson
  if (stage === "intro" && !skipIntro && !isHybrid) {
    return <LessonIntro lesson={lesson} onStart={() => setStage("quiz")} />;
  }

  // Quiz stage (also entered directly when skipIntro is true or for hybrid lessons)
  if (stage === "quiz" || (stage === "intro" && (skipIntro || isHybrid))) {
    if (isHybrid) {
      return <LessonHybrid lesson={lesson} onComplete={handleQuizComplete} />;
    }
    return (
      <LessonQuiz
        lesson={lesson}
        completedLessonIds={completedLessonIds}
        mastery={mastery}
        onComplete={handleQuizComplete}
      />
    );
  }

  // Summary stage
  if (stage === "summary" && quizResults) {
    return (
      <LessonSummary
        lesson={lesson}
        results={quizResults}
        passed={quizResults.passed}
        accuracy={quizResults.accuracy}
        onContinue={handleContinue}
        onRetry={handleRetry}
      />
    );
  }

  // Fallback — should not happen
  return null;
```

New:
```typescript
  const isHybrid = lesson?.lessonType === "hybrid";

  // Determine the effective stage key for animation
  const effectiveStage =
    stage === "intro" && (skipIntro || isHybrid) ? "quiz" : stage;

  function renderStage() {
    // Show intro unless we're skipping it (retry flow) or it's a hybrid lesson
    if (stage === "intro" && !skipIntro && !isHybrid) {
      return <LessonIntro lesson={lesson} onStart={() => setStage("quiz")} />;
    }

    // Quiz stage (also entered directly when skipIntro is true or for hybrid lessons)
    if (stage === "quiz" || (stage === "intro" && (skipIntro || isHybrid))) {
      if (isHybrid) {
        return <LessonHybrid lesson={lesson} onComplete={handleQuizComplete} />;
      }
      return (
        <LessonQuiz
          lesson={lesson}
          completedLessonIds={completedLessonIds}
          mastery={mastery}
          onComplete={handleQuizComplete}
        />
      );
    }

    // Summary stage
    if (stage === "summary" && quizResults) {
      return (
        <LessonSummary
          lesson={lesson}
          results={quizResults}
          passed={quizResults.passed}
          accuracy={quizResults.accuracy}
          onContinue={handleContinue}
          onRetry={handleRetry}
        />
      );
    }

    return null;
  }

  return (
    <Animated.View
      key={effectiveStage}
      entering={FadeIn.duration(TRANSITION_FADE_IN)}
      exiting={FadeOut.duration(TRANSITION_FADE_OUT)}
      style={{ flex: 1 }}
    >
      {renderStage()}
    </Animated.View>
  );
```

- [ ] **Step 4: Commit**

```bash
git add app/lesson/[id].tsx
git commit -m "feat(lesson): add fade transitions between lesson stages"
```

---

### Task 4: Review Screen Stage Transitions

**Files:**
- Modify: `app/lesson/review.tsx`

- [ ] **Step 1: Add reanimated imports**

After line 1:

Old:
```typescript
import { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
```

New:
```typescript
import { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
```

- [ ] **Step 2: Import transition presets**

After line 15 (`import type { QuizResultItem } from '../../src/types/quiz';`), add:

```typescript
import {
  TRANSITION_FADE_IN,
  TRANSITION_FADE_OUT,
} from "../../src/components/onboarding/animations";
```

- [ ] **Step 3: Wrap stage rendering in Animated.View**

Replace the quiz and summary stage blocks (lines 120-149):

Old:
```typescript
  // ── Quiz stage ──

  if (stage === "quiz") {
    return (
      <LessonQuiz
        lesson={reviewLesson}
        completedLessonIds={completedLessonIds}
        mastery={mastery}
        onComplete={handleQuizComplete}
      />
    );
  }

  // ── Summary stage (always passed) ──

  if (stage === "summary" && quizResults) {
    return (
      <LessonSummary
        lesson={reviewLesson}
        results={quizResults}
        passed={quizResults.passed}
        accuracy={quizResults.accuracy}
        onContinue={handleContinue}
        onRetry={() => {}} // Review sessions don't retry — always pass
      />
    );
  }

  // Fallback
  return null;
```

New:
```typescript
  // ── Stage rendering ──

  function renderStage() {
    if (stage === "quiz") {
      return (
        <LessonQuiz
          lesson={reviewLesson}
          completedLessonIds={completedLessonIds}
          mastery={mastery}
          onComplete={handleQuizComplete}
        />
      );
    }

    if (stage === "summary" && quizResults) {
      return (
        <LessonSummary
          lesson={reviewLesson}
          results={quizResults}
          passed={quizResults.passed}
          accuracy={quizResults.accuracy}
          onContinue={handleContinue}
          onRetry={() => {}} // Review sessions don't retry — always pass
        />
      );
    }

    return null;
  }

  return (
    <Animated.View
      key={stage}
      entering={FadeIn.duration(TRANSITION_FADE_IN)}
      exiting={FadeOut.duration(TRANSITION_FADE_OUT)}
      style={{ flex: 1 }}
    >
      {renderStage()}
    </Animated.View>
  );
```

- [ ] **Step 4: Commit**

```bash
git add app/lesson/review.tsx
git commit -m "feat(review): add fade transitions between review stages"
```

---

### Task 5: Exercise-to-Exercise Transitions

**Files:**
- Modify: `src/components/LessonHybrid.tsx`

- [ ] **Step 1: Import transition presets**

After line 14 (`import useLessonHybrid, { type Stage } from "../hooks/useLessonHybrid";`), add:

```typescript
import {
  TRANSITION_FADE_IN,
  TRANSITION_FADE_OUT,
  TRANSITION_FADE_IN_DELAY,
} from "./onboarding/animations";
```

- [ ] **Step 2: Update exercise wrapper animation**

Change lines 255-261:

Old:
```typescript
        <Animated.View
          key={hybrid.exerciseIndex}
          entering={FadeInDown.springify().stiffness(320).damping(28)}
          style={styles.exerciseWrapper}
        >
          {renderExercise()}
        </Animated.View>
```

New:
```typescript
        <Animated.View
          key={hybrid.exerciseIndex}
          entering={FadeIn.duration(TRANSITION_FADE_IN).delay(TRANSITION_FADE_IN_DELAY)}
          exiting={FadeOut.duration(TRANSITION_FADE_OUT)}
          style={styles.exerciseWrapper}
        >
          {renderExercise()}
        </Animated.View>
```

Note: `FadeIn` and `FadeOut` are already imported on lines 7 and 9. `FadeInDown` is no longer used for the exercise wrapper — verify it's still used elsewhere in the file before removing from imports.

- [ ] **Step 3: Commit**

```bash
git add src/components/LessonHybrid.tsx
git commit -m "feat(lesson): add exit animation and fade delay to exercise transitions"
```

---

### Task 6: Onboarding Step Transitions

**Files:**
- Modify: `src/components/onboarding/OnboardingFlow.tsx`

- [ ] **Step 1: Add FadeIn and FadeOut to reanimated imports**

Change lines 3-7:

Old:
```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
```

New:
```typescript
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
```

- [ ] **Step 2: Import transition presets**

After line 11 (`import { spacing } from "../../design/tokens";`), add:

```typescript
import {
  TRANSITION_FADE_IN,
  TRANSITION_FADE_OUT,
} from "./animations";
```

- [ ] **Step 3: Wrap step rendering in keyed Animated.View**

Change lines 139-172 (the ScrollView and its contents):

Old:
```typescript
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {step === 0 && <Welcome onNext={goNext} />}
        {step === 1 && <Tilawat onNext={goNext} />}
        {step === 2 && <Hadith onNext={goNext} />}
        {step === 3 && (
          <StartingPoint
            startingPoint={draft.startingPoint}
            onSelectStartingPoint={(value) =>
              setDraft((d) => ({ ...d, startingPoint: value as OnboardingDraft["startingPoint"] }))
            }
            onNext={goNext}
          />
        )}
        {step === 4 && <LetterReveal />}
        {step === 5 && (
          <LetterAudio
            onNext={goNext}
            onPlayAudio={handlePlayAudio}
            hasPlayedAudio={hasPlayedAudio}
          />
        )}
        {step === 6 && <LetterQuiz onNext={goNext} />}
        {step === 7 && (
          <Finish
            onFinish={handleFinish}
            finishing={finishing}
            finishError={finishError}
          />
        )}
      </ScrollView>
```

New:
```typescript
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          key={step}
          entering={FadeIn.duration(TRANSITION_FADE_IN + 100)}
          exiting={FadeOut.duration(TRANSITION_FADE_OUT + 50)}
          style={{ flex: 1 }}
        >
          {step === 0 && <Welcome onNext={goNext} />}
          {step === 1 && <Tilawat onNext={goNext} />}
          {step === 2 && <Hadith onNext={goNext} />}
          {step === 3 && (
            <StartingPoint
              startingPoint={draft.startingPoint}
              onSelectStartingPoint={(value) =>
                setDraft((d) => ({ ...d, startingPoint: value as OnboardingDraft["startingPoint"] }))
              }
              onNext={goNext}
            />
          )}
          {step === 4 && <LetterReveal />}
          {step === 5 && (
            <LetterAudio
              onNext={goNext}
              onPlayAudio={handlePlayAudio}
              hasPlayedAudio={hasPlayedAudio}
            />
          )}
          {step === 6 && <LetterQuiz onNext={goNext} />}
          {step === 7 && (
            <Finish
              onFinish={handleFinish}
              finishing={finishing}
              finishError={finishError}
            />
          )}
        </Animated.View>
      </ScrollView>
```

Note: Onboarding uses slightly longer durations (`TRANSITION_FADE_IN + 100` = 400ms in, `TRANSITION_FADE_OUT + 50` = 250ms out) per spec for a more dramatic first-impression feel.

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/OnboardingFlow.tsx
git commit -m "feat(onboarding): add fade transitions between onboarding steps"
```

---

### Task 7: Verify Build

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: no NEW errors (pre-existing errors in SpotTheBreak.tsx etc. are OK)

- [ ] **Step 2: Run Expo bundle check**

Run: `npx expo export --platform ios --dev 2>&1 | tail -5`
Expected: clean build

- [ ] **Step 3: Final fixup commit if needed**

Only if build issues are found:
```bash
git add -A
git commit -m "fix: resolve build issues from Phase 4a transition changes"
```

---

## Success Criteria Traceability

| Criterion | Task |
|-----------|------|
| Transition timing presets exist in animations.ts | Task 1 |
| Lesson screens slide up from bottom / down on exit | Task 2 |
| Lesson stage transitions (intro→quiz→summary) fade | Task 3 |
| Review stage transitions fade | Task 4 |
| Exercises have exit animation + delayed entry | Task 5 |
| Onboarding steps fade in/out on advance | Task 6 |
| App builds correctly | Task 7 |
