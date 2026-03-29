# Wave 2: Structural Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split fat screens and components into focused files with proper TypeScript types, then consolidate the audio layer into a two-lane playback API.

**Architecture:** Extract shared type definitions first (types are introduced during each split, not as a separate phase). Each screen/component split produces thin orchestrators that delegate to focused child components. The audio layer is last because it touches components that will be split first.

**Tech Stack:** React Native 0.83, Expo 55, TypeScript 5.9, react-native-reanimated 4.2, expo-audio, expo-haptics, Vitest

**Prerequisite:** Wave 1 (foundation cleanup) is complete — all contract tests pass, prototype leakage removed, correctness bugs fixed, tooling in place, loadProgress parallelized.

---

## File Structure

### New files created by this plan

```
src/
  types/
    lesson.ts              — Lesson type definition (replaces lesson: any)
    mastery.ts             — MasteryState, EntityState, SkillState re-exports
    progress.ts            — ProgressState re-export + typed selectors
    onboarding.ts          — OnboardingDraft, step type
  components/
    quiz/
      QuizQuestion.tsx     — Single question display (~150 lines)
      QuizProgress.tsx     — Progress bar + streak banner (~80 lines)
      QuizCelebration.tsx  — Mid-quiz celebration overlay (~80 lines)
      WrongAnswerPanel.tsx — Wrong answer feedback panel (~100 lines)
    onboarding/
      OnboardingFlow.tsx   — Step orchestrator (~150 lines)
      OnboardingStepLayout.tsx — Shared step scaffold (~80 lines)
      steps/
        Welcome.tsx        — Step 0: logo, app name, CTA (~120 lines)
        Tilawat.tsx        — Step 1: Arabic calligraphy (~90 lines)
        Hadith.tsx         — Step 2: Hadith quote (~100 lines)
        StartingPoint.tsx  — Step 3: experience level (~90 lines)
        LetterReveal.tsx   — Step 4: first letter auto-advance (~70 lines)
        LetterAudio.tsx    — Step 5: Alif audio playback (~100 lines)
        LetterQuiz.tsx     — Step 6: "Which one is Alif?" (~120 lines)
        Finish.tsx         — Step 7: completion + CTA (~100 lines)
    home/
      HeroCard.tsx         — Active lesson card (~130 lines)
      LessonGrid.tsx       — Serpentine journey path (~200 lines)
    progress/
      StatsRow.tsx         — Four stat cards (~60 lines)
      PhasePanel.tsx       — Phase progress bar (~100 lines)
      LetterMasteryGrid.tsx — 28-letter mastery grid (~150 lines)
  audio/
    player.ts              — Expanded with playback helpers + 2-lane policy
```

### Modified files

```
src/components/LessonQuiz.tsx    — Thin orchestrator (~150 lines, down from 693)
app/onboarding.tsx               — Thin route wrapper (~40 lines, down from 1282)
app/(tabs)/index.tsx             — Screen shell (~120 lines, down from 563)
app/(tabs)/progress.tsx          — Screen shell (~100 lines, down from 437)
src/hooks/useLessonQuiz.ts       — Typed inputs/outputs (lesson: any → Lesson)
```

---

## Task 1: Define Shared Types

**Files:**
- Create: `src/types/lesson.ts`
- Create: `src/types/mastery.ts`
- Create: `src/types/progress.ts`
- Create: `src/types/onboarding.ts`
- Existing: `src/types/quiz.ts` (already done in Wave 1)

These types are needed by every subsequent task. Defining them first prevents duplication.

- [ ] **Step 1: Create `src/types/lesson.ts`**

Derive the `Lesson` type from the actual shape in `src/data/lessons.js`:

```typescript
// src/types/lesson.ts

export interface Lesson {
  id: number;
  phase: number;
  lessonMode: string;
  lessonType?: string;
  module: string;
  moduleTitle?: string;
  title: string;
  description: string;
  teachIds: number[];
  reviewIds: number[];
  familyRule?: string;
  hasSpeaking?: boolean;
  // Hybrid lesson fields
  hybridSteps?: any[];
}
```

- [ ] **Step 2: Create `src/types/mastery.ts`**

Re-export the types already defined in `src/engine/progress.ts` so consumers import from `src/types/`:

```typescript
// src/types/mastery.ts

export type {
  EntityState,
  SkillState,
  ConfusionState,
} from '../engine/progress';

export interface MasteryState {
  entities: Record<string, import('../engine/progress').EntityState>;
  skills: Record<string, import('../engine/progress').SkillState>;
  confusions: Record<string, import('../engine/progress').ConfusionState>;
}
```

- [ ] **Step 3: Create `src/types/progress.ts`**

Re-export `ProgressState` and `HabitState`:

```typescript
// src/types/progress.ts

export type {
  ProgressState,
  HabitState,
} from '../engine/progress';
```

- [ ] **Step 4: Create `src/types/onboarding.ts`**

```typescript
// src/types/onboarding.ts

export interface OnboardingDraft {
  startingPoint: 'new' | 'some_arabic' | 'rusty' | 'can_read' | null;
}
```

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No new errors from the type files.

- [ ] **Step 6: Commit**

```bash
git add src/types/lesson.ts src/types/mastery.ts src/types/progress.ts src/types/onboarding.ts
git commit -m "feat: add shared type definitions for lesson, mastery, progress, onboarding"
```

---

## Task 2: Split LessonQuiz (693 → ~150 + children)

**Files:**
- Create: `src/components/quiz/QuizProgress.tsx`
- Create: `src/components/quiz/QuizQuestion.tsx`
- Create: `src/components/quiz/QuizCelebration.tsx`
- Create: `src/components/quiz/WrongAnswerPanel.tsx`
- Modify: `src/components/LessonQuiz.tsx`
- Modify: `src/hooks/useLessonQuiz.ts`

### Sub-task 2a: Extract QuizProgress

- [ ] **Step 1: Create `src/components/quiz/QuizProgress.tsx`**

Extract the progress bar, counter, recycled hint, and streak banner into a pure presentational component:

```typescript
// src/components/quiz/QuizProgress.tsx
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import { useColors } from '../../design/theme';
import { typography, spacing, radii } from '../../design/tokens';

const STREAK_MILESTONES = [3, 5, 7] as const;

function getStreakMessage(streak: number): string {
  if (streak >= 7) return 'Unstoppable! \uD83D\uDD25';
  if (streak >= 5) return 'On fire! \u2B50';
  return 'Nice streak! \u2728';
}

interface QuizProgressProps {
  questionIndex: number;
  totalQuestions: number;
  originalQCount: number;
  progressPct: number;
  streak: number;
  isRecycled: boolean;
}

export function QuizProgress({
  questionIndex,
  totalQuestions,
  originalQCount,
  progressPct,
  streak,
  isRecycled,
}: QuizProgressProps) {
  const colors = useColors();
  const [bannerStreak, setBannerStreak] = useState<number | null>(null);
  const prevStreakRef = useRef(0);

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withSpring(progressPct, {
      stiffness: 120,
      damping: 20,
    });
  }, [progressPct, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Streak banner detection
  useEffect(() => {
    if (
      streak > prevStreakRef.current &&
      STREAK_MILESTONES.includes(streak as 3 | 5 | 7)
    ) {
      setBannerStreak(streak);
      const timer = setTimeout(() => setBannerStreak(null), 1500);
      return () => clearTimeout(timer);
    }
    prevStreakRef.current = streak;
  }, [streak]);

  return (
    <>
      {/* Streak banner overlay */}
      {bannerStreak !== null && (
        <Animated.View
          entering={SlideInDown.springify().stiffness(300).damping(20)}
          exiting={SlideOutUp.duration(300)}
          style={[
            styles.streakBanner,
            { backgroundColor: colors.accentLight, borderColor: colors.accent },
          ]}
        >
          <Text style={[styles.streakText, { color: colors.accent }]}>
            {bannerStreak} in a row! {getStreakMessage(bannerStreak)}
          </Text>
        </Animated.View>
      )}

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(progressPct),
          }}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary },
              progressBarStyle,
            ]}
          />
        </View>
        <Text style={[styles.progressCounter, { color: colors.textSoft }]}>
          {Math.min(questionIndex + 1, originalQCount)}/{originalQCount}
        </Text>
      </View>

      {/* Recycled question hint */}
      {isRecycled && (
        <Text style={[styles.recycledHint, { color: colors.textMuted }]}>
          Review -- missed questions come back once
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressCounter: {
    ...typography.caption,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  recycledHint: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  streakBanner: {
    position: 'absolute',
    top: spacing.xxxl,
    left: spacing.xl,
    right: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: 'center',
    zIndex: 100,
  },
  streakText: {
    ...typography.bodyLarge,
    fontWeight: '700',
  },
});
```

Note: Add `import { useState } from 'react';` to the imports.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

### Sub-task 2b: Extract QuizCelebration

- [ ] **Step 3: Create `src/components/quiz/QuizCelebration.tsx`**

```typescript
// src/components/quiz/QuizCelebration.tsx
import { Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useColors } from '../../design/theme';
import { typography, spacing } from '../../design/tokens';

interface QuizCelebrationProps {
  onDismiss: () => void;
}

export function QuizCelebration({ onDismiss }: QuizCelebrationProps) {
  const colors = useColors();

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[styles.overlay, { backgroundColor: `${colors.bg}E6` }]}
    >
      <Pressable onPress={onDismiss} style={styles.content}>
        <Text style={styles.emoji}>{'\uD83C\uDF1F'}</Text>
        <Text style={[styles.title, { color: colors.primary }]}>Keep going!</Text>
        <Text style={[styles.subtitle, { color: colors.textSoft }]}>
          You're halfway there
        </Text>
        <Text style={[styles.tap, { color: colors.textMuted }]}>Tap to continue</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  content: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  tap: {
    ...typography.caption,
  },
});
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`

### Sub-task 2c: Extract WrongAnswerPanel

- [ ] **Step 5: Create `src/components/quiz/WrongAnswerPanel.tsx`**

```typescript
// src/components/quiz/WrongAnswerPanel.tsx
import { View, Text, StyleSheet } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useColors } from '../../design/theme';
import { typography, spacing, radii } from '../../design/tokens';
import { ArabicText, Button, HearButton } from '../../design/components';

interface WrongAnswerPanelProps {
  explanation: string | null;
  correctLetter: { letter: string; name: string } | null;
  chosenLetter: { letter: string; name: string } | null;
  isSoundQuestion: boolean;
  onPlayCorrect: () => void;
  onContinue: () => void;
}

export function WrongAnswerPanel({
  explanation,
  correctLetter,
  chosenLetter,
  isSoundQuestion,
  onPlayCorrect,
  onContinue,
}: WrongAnswerPanelProps) {
  const colors = useColors();

  const displayExplanation =
    explanation ??
    (correctLetter
      ? `The correct answer is ${correctLetter.name} (${correctLetter.letter})`
      : 'Not quite -- try again next time!');

  return (
    <Animated.View
      entering={SlideInDown.springify().stiffness(300).damping(25)}
      style={[styles.panel, { backgroundColor: colors.dangerLight }]}
    >
      {/* Explanation */}
      <View style={styles.explanationRow}>
        <Text style={[styles.icon, { color: colors.danger }]}>{'\u2717'}</Text>
        <Text style={[styles.explanation, { color: colors.dangerDark }]}>
          {displayExplanation}
        </Text>
      </View>

      {/* Visual comparison: chosen vs correct */}
      {chosenLetter && correctLetter && !isSoundQuestion && (
        <View style={styles.compareRow}>
          <View style={styles.compareItem}>
            <ArabicText size="large" color={colors.danger}>
              {chosenLetter.letter}
            </ArabicText>
            <Text style={[styles.compareName, { color: colors.dangerDark }]}>
              {chosenLetter.name}
            </Text>
          </View>
          <Text style={[styles.compareArrow, { color: colors.textMuted }]}>
            {'\u2192'}
          </Text>
          <View style={styles.compareItem}>
            <ArabicText size="large" color={colors.primary}>
              {correctLetter.letter}
            </ArabicText>
            <Text style={[styles.compareName, { color: colors.primary }]}>
              {correctLetter.name}
            </Text>
          </View>
        </View>
      )}

      {/* Hear buttons for sound questions */}
      {isSoundQuestion && (
        <View style={styles.hearRow}>
          <HearButton
            onPlay={onPlayCorrect}
            size={40}
            accessibilityLabel="Hear correct answer"
          />
          <Text style={[styles.hearLabel, { color: colors.dangerDark }]}>
            Hear correct
          </Text>
        </View>
      )}

      {/* Continue button */}
      <Button title="Got It" onPress={onContinue} variant="primary" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  explanationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 1,
  },
  explanation: {
    ...typography.bodySmall,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.sm,
  },
  compareItem: {
    alignItems: 'center',
  },
  compareName: {
    ...typography.caption,
    fontWeight: '700',
  },
  compareArrow: {
    ...typography.body,
  },
  hearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hearLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
```

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`

### Sub-task 2d: Extract QuizQuestion

- [ ] **Step 7: Create `src/components/quiz/QuizQuestion.tsx`**

```typescript
// src/components/quiz/QuizQuestion.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useColors } from '../../design/theme';
import { typography, spacing, radii } from '../../design/tokens';
import { QuizOption, ArabicText, HearButton } from '../../design/components';

interface QuizQuestionProps {
  question: any; // TODO: type with Question discriminated union in future
  selectedId: number | null;
  answered: boolean;
  isCorrect: boolean;
  onSelect: (optionId: number) => void;
  onPlayAudio: () => void;
}

export function QuizQuestion({
  question,
  selectedId,
  answered,
  isCorrect,
  onSelect,
  onPlayAudio,
}: QuizQuestionProps) {
  const colors = useColors();

  const isSoundQuestion =
    question.type === 'audio_to_letter' ||
    question.type === 'letter_to_sound' ||
    question.type === 'contrast_audio';

  const isAudioQuestion = question.hasAudio;
  const isLetterToSound = question.type === 'letter_to_sound';
  const isLetterToName =
    question.type === 'letter_to_name' && !question.hasAudio;
  const isVisualQuestion =
    !isAudioQuestion && !isLetterToSound && !isLetterToName;

  const isArabicOption =
    question.optionMode !== 'sound' &&
    question.type !== 'letter_to_name';

  return (
    <View style={styles.questionArea}>
      {/* Audio question: show hear button + prompt */}
      {isAudioQuestion && !isLetterToSound && (
        <View style={styles.promptCenter}>
          <HearButton onPlay={onPlayAudio} size={72} />
          <Text
            style={[
              styles.promptText,
              { color: colors.text, marginTop: spacing.lg },
            ]}
          >
            {question.prompt}
          </Text>
          <Pressable onPress={onPlayAudio} style={styles.replayButton}>
            <Text style={[styles.replayText, { color: colors.primary }]}>
              Replay
            </Text>
          </Pressable>
        </View>
      )}

      {/* Letter to sound: show large Arabic letter + hear button */}
      {isLetterToSound && (
        <View style={styles.promptCenter}>
          <ArabicText size="display" color={colors.text}>
            {question.prompt}
          </ArabicText>
          {question.promptSubtext && (
            <Text style={[styles.promptSubtext, { color: colors.textSoft }]}>
              {question.promptSubtext}
            </Text>
          )}
          <View style={{ marginTop: spacing.sm }}>
            <HearButton
              onPlay={onPlayAudio}
              size={44}
              accessibilityLabel="Hear this letter"
            />
          </View>
        </View>
      )}

      {/* Letter to name: show large Arabic letter + prompt */}
      {isLetterToName && (
        <View style={styles.promptCenter}>
          <ArabicText size="display" color={colors.text}>
            {question.prompt}
          </ArabicText>
          {question.promptSubtext && (
            <Text style={[styles.promptSubtext, { color: colors.textSoft }]}>
              {question.promptSubtext}
            </Text>
          )}
        </View>
      )}

      {/* Visual / default question: show prompt text */}
      {isVisualQuestion && (
        <View style={styles.promptCenter}>
          <Text style={[styles.promptText, { color: colors.text }]}>
            {question.prompt}
          </Text>
        </View>
      )}

      {/* Answer options -- 2x2 grid */}
      <View style={styles.optionsGrid}>
        {question.options.map((opt: any) => {
          let optionState: 'default' | 'correct' | 'wrong' | 'dimmed' = 'default';
          if (answered) {
            if (opt.id === selectedId && isCorrect) {
              optionState = 'correct';
            } else if (opt.id === selectedId && !isCorrect) {
              optionState = 'wrong';
            } else if (opt.isCorrect && !isCorrect) {
              optionState = 'correct';
            } else {
              optionState = 'dimmed';
            }
          }

          return (
            <QuizOption
              key={opt.id}
              label={opt.label}
              isArabic={isArabicOption}
              onPress={() => onSelect(opt.id)}
              disabled={answered}
              state={optionState}
              style={styles.optionCell}
            />
          );
        })}
      </View>

      {/* Correct feedback message */}
      {answered && isCorrect && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            styles.correctFeedback,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.correctFeedbackText, { color: colors.primary }]}>
            {'\u2713'} Correct!
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  questionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptCenter: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  promptText: {
    ...typography.bodyLarge,
    fontWeight: '700',
    textAlign: 'center',
  },
  promptSubtext: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  replayButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  replayText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    width: '100%',
    maxWidth: 340,
  },
  optionCell: {
    width: '47%',
  },
  correctFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    borderWidth: 1.5,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  correctFeedbackText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
});
```

- [ ] **Step 8: Verify it compiles**

Run: `npx tsc --noEmit`

### Sub-task 2e: Rewrite LessonQuiz as thin orchestrator

- [ ] **Step 9: Rewrite `src/components/LessonQuiz.tsx` as orchestrator**

Replace the entire file content. The orchestrator imports the child components and manages local UI state (selectedId, answered, isCorrect) and audio players. It delegates rendering to the child components:

```typescript
// src/components/LessonQuiz.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useColors } from '../design/theme';
import { typography, spacing } from '../design/tokens';
import { getSFXAsset, getLetterAsset } from '../audio/player';
import { getLetter } from '../data/letters';
import useLessonQuiz, { computeQuizProgress } from '../hooks/useLessonQuiz';
import { QuizProgress } from './quiz/QuizProgress';
import { QuizQuestion } from './quiz/QuizQuestion';
import { QuizCelebration } from './quiz/QuizCelebration';
import { WrongAnswerPanel } from './quiz/WrongAnswerPanel';
import type { Lesson } from '../types/lesson';
import type { MasteryState } from '../types/mastery';

interface LessonQuizProps {
  lesson: Lesson;
  completedLessonIds: number[];
  mastery: MasteryState;
  onComplete: (results: { correct: number; total: number; questions: any[] }) => void;
}

export function LessonQuiz({
  lesson,
  completedLessonIds,
  mastery,
  onComplete,
}: LessonQuizProps) {
  const colors = useColors();

  const {
    currentQuestion,
    questionIndex,
    totalQuestions,
    streak,
    showMidCelebrate,
    dismissMidCelebrate,
    handleAnswer,
    isComplete,
    results,
  } = useLessonQuiz(lesson, completedLessonIds, mastery);

  // Local UI state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Progress tracking
  const originalQCount = useRef(totalQuestions);
  useEffect(() => {
    if (totalQuestions > 0 && originalQCount.current === 0) {
      originalQCount.current = totalQuestions;
    }
  }, [totalQuestions]);

  const progressPct = computeQuizProgress(
    questionIndex,
    totalQuestions,
    originalQCount.current
  );

  // Audio players
  const correctSFX = useAudioPlayer(getSFXAsset('correct'));
  const wrongSFX = useAudioPlayer(getSFXAsset('wrong'));

  const isSoundQuestion =
    currentQuestion?.type === 'audio_to_letter' ||
    currentQuestion?.type === 'letter_to_sound' ||
    currentQuestion?.type === 'contrast_audio';

  const audioType: 'sound' | 'name' = isSoundQuestion ? 'sound' : 'name';

  const targetAudioSource =
    currentQuestion?.hasAudio && currentQuestion?.targetId
      ? getLetterAsset(currentQuestion.targetId, audioType)
      : null;
  const targetPlayer = useAudioPlayer(targetAudioSource);

  const playTargetAudio = useCallback(async () => {
    if (targetPlayer) {
      await targetPlayer.seekTo(0);
      targetPlayer.play();
    }
  }, [targetPlayer]);

  // Notify parent when quiz completes
  useEffect(() => {
    if (isComplete) {
      onComplete(results);
    }
  }, [isComplete, results, onComplete]);

  // Reset selection state when question changes
  useEffect(() => {
    setSelectedId(null);
    setAnswered(false);
    setIsCorrect(false);
  }, [questionIndex]);

  const handleSelect = useCallback(
    (optionId: number) => {
      if (answered || !currentQuestion) return;

      setSelectedId(optionId);
      setAnswered(true);

      const opt = currentQuestion.options.find((o: any) => o.id === optionId);
      const correct = opt?.isCorrect === true;
      setIsCorrect(correct);

      if (correct) {
        correctSFX.seekTo(0);
        correctSFX.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          handleAnswer(opt, true);
        }, 800);
      } else {
        wrongSFX.seekTo(0);
        wrongSFX.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [answered, currentQuestion, correctSFX, wrongSFX, handleAnswer]
  );

  const handleContinueAfterWrong = useCallback(() => {
    if (!currentQuestion) return;
    const opt = currentQuestion.options.find(
      (o: any) => o.id === selectedId
    );
    handleAnswer(opt, false);
  }, [currentQuestion, selectedId, handleAnswer]);

  // Loading state
  if (!currentQuestion) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.loadingText, { color: colors.textSoft }]}>
          Loading question...
        </Text>
      </View>
    );
  }

  const correctLetter = currentQuestion.targetId
    ? getLetter(currentQuestion.targetId)
    : null;
  const chosenLetter =
    selectedId && selectedId !== currentQuestion.targetId
      ? getLetter(selectedId)
      : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <QuizProgress
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        originalQCount={originalQCount.current}
        progressPct={progressPct}
        streak={streak}
        isRecycled={!!currentQuestion._recycled}
      />

      {showMidCelebrate && (
        <QuizCelebration onDismiss={dismissMidCelebrate} />
      )}

      <QuizQuestion
        question={currentQuestion}
        selectedId={selectedId}
        answered={answered}
        isCorrect={isCorrect}
        onSelect={handleSelect}
        onPlayAudio={playTargetAudio}
      />

      {answered && !isCorrect && (
        <WrongAnswerPanel
          explanation={currentQuestion.explanation ?? null}
          correctLetter={correctLetter}
          chosenLetter={chosenLetter}
          isSoundQuestion={!!isSoundQuestion}
          onPlayCorrect={playTargetAudio}
          onContinue={handleContinueAfterWrong}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  loadingText: {
    ...typography.body,
    textAlign: 'center',
  },
});
```

- [ ] **Step 10: Verify it compiles and test the app**

Run: `npx tsc --noEmit`
Run: `npm test`
Expected: All existing tests pass, no type errors.

- [ ] **Step 11: Commit**

```bash
git add src/components/quiz/ src/components/LessonQuiz.tsx
git commit -m "refactor: split LessonQuiz into QuizProgress, QuizQuestion, QuizCelebration, WrongAnswerPanel"
```

---

## Task 3: Split Onboarding (1282 → ~40 + orchestrator + 8 steps)

**Files:**
- Create: `src/components/onboarding/OnboardingFlow.tsx`
- Create: `src/components/onboarding/OnboardingStepLayout.tsx`
- Create: `src/components/onboarding/steps/Welcome.tsx`
- Create: `src/components/onboarding/steps/Tilawat.tsx`
- Create: `src/components/onboarding/steps/Hadith.tsx`
- Create: `src/components/onboarding/steps/StartingPoint.tsx`
- Create: `src/components/onboarding/steps/LetterReveal.tsx`
- Create: `src/components/onboarding/steps/LetterAudio.tsx`
- Create: `src/components/onboarding/steps/LetterQuiz.tsx`
- Create: `src/components/onboarding/steps/Finish.tsx`
- Modify: `app/onboarding.tsx`

### Sub-task 3a: Create shared layout and helper components

- [ ] **Step 1: Create `src/components/onboarding/OnboardingStepLayout.tsx`**

Shared scaffold for every step — consistent padding, transition animation wrapper:

```typescript
// src/components/onboarding/OnboardingStepLayout.tsx
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { spacing } from '../../design/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingStepLayoutProps {
  variant: 'splash' | 'centered' | 'card';
  fadeInDuration?: number;
  children: React.ReactNode;
}

export function OnboardingStepLayout({
  variant,
  fadeInDuration = 600,
  children,
}: OnboardingStepLayoutProps) {
  const style =
    variant === 'splash'
      ? styles.splashStep
      : variant === 'centered'
        ? styles.centeredStep
        : styles.cardStep;

  return (
    <Animated.View entering={FadeIn.duration(fadeInDuration)} style={style}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashStep: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SCREEN_HEIGHT * 0.15,
    paddingBottom: spacing.xxxl,
  },
  centeredStep: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  cardStep: {
    alignItems: 'stretch',
    paddingVertical: spacing.xxxl,
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

### Sub-task 3b: Extract each step component

For each step, create a file that receives `onNext` callback and renders its content. The step does NOT know about step indices or other steps.

- [ ] **Step 3: Create `src/components/onboarding/steps/Welcome.tsx`**

Extract Step 0 (lines 452-509 of current onboarding.tsx). The component receives `onNext` and `colors`. Includes the `LogoMark`, `WarmGlow`, app name, brand motto, tagline, and CTA button. Move `LogoMark` and `WarmGlow` as local components in this file (they're only used here and on a couple of other steps — `WarmGlow` is also used in Tilawat, Hadith, and LetterReveal, so extract it to a shared file `src/components/onboarding/WarmGlow.tsx`).

```typescript
// src/components/onboarding/WarmGlow.tsx
import { View } from 'react-native';

export function WarmGlow({ size = 340, opacity = 0.12 }: { size?: number; opacity?: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `rgba(196, 164, 100, ${opacity})`,
      }}
    />
  );
}
```

```typescript
// src/components/onboarding/steps/Welcome.tsx
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useColors } from '../../../design/theme';
import { typography, spacing, fontFamilies } from '../../../design/tokens';
import { Button } from '../../../design/components';
import { OnboardingStepLayout } from '../OnboardingStepLayout';
import { WarmGlow } from '../WarmGlow';

function LogoMark({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <Svg width={120} height={160} viewBox="0 0 120 160" fill="none">
      <Path d="M24 148 L24 68 Q24 8 60 2 Q96 8 96 68 L96 148" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      <Path d="M34 148 L34 72 Q34 20 60 12 Q86 20 86 72 L86 148" stroke={colors.primary} strokeWidth={0.8} opacity={0.2} />
      <Circle cx={60} cy={2} r={3} fill={colors.accent} opacity={0.8} />
      <Circle cx={24} cy={148} r={1.5} fill={colors.primary} opacity={0.25} />
      <Circle cx={96} cy={148} r={1.5} fill={colors.primary} opacity={0.25} />
      <Circle cx={60} cy={62} r={32} fill={colors.primary} />
      <Circle cx={71} cy={52} r={26} fill={colors.bgWarm} />
      <Circle cx={38} cy={30} r={2} fill={colors.primary} opacity={0.35} />
      <Circle cx={85} cy={36} r={1.6} fill={colors.primary} opacity={0.3} />
      <Circle cx={78} cy={22} r={1.3} fill={colors.primary} opacity={0.25} />
    </Svg>
  );
}

interface WelcomeProps {
  onNext: () => void;
}

export function Welcome({ onNext }: WelcomeProps) {
  const colors = useColors();

  return (
    <OnboardingStepLayout variant="splash" fadeInDuration={800}>
      <WarmGlow size={360} opacity={0.12} />
      <Animated.View entering={FadeIn.delay(200).duration(1200)} style={{ marginBottom: 32, zIndex: 1 }}>
        <LogoMark colors={colors} />
      </Animated.View>
      <Animated.Text
        entering={FadeInDown.delay(800).duration(800)}
        style={[styles.appName, { color: colors.text, fontFamily: fontFamilies.headingRegular, zIndex: 1 }]}
      >
        tila
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(1100).duration(700)} style={[styles.brandMotto, { color: colors.accent, zIndex: 1 }]}>
        READ BEAUTIFULLY
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(1500).duration(800)} style={[styles.tagline, { color: colors.textSoft, zIndex: 1 }]}>
        Learn to read the Quran,{'\n'}one letter at a time.
      </Animated.Text>
      <View style={{ height: spacing.xxxl }} />
      <Animated.View entering={FadeInUp.delay(1800).duration(600)} style={[styles.fullWidthBtn, { zIndex: 1 }]}>
        <Button title="Get Started" onPress={onNext} style={styles.fullWidthBtn} />
      </Animated.View>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  appName: { fontSize: 44, letterSpacing: 5.3, textAlign: 'center', lineHeight: 52 },
  brandMotto: {
    fontSize: 11, fontFamily: fontFamilies.bodySemiBold, letterSpacing: 2,
    textTransform: 'uppercase', textAlign: 'center', marginTop: 8, marginBottom: 24,
  },
  tagline: { ...typography.body, fontSize: 16, lineHeight: 26, textAlign: 'center', maxWidth: 260 },
  fullWidthBtn: { width: '100%' },
});
```

- [ ] **Step 4: Create remaining step components**

Create each step file following the same pattern (receives `onNext`, uses `OnboardingStepLayout`, renders step-specific content):

**`src/components/onboarding/steps/Tilawat.tsx`** — Step 1: Arabic calligraphy "تِلاوَة", tilawat meaning, motto. Receives `onNext`.

**`src/components/onboarding/steps/Hadith.tsx`** — Step 2: Hadith quote. Receives `onNext`. Includes `ArchOutline` as a local component.

**`src/components/onboarding/steps/StartingPoint.tsx`** — Step 3: 4 experience level options. Receives `onNext`, `startingPoint`, `onSelectStartingPoint`. Includes `OptionCard` as local component.

**`src/components/onboarding/steps/LetterReveal.tsx`** — Step 4: Large Alif display. Receives no `onNext` (auto-advances). Parent handles the 3.5s timer.

**`src/components/onboarding/steps/LetterAudio.tsx`** — Step 5: Alif with audio playback. Receives `onNext`, `onPlayAudio`, `hasPlayedAudio`.

**`src/components/onboarding/steps/LetterQuiz.tsx`** — Step 6: "Which one is Alif?" quiz. Receives `onNext`. Manages its own `selectedAnswer`, `answerChecked`, `isCorrect` state.

**`src/components/onboarding/steps/Finish.tsx`** — Step 7: Completion screen. Receives `onFinish`, `finishing`, `finishError`.

Each step must contain the COMPLETE content from the original file — not summaries. Copy the exact JSX, styles, and logic from the original `app/onboarding.tsx` for each step range. The styles that were in the monolithic file get moved into each step's local `StyleSheet.create()`.

- [ ] **Step 5: Verify all step files compile**

Run: `npx tsc --noEmit`

### Sub-task 3c: Create OnboardingFlow orchestrator

- [ ] **Step 6: Create `src/components/onboarding/OnboardingFlow.tsx`**

This is the orchestrator that owns the step index, `OnboardingDraft`, floating letters, progress bar visibility, audio players, and step transitions. It renders the current step component based on `step` state:

```typescript
// src/components/onboarding/OnboardingFlow.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useProgress } from '../../hooks/useProgress';
import { useColors } from '../../design/theme';
import { spacing } from '../../design/tokens';
import { getLetterAsset, getSFXAsset } from '../../audio/player';
import { FloatingLettersLayer } from './FloatingLettersLayer';
import { ProgressBar } from './ProgressBar';
import { Welcome } from './steps/Welcome';
import { Tilawat } from './steps/Tilawat';
import { Hadith } from './steps/Hadith';
import { StartingPoint } from './steps/StartingPoint';
import { LetterReveal } from './steps/LetterReveal';
import { LetterAudio } from './steps/LetterAudio';
import { LetterQuiz } from './steps/LetterQuiz';
import { Finish } from './steps/Finish';
import type { OnboardingDraft } from '../../types/onboarding';

const TOTAL_STEPS = 8;

export function OnboardingFlow() {
  const colors = useColors();
  const { updateProfile } = useProgress();

  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft>({ startingPoint: null });
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const letterRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio players
  const alifNameAsset = getLetterAsset(1, 'name');
  const alifPlayer = useAudioPlayer(alifNameAsset);
  const advanceSfx = useAudioPlayer(getSFXAsset('onboarding_advance'));
  const completeSfx = useAudioPlayer(getSFXAsset('onboarding_complete'));

  function goNext() {
    advanceSfx.seekTo(0);
    advanceSfx.play();
    setStep((s) => s + 1);
  }

  // Letter reveal auto-advance (step 4 -> step 5 after 3.5s)
  useEffect(() => {
    if (step === 4) {
      letterRevealTimerRef.current = setTimeout(() => {
        setStep(5);
      }, 3500);
      return () => {
        if (letterRevealTimerRef.current) clearTimeout(letterRevealTimerRef.current);
      };
    }
  }, [step]);

  const handlePlayAudio = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    alifPlayer.seekTo(0);
    alifPlayer.play();
    setHasPlayedAudio(true);
  }, [alifPlayer]);

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    try { completeSfx.play(); } catch {}

    try {
      await updateProfile({
        onboarded: true,
        onboardingVersion: 2,
        startingPoint: draft.startingPoint,
        commitmentComplete: true,
      });
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (err) {
      console.error('Failed to save onboarding profile:', err);
      setFinishing(false);
      setFinishError(true);
    }
  }

  // Progress bar visibility: hidden on welcome (0), letter reveal (4), and quiz (6)
  const showProgressBar = step > 0 && step !== 4 && step !== 6 && step < 7;

  // Fade-out opacity when finishing
  const fadeOpacity = useSharedValue(1);
  useEffect(() => {
    if (finishing) {
      fadeOpacity.value = withTiming(0, { duration: 400 });
    }
  }, [finishing]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeOpacity.value }));

  return (
    <Animated.View style={[styles.root, { backgroundColor: colors.bgWarm }, fadeStyle]}>
      {step <= 2 && <FloatingLettersLayer color={colors.primary} />}

      {showProgressBar && (
        <View style={styles.progressContainer}>
          <ProgressBar current={step} total={TOTAL_STEPS} colors={colors} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        {step === 0 && <Welcome onNext={goNext} />}
        {step === 1 && <Tilawat onNext={goNext} />}
        {step === 2 && <Hadith onNext={goNext} />}
        {step === 3 && (
          <StartingPoint
            startingPoint={draft.startingPoint}
            onSelectStartingPoint={(sp) => setDraft({ ...draft, startingPoint: sp })}
            onNext={goNext}
          />
        )}
        {step === 4 && <LetterReveal />}
        {step === 5 && (
          <LetterAudio onNext={goNext} onPlayAudio={handlePlayAudio} hasPlayedAudio={hasPlayedAudio} />
        )}
        {step === 6 && <LetterQuiz onNext={goNext} />}
        {step === 7 && (
          <Finish onFinish={handleFinish} finishing={finishing} finishError={finishError} />
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  progressContainer: {
    paddingTop: 56, paddingHorizontal: 20,
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 24, paddingBottom: 48,
  },
});
```

Also extract `FloatingLettersLayer` and `ProgressBar` into their own files in `src/components/onboarding/`:

**`src/components/onboarding/FloatingLettersLayer.tsx`** — Move the `floatingLetters` data array, `FloatingLetter` component, and `FloatingLettersLayer` component.

**`src/components/onboarding/ProgressBar.tsx`** — Move the `ProgressBar` component and its styles.

- [ ] **Step 7: Rewrite `app/onboarding.tsx` as thin route wrapper**

```typescript
// app/onboarding.tsx
import { OnboardingFlow } from '../src/components/onboarding/OnboardingFlow';

export default function OnboardingScreen() {
  return <OnboardingFlow />;
}
```

- [ ] **Step 8: Verify it compiles and existing tests pass**

Run: `npx tsc --noEmit`
Run: `npm test`
Expected: All tests pass. No type errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/onboarding/ app/onboarding.tsx
git commit -m "refactor: split onboarding into OnboardingFlow orchestrator with 8 step components"
```

---

## Task 4: Split Home Screen (563 → ~120 + children)

**Files:**
- Create: `src/components/home/HeroCard.tsx`
- Create: `src/components/home/LessonGrid.tsx`
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Create `src/components/home/HeroCard.tsx`**

Extract the hero card section (lines 184-224 of current index.tsx):

```typescript
// src/components/home/HeroCard.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../design/theme';
import { spacing, radii, fontFamilies } from '../../design/tokens';
import { ArabicText, Button, Card } from '../../design/components';
import { getLetter } from '../../data/letters';
import type { Lesson } from '../../types/lesson';

const PHASE_LABELS: Record<number, string> = {
  1: 'Letter Recognition',
  2: 'Letter Sounds',
  3: 'Harakat (Vowels)',
  4: 'Connected Forms',
};

interface HeroCardProps {
  lesson: Lesson | null;
  allDone: boolean;
  completedLessonIds: number[];
  lessonsCompleted: number;
  currentPhase: number;
  onStartLesson: (lessonId: number) => void;
}

export function HeroCard({
  lesson,
  allDone,
  completedLessonIds,
  lessonsCompleted,
  currentPhase,
  onStartLesson,
}: HeroCardProps) {
  const colors = useColors();
  const phaseLabel = `Phase ${currentPhase} — ${PHASE_LABELS[currentPhase] ?? ''}`;

  if (allDone || !lesson) {
    return (
      <Card elevated style={styles.heroCard}>
        <Text style={[styles.heroTitle, { color: colors.text }]}>All lessons complete!</Text>
        <Text style={[styles.heroDescription, { color: colors.textMuted }]}>
          You have completed all available lessons. Keep reviewing to strengthen your knowledge.
        </Text>
      </Card>
    );
  }

  const heroLetters = (lesson.teachIds || []).map((id: number) => getLetter(id)).filter(Boolean);
  const heroLetter = heroLetters[0];

  return (
    <Card elevated style={styles.heroCard}>
      <View style={[styles.phasePill, { backgroundColor: colors.bg }]}>
        <Text style={[styles.phasePillText, { color: colors.accent }]}>{phaseLabel}</Text>
      </View>
      <View style={[styles.letterCircle, { backgroundColor: colors.primarySoft }]}>
        <ArabicText size="display" color={colors.text}>
          {heroLetter ? heroLetter.letter : '?'}
        </ArabicText>
      </View>
      <Text style={[styles.heroTitle, { color: colors.text }]}>{lesson.title}</Text>
      <Text style={[styles.heroDescription, { color: colors.textMuted }]}>
        {lesson.description}
      </Text>
      <Button
        title={
          completedLessonIds.includes(lesson.id)
            ? 'Review Lesson'
            : lessonsCompleted > 0
              ? 'Continue Lesson'
              : 'Start Lesson'
        }
        onPress={() => onStartLesson(lesson.id)}
        style={styles.heroButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    borderRadius: radii.xl,
    paddingVertical: spacing.xxl,
  },
  phasePill: {
    paddingVertical: 4, paddingHorizontal: 12,
    borderRadius: 9999, marginBottom: spacing.lg,
  },
  phasePillText: {
    fontSize: 10, fontFamily: fontFamilies.bodyBold,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  letterCircle: {
    width: 112, height: 112, borderRadius: 56,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  heroTitle: {
    fontFamily: fontFamilies.headingSemiBold, fontSize: 22,
    textAlign: 'center', marginBottom: spacing.sm,
  },
  heroDescription: {
    fontSize: 14, fontFamily: fontFamilies.bodyRegular,
    textAlign: 'center', lineHeight: 22,
    marginBottom: spacing.xxl, paddingHorizontal: spacing.sm,
  },
  heroButton: { width: '100%' },
});
```

- [ ] **Step 2: Create `src/components/home/LessonGrid.tsx`**

Extract the journey path section (lines 227-365 of current index.tsx). Include the `CheckIcon`, `LockIcon`, `ArrowIcon` helpers and all node rendering logic:

```typescript
// src/components/home/LessonGrid.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useColors } from '../../design/theme';
import { spacing, radii, shadows, fontFamilies } from '../../design/tokens';
import { ArabicText } from '../../design/components';
import { getLetter } from '../../data/letters';
import { LESSONS } from '../../data/lessons';
import { isLessonUnlocked } from '../../engine/unlock';
import type { Lesson } from '../../types/lesson';
import type { MasteryState } from '../../types/mastery';

const PHASE_LABELS: Record<number, string> = {
  1: 'Letter Recognition',
  2: 'Letter Sounds',
  3: 'Harakat (Vowels)',
  4: 'Connected Forms',
};

const OFFSETS = [4, 16, 8, -4, -12, 0];

function CheckIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 14, color = '#6B6760' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

interface LessonGridProps {
  currentPhase: number;
  nextLessonId: number | null;
  completedLessonIds: number[];
  mastery: MasteryState;
  today: string;
  onStartLesson: (lessonId: number) => void;
}

export function LessonGrid({
  currentPhase,
  nextLessonId,
  completedLessonIds,
  mastery,
  today,
  onStartLesson,
}: LessonGridProps) {
  const colors = useColors();
  const phaseLabel = `Phase ${currentPhase} — ${PHASE_LABELS[currentPhase] ?? ''}`;
  const currentPhaseLessons = LESSONS.filter((l) => l.phase === currentPhase);

  return (
    <View style={styles.journeySection}>
      <Text style={[styles.journeySectionTitle, { color: colors.textMuted }]}>
        {phaseLabel.toUpperCase()}
      </Text>

      <View style={styles.journeyPath}>
        <View style={[styles.connectorLine, { borderColor: colors.border }]} />

        {currentPhaseLessons.map((lesson, i) => {
          const globalIndex = LESSONS.findIndex((l) => l.id === lesson.id);
          const complete = completedLessonIds.includes(lesson.id);
          const isCurrent = lesson.id === nextLessonId;
          const unlocked = isLessonUnlocked(
            globalIndex,
            completedLessonIds,
            mastery?.entities || {},
            today
          );
          const locked = !complete && !isCurrent && !unlocked;
          const letters = (lesson.teachIds || []).map((id: number) => getLetter(id));
          const firstLetter = letters[0];
          const offset = OFFSETS[i % OFFSETS.length];

          return (
            <Pressable
              key={lesson.id}
              onPress={() => { if (!locked) onStartLesson(lesson.id); }}
              disabled={locked}
              style={[
                styles.nodeRow,
                {
                  transform: [{ translateX: offset }],
                  opacity: locked ? 0.4 : complete ? 0.85 : 1,
                },
              ]}
            >
              {complete ? (
                <View style={[styles.nodeCircle, styles.nodeComplete, { backgroundColor: colors.primary }]}>
                  <CheckIcon size={16} color={colors.accent} />
                </View>
              ) : isCurrent ? (
                <View style={[styles.nodeCircle, styles.nodeCurrent, { backgroundColor: colors.bgCard, borderColor: colors.primary }]}>
                  <View style={[styles.currentDot, { backgroundColor: colors.primary }]} />
                </View>
              ) : (
                <View style={[styles.nodeCircle, styles.nodeLocked, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                  {firstLetter ? (
                    <ArabicText size="body" color={colors.textMuted} style={{ fontSize: 18, lineHeight: 24 }}>
                      {firstLetter.letter}
                    </ArabicText>
                  ) : (
                    <LockIcon size={14} color={colors.textMuted} />
                  )}
                </View>
              )}

              {isCurrent ? (
                <View style={[styles.currentLabel, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                  <Text style={[styles.currentLabelTitle, { color: colors.text }]}>{lesson.title}</Text>
                  <View style={styles.upNextRow}>
                    <View style={[styles.upNextDot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.upNextText, { color: colors.accent }]}>Up next</Text>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={[styles.nodeTitle, { color: locked ? colors.textMuted : colors.text }]}>
                    {lesson.title}
                  </Text>
                  <Text style={[styles.nodeSubtitle, { color: locked ? colors.textMuted : colors.textSoft }]}>
                    {complete ? 'Completed' : locked ? 'Locked' : 'Available'}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  journeySection: { marginTop: spacing.lg },
  journeySectionTitle: {
    fontSize: 10, fontFamily: fontFamilies.bodyBold,
    letterSpacing: 1.2, marginBottom: spacing.xl,
  },
  journeyPath: { position: 'relative', paddingLeft: 32, paddingVertical: spacing.sm },
  connectorLine: {
    position: 'absolute', left: 50, top: 0, bottom: 0,
    width: 0, borderLeftWidth: 2, borderStyle: 'dashed',
  },
  nodeRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 44 },
  nodeCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nodeComplete: { ...shadows.soft },
  nodeCurrent: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, ...shadows.card },
  nodeLocked: { borderWidth: 2 },
  currentDot: { width: 12, height: 12, borderRadius: 6 },
  currentLabel: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: radii.lg, borderWidth: 1, ...shadows.card,
  },
  currentLabelTitle: { fontFamily: fontFamilies.headingBold, fontSize: 15 },
  upNextRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  upNextDot: { width: 6, height: 6, borderRadius: 3 },
  upNextText: {
    fontSize: 11, fontFamily: fontFamilies.bodySemiBold,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  nodeTitle: { fontSize: 15, fontFamily: fontFamilies.bodyMedium },
  nodeSubtitle: { fontSize: 12, fontFamily: fontFamilies.bodyRegular, marginTop: 2 },
});
```

- [ ] **Step 3: Rewrite `app/(tabs)/index.tsx` as screen shell**

The screen shell keeps: hooks, onboarding redirect logic, return-welcome check, header, and delegates hero + grid to child components:

```typescript
// app/(tabs)/index.tsx
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useMemo, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '../../src/design/theme';
import { spacing, fontFamilies } from '../../src/design/tokens';
import { useProgress } from '../../src/hooks/useProgress';
import { useHabit } from '../../src/hooks/useHabit';
import { LESSONS } from '../../src/data/lessons';
import { getCurrentLesson, getLessonsCompletedCount } from '../../src/engine/selectors';
import { getTodayDateString, getDayDifference } from '../../src/engine/dateUtils';
import { HeroCard } from '../../src/components/home/HeroCard';
import { LessonGrid } from '../../src/components/home/LessonGrid';

function StreakBadge({ count, colors: c }: { count: number; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.streakBadge, { borderColor: c.border }]}>
      <Text style={{ fontSize: 14, color: c.accent, lineHeight: 16 }}>{'☽'}</Text>
      <Text style={[styles.streakCount, { color: c.text }]}>{count}</Text>
      <Text style={[styles.streakLabel, { color: c.textMuted }]}>Wird</Text>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const progress = useProgress();
  const { habit } = useHabit();
  const today = getTodayDateString();

  const onboarded = progress.onboarded ?? false;
  const returnHadithLastShown = progress.returnHadithLastShown ?? null;

  useEffect(() => {
    if (progress.loading) return;
    if (!onboarded) { router.replace('/onboarding'); return; }
    const lastPractice = habit?.lastPracticeDate;
    if (lastPractice) {
      const gap = getDayDifference(today, lastPractice);
      if (gap >= 1 && returnHadithLastShown !== today) {
        router.replace('/return-welcome');
        return;
      }
    }
  }, [progress.loading, onboarded, habit?.lastPracticeDate, today, returnHadithLastShown]);

  const completedLessonIds = progress.completedLessonIds ?? [];
  const mastery = progress.mastery ?? { entities: {}, skills: {}, confusions: {} };
  const lessonsCompleted = getLessonsCompletedCount(completedLessonIds);
  const nextLesson = getCurrentLesson(completedLessonIds);
  const allDone = !nextLesson || completedLessonIds.length >= LESSONS.length;
  const currentPhase = nextLesson?.phase ?? 1;
  const currentWird = habit?.currentWird ?? 0;

  if (progress.loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  function handleStartLesson(lessonId: number) {
    router.push({ pathname: '/lesson/[id]', params: { id: String(lessonId) } });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.text }]}>tila</Text>
          {currentWird > 0 && <StreakBadge count={currentWird} colors={colors} />}
        </View>

        <HeroCard
          lesson={nextLesson}
          allDone={allDone}
          completedLessonIds={completedLessonIds}
          lessonsCompleted={lessonsCompleted}
          currentPhase={currentPhase}
          onStartLesson={handleStartLesson}
        />

        <LessonGrid
          currentPhase={currentPhase}
          nextLessonId={nextLesson?.id ?? null}
          completedLessonIds={completedLessonIds}
          mastery={mastery}
          today={today}
          onStartLesson={handleStartLesson}
        />

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: 100 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.xl,
  },
  appName: { fontFamily: fontFamilies.headingSemiBold, fontSize: 22, letterSpacing: 0.8 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 9999, borderWidth: 1,
  },
  streakCount: { fontSize: 13, fontFamily: fontFamilies.bodySemiBold },
  streakLabel: { fontSize: 11, fontFamily: fontFamilies.bodyMedium },
});
```

- [ ] **Step 4: Verify it compiles and tests pass**

Run: `npx tsc --noEmit`
Run: `npm test`

- [ ] **Step 5: Commit**

```bash
git add src/components/home/ app/(tabs)/index.tsx
git commit -m "refactor: split Home screen into HeroCard and LessonGrid components"
```

---

## Task 5: Split Progress Screen (437 → ~100 + children)

**Files:**
- Create: `src/components/progress/StatsRow.tsx`
- Create: `src/components/progress/PhasePanel.tsx`
- Create: `src/components/progress/LetterMasteryGrid.tsx`
- Modify: `app/(tabs)/progress.tsx`

- [ ] **Step 1: Create `src/components/progress/StatsRow.tsx`**

```typescript
// src/components/progress/StatsRow.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../design/theme';
import { typography, spacing, fontFamilies } from '../../design/tokens';
import { Card } from '../../design/components';

interface StatsRowProps {
  learnedCount: number;
  totalDone: number;
  totalLessons: number;
  accuracy: number;
  hasAttempts: boolean;
  currentPhase: number;
}

export function StatsRow({
  learnedCount,
  totalDone,
  totalLessons,
  accuracy,
  hasAttempts,
  currentPhase,
}: StatsRowProps) {
  const colors = useColors();

  const stats = [
    { label: 'Letters', value: String(learnedCount) },
    { label: 'Lessons', value: `${totalDone}/${totalLessons}` },
    { label: 'Accuracy', value: hasAttempts ? `${accuracy}%` : '\u2014' },
    { label: 'Phase', value: String(currentPhase) },
  ];

  return (
    <View style={styles.statsRow}>
      {stats.map((stat) => (
        <Card key={stat.label} style={styles.statCard}>
          <Text style={[typography.heading2, { color: colors.primary, textAlign: 'center' }]}>
            {stat.value}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: { flex: 1, padding: spacing.md, alignItems: 'center' },
  statLabel: {
    fontSize: 10, fontFamily: fontFamilies.bodySemiBold,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2,
  },
});
```

- [ ] **Step 2: Create `src/components/progress/PhasePanel.tsx`**

```typescript
// src/components/progress/PhasePanel.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../design/theme';
import { typography, spacing, fontFamilies } from '../../design/tokens';
import { Card } from '../../design/components';

interface PhasePanelProps {
  label: string;
  done: number;
  total: number;
}

export function PhasePanel({ label, done, total }: PhasePanelProps) {
  const colors = useColors();
  const pct = total > 0 ? (done / total) * 100 : 0;
  const isComplete = done === total && total > 0;

  return (
    <Card style={{ marginBottom: spacing.md, padding: spacing.lg }}>
      <View style={styles.phaseHeader}>
        <View style={styles.phaseHeaderLeft}>
          <View
            style={[
              styles.phaseDot,
              {
                backgroundColor: isComplete
                  ? colors.primary
                  : done > 0
                    ? colors.primarySoft
                    : colors.bgCard,
                borderColor: done > 0 ? colors.primary : colors.border,
                borderWidth: isComplete ? 0 : 2,
              },
            ]}
          >
            {isComplete && (
              <Text style={{ color: colors.white, fontSize: 12 }}>{'\u2713'}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.bodyLarge,
                { color: colors.text, fontFamily: fontFamilies.headingSemiBold },
              ]}
            >
              {label}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.phaseCount,
            { color: isComplete ? colors.primary : colors.textMuted },
          ]}
        >
          {done}/{total}
        </Text>
      </View>

      {total > 0 && (
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: pct },
            ]}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  phaseHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.sm,
  },
  phaseHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  phaseDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  phaseCount: { fontSize: 12, fontFamily: fontFamilies.bodyBold },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
});
```

Note: In `PhasePanel`, the `width` prop on `progressFill` uses a number (`pct`) instead of the `as any` string cast. React Native accepts number values for `width` — this replaces the `width: \`${pct}%\` as any` pattern.

- [ ] **Step 3: Create `src/components/progress/LetterMasteryGrid.tsx`**

```typescript
// src/components/progress/LetterMasteryGrid.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../design/theme';
import { spacing, radii, fontFamilies } from '../../design/tokens';
import { ArabicText } from '../../design/components';
import { ARABIC_LETTERS } from '../../data/letters';
import { deriveMasteryState } from '../../engine/mastery';
import type { EntityState } from '../../types/mastery';

function getMasteryStyle(
  state: string,
  colors: ReturnType<typeof useColors>
): { bg: string; border: string; textColor: string; nameColor: string } {
  switch (state) {
    case 'retained':
    case 'accurate':
      return {
        bg: colors.primarySoft, border: colors.primary,
        textColor: colors.primaryDark, nameColor: colors.primary,
      };
    case 'unstable':
      return {
        bg: colors.accentLight, border: colors.accent,
        textColor: colors.text, nameColor: colors.accent,
      };
    case 'introduced':
      return {
        bg: colors.bgCard, border: colors.border,
        textColor: colors.textSoft, nameColor: colors.textMuted,
      };
    default:
      return {
        bg: colors.bgCard, border: 'transparent',
        textColor: colors.textMuted, nameColor: colors.textMuted,
      };
  }
}

interface LetterMasteryGridProps {
  entities: Record<string, EntityState>;
  learnedIds: number[];
  today: string;
}

export function LetterMasteryGrid({ entities, learnedIds, today }: LetterMasteryGridProps) {
  const colors = useColors();

  return (
    <View style={styles.letterGrid}>
      {ARABIC_LETTERS.map((letter) => {
        const entityKey = `letter:${letter.id}`;
        const entity = entities[entityKey];
        const state = entity ? deriveMasteryState(entity, today) : 'not_started';
        const learned = learnedIds.includes(letter.id);
        const started = entity && entity.attempts > 0;
        const masteryStyle = getMasteryStyle(state, colors);

        return (
          <View key={letter.id} style={{ width: '25%' }}>
            <View
              style={[
                styles.letterCell,
                {
                  backgroundColor: masteryStyle.bg,
                  borderColor: masteryStyle.border,
                  borderWidth: state !== 'not_started' ? 2 : 1.5,
                  opacity: started || learned ? 1 : 0.35,
                },
              ]}
            >
              <ArabicText size="body" color={masteryStyle.textColor} style={{ textAlign: 'center' }}>
                {letter.letter}
              </ArabicText>
              <Text
                style={[styles.letterName, { color: masteryStyle.nameColor }]}
                numberOfLines={1}
              >
                {learned
                  ? letter.name
                  : started
                    ? `${entity.correct}/${entity.attempts}`
                    : '\u2014'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  letterGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  letterCell: {
    aspectRatio: 1, margin: 4, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center', padding: spacing.xs,
  },
  letterName: { fontSize: 9, fontFamily: fontFamilies.bodySemiBold, marginTop: 2 },
});
```

Note: This removes the `(e as any).correct` / `(e as any).attempts` casts by using the typed `EntityState` interface directly.

- [ ] **Step 4: Rewrite `app/(tabs)/progress.tsx` as screen shell**

```typescript
// app/(tabs)/progress.tsx
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../src/design/theme';
import { typography, spacing } from '../../src/design/tokens';
import { useProgress } from '../../src/hooks/useProgress';
import { LESSONS } from '../../src/data/lessons';
import {
  getPhaseCounts,
  getLearnedLetterIds,
  getCurrentLesson,
} from '../../src/engine/selectors';
import { getTodayDateString } from '../../src/engine/dateUtils';
import { StatsRow } from '../../src/components/progress/StatsRow';
import { PhasePanel } from '../../src/components/progress/PhasePanel';
import { LetterMasteryGrid } from '../../src/components/progress/LetterMasteryGrid';

const PHASES = [
  { key: 1, label: 'Letter Recognition', total: 'p1Total' as const, done: 'p1Done' as const },
  { key: 2, label: 'Letter Sounds', total: 'p2Total' as const, done: 'p2Done' as const },
  { key: 3, label: 'Harakat (Vowels)', total: 'p3Total' as const, done: 'p3Done' as const },
  { key: 4, label: 'Connected Forms', total: 'p4Total' as const, done: 'p4Done' as const },
];

export default function ProgressScreen() {
  const colors = useColors();
  const progress = useProgress();

  const completedLessonIds = progress.completedLessonIds ?? [];
  const mastery = progress.mastery ?? { entities: {}, skills: {}, confusions: {} };
  const today = getTodayDateString();

  const phaseCounts = useMemo(() => getPhaseCounts(completedLessonIds), [completedLessonIds]);
  const learnedIds = useMemo(() => getLearnedLetterIds(completedLessonIds), [completedLessonIds]);
  const currentLesson = useMemo(() => getCurrentLesson(completedLessonIds), [completedLessonIds]);

  const stats = useMemo(() => {
    const entities = mastery.entities ?? {};
    let totalCorrect = 0;
    let totalAttempts = 0;
    for (const e of Object.values(entities)) {
      if (e && typeof e === 'object') {
        totalCorrect += e.correct || 0;
        totalAttempts += e.attempts || 0;
      }
    }
    return {
      accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
      totalAttempts,
    };
  }, [mastery.entities]);

  if (progress.loading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[typography.heading1, { color: colors.text, marginBottom: spacing.xl }]}>
          Your Progress
        </Text>

        <StatsRow
          learnedCount={learnedIds.length}
          totalDone={completedLessonIds.length}
          totalLessons={LESSONS.length}
          accuracy={stats.accuracy}
          hasAttempts={stats.totalAttempts > 0}
          currentPhase={currentLesson.phase}
        />

        <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.md }]}>
          Phase Progress
        </Text>

        {PHASES.map((phase) => (
          <PhasePanel
            key={phase.key}
            label={phase.label}
            done={phaseCounts[phase.done] as number}
            total={phaseCounts[phase.total] as number}
          />
        ))}

        <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>
          Letter Mastery
        </Text>

        <LetterMasteryGrid
          entities={mastery.entities ?? {}}
          learnedIds={learnedIds}
          today={today}
        />

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl,
  },
});
```

- [ ] **Step 5: Verify it compiles and tests pass**

Run: `npx tsc --noEmit`
Run: `npm test`

- [ ] **Step 6: Commit**

```bash
git add src/components/progress/ app/(tabs)/progress.tsx
git commit -m "refactor: split Progress screen into StatsRow, PhasePanel, LetterMasteryGrid"
```

---

## Task 6: Finish Audio Layer

**Files:**
- Modify: `src/audio/player.ts`
- Modify: `src/components/LessonQuiz.tsx` (remove direct audio/haptic calls)
- Modify: `src/components/quiz/QuizQuestion.tsx`
- Modify: `src/components/quiz/QuizCelebration.tsx`
- Modify: `src/components/onboarding/OnboardingFlow.tsx`
- Modify: `src/components/onboarding/steps/LetterAudio.tsx`
- Modify: `src/components/onboarding/steps/LetterQuiz.tsx`

### Sub-task 6a: Expand player.ts with playback helpers

- [ ] **Step 1: Add two-lane playback helpers to `src/audio/player.ts`**

Add the following after the existing `getLetterAsset` function:

```typescript
// ── Two-lane playback engine ──

import * as Haptics from 'expo-haptics';
import { AudioPlayer, createAudioPlayer } from 'expo-audio';

let _muted = false;

export function setMuted(muted: boolean): void {
  _muted = muted;
}

export function isMuted(): boolean {
  return _muted;
}

// Voice lane: one active player at a time
let _voicePlayer: AudioPlayer | null = null;

// SFX lane: one active player at a time
let _sfxPlayer: AudioPlayer | null = null;

async function playOnLane(
  lane: 'voice' | 'sfx',
  source: AudioSource | null,
  haptic?: () => Promise<void>
): Promise<void> {
  if (_muted || !source) return;

  const player = createAudioPlayer(source);

  if (lane === 'voice') {
    if (_voicePlayer) { try { _voicePlayer.remove(); } catch {} }
    _voicePlayer = player;
  } else {
    if (_sfxPlayer) { try { _sfxPlayer.remove(); } catch {} }
    _sfxPlayer = player;
  }

  player.play();
  if (haptic) await haptic();
}

// ── Public playback helpers ──

export function playCorrect(): Promise<void> {
  return playOnLane('sfx', SFX_ASSETS.correct, () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  );
}

export function playWrong(): Promise<void> {
  return playOnLane('sfx', SFX_ASSETS.wrong, () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  );
}

export function playTap(): Promise<void> {
  return playOnLane('sfx', SFX_ASSETS.button_tap, () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  );
}

export function playLessonStart(): Promise<void> {
  return playOnLane('sfx', SFX_ASSETS.lesson_start);
}

export function playLessonComplete(): Promise<void> {
  return playOnLane('sfx', SFX_ASSETS.lesson_complete, () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  );
}

export function playCelebration(): Promise<void> {
  return playOnLane('sfx', SFX_ASSETS.mid_lesson_celebration, () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  );
}

export function playStreakTier(tier: 1 | 2 | 3): Promise<void> {
  const assets = { 1: SFX_ASSETS.streak_tier1, 2: SFX_ASSETS.streak_tier2, 3: SFX_ASSETS.streak_tier3 };
  return playOnLane('sfx', assets[tier]);
}

export function playLetterName(letterId: number): Promise<void> {
  return playOnLane('voice', getLetterAsset(letterId, 'name'));
}

export function playLetterSound(letterId: number): Promise<void> {
  return playOnLane('voice', getLetterAsset(letterId, 'sound'));
}

export function playOnboardingAdvance(): Promise<void> {
  return playOnLane('sfx', SFX_ASSETS.onboarding_advance);
}

export function playOnboardingComplete(): Promise<void> {
  return playOnLane('sfx', SFX_ASSETS.onboarding_complete);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

### Sub-task 6b: Migrate components to use player helpers

- [ ] **Step 3: Update LessonQuiz orchestrator**

In `src/components/LessonQuiz.tsx`, replace direct `useAudioPlayer` / `Haptics.*` calls with imports from `../audio/player`:

- Remove `useAudioPlayer` and `Haptics` imports
- Remove `correctSFX` and `wrongSFX` audio player instances
- Replace `correctSFX.seekTo(0); correctSFX.play(); Haptics.notificationAsync(...)` with `playCorrect()`
- Replace wrong SFX + haptics with `playWrong()`
- Keep `targetPlayer` for letter audio playback via `useAudioPlayer` (this is voice-lane managed by the hook level — the player helpers work at the imperative API level for fire-and-forget sounds, while `useAudioPlayer` is needed for the question-specific voice audio that changes per question)

Actually, for the question-specific letter audio: replace `useAudioPlayer(targetAudioSource)` + `seekTo(0)` + `play()` with calling `playLetterName(id)` or `playLetterSound(id)` from the player module. This properly manages the voice lane.

```typescript
// Updated handleSelect in LessonQuiz.tsx
import { playCorrect, playWrong, playLetterName, playLetterSound, getLetterAsset } from '../audio/player';

// Remove: const correctSFX = useAudioPlayer(getSFXAsset('correct'));
// Remove: const wrongSFX = useAudioPlayer(getSFXAsset('wrong'));
// Remove: const targetPlayer = useAudioPlayer(targetAudioSource);

const playTargetAudio = useCallback(async () => {
  if (!currentQuestion?.targetId) return;
  const audioType = isSoundQuestion ? 'sound' : 'name';
  if (audioType === 'sound') {
    await playLetterSound(currentQuestion.targetId);
  } else {
    await playLetterName(currentQuestion.targetId);
  }
}, [currentQuestion?.targetId, isSoundQuestion]);

// In handleSelect:
if (correct) {
  playCorrect();
  setTimeout(() => handleAnswer(opt, true), 800);
} else {
  playWrong();
}
```

- [ ] **Step 4: Update onboarding components**

In `OnboardingFlow.tsx`: replace `useAudioPlayer` calls with `playOnboardingAdvance()`, `playOnboardingComplete()`, `playLetterName(1)`.

In `LetterAudio.tsx`: replace direct audio player with `playLetterName(1)`.

In `LetterQuiz.tsx`: replace direct SFX with `playCorrect()`, `playTap()`, `playWrong()`.

- [ ] **Step 5: Verify it compiles and tests pass**

Run: `npx tsc --noEmit`
Run: `npm test`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/audio/player.ts src/components/LessonQuiz.tsx src/components/quiz/ src/components/onboarding/
git commit -m "feat: expand audio player with two-lane playback helpers, migrate components"
```

---

## Task 7: Final Validation

- [ ] **Step 1: Run full validate**

Run: `npm run validate`
Expected: lint + typecheck both pass.

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: All test files pass.

- [ ] **Step 3: Verify file sizes are within target**

Check that no new file exceeds ~250 lines:
Run: `wc -l src/components/quiz/*.tsx src/components/onboarding/*.tsx src/components/onboarding/steps/*.tsx src/components/home/*.tsx src/components/progress/*.tsx src/components/LessonQuiz.tsx app/onboarding.tsx app/(tabs)/index.tsx app/(tabs)/progress.tsx`

Expected: All files under 250 lines (LessonGrid at ~200 is acceptable).

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final validation and cleanup for Wave 2 structural refactor"
```
