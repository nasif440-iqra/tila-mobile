import type { ExerciseStep } from "@/src/types/curriculum-v2";

// ── Constants ──

const RECENT_ATTEMPTS_MAX = 8;

/** Spaced repetition interval levels in days */
const INTERVAL_LEVELS = [0, 1, 3, 7, 14, 30] as const;

// ── Types ──

export interface RecentAttempt {
  correct: boolean;
  exerciseType: ExerciseStep["type"];
  answerMode: string;
  timestamp: string;
}

export interface ConfusionRecord {
  entityId: string;
  count: number;
  lastSeen: string;
}

export interface EntityMastery {
  entityId: string;
  state: "not_started" | "introduced" | "unstable" | "accurate" | "retained";
  correctCount: number;
  attemptCount: number;
  recentAttempts: RecentAttempt[];
  intervalDays: number;
  nextReview: string;
  sessionStreak: number;
  confusionPairs: ConfusionRecord[];
}

// ── Helpers ──

function stepIntervalBack(intervalDays: number, steps: number): number {
  const idx = INTERVAL_LEVELS.indexOf(intervalDays as (typeof INTERVAL_LEVELS)[number]);
  if (idx <= 0) return 1;
  const newIdx = Math.max(0, idx - steps);
  return INTERVAL_LEVELS[newIdx];
}

function hasTwoConsecutiveFailures(attempts: RecentAttempt[]): boolean {
  if (attempts.length < 2) return false;
  const last = attempts[attempts.length - 1];
  const secondLast = attempts[attempts.length - 2];
  return !last.correct && !secondLast.correct;
}

function computeNextReview(intervalDays: number, from?: string): string {
  const base = from ? new Date(from) : new Date();
  base.setDate(base.getDate() + intervalDays);
  return base.toISOString();
}

// ── State transition logic ──

function transitionState(
  mastery: EntityMastery,
  lessonPassed: boolean,
  preAttemptIntervalDays: number,
): EntityMastery["state"] {
  const { state, correctCount, recentAttempts, confusionPairs } = mastery;

  switch (state) {
    case "not_started":
      // Only promote on passed lesson
      return lessonPassed ? "introduced" : "not_started";

    case "introduced":
      // Promote when correctCount reaches 2
      return correctCount >= 2 ? "unstable" : "introduced";

    case "unstable": {
      // Promote when >= 80% correct over last 8 attempts AND no confusion pairs
      if (recentAttempts.length < RECENT_ATTEMPTS_MAX) return "unstable";
      if (confusionPairs.length > 0) return "unstable";
      const correctInWindow = recentAttempts.filter((a) => a.correct).length;
      const accuracy = correctInWindow / recentAttempts.length;
      return accuracy >= 0.8 ? "accurate" : "unstable";
    }

    case "accurate": {
      // Promote on correct review at 7+ day interval (use pre-attempt interval to avoid false trigger)
      if (preAttemptIntervalDays >= 7 && recentAttempts.length > 0) {
        const lastAttempt = recentAttempts[recentAttempts.length - 1];
        if (lastAttempt.correct) return "retained";
      }
      return "accurate";
    }

    case "retained":
      return "retained";
  }
}

// ── Public API ──

/** Create initial mastery record for an entity */
export function createEntityMastery(entityId: string): EntityMastery {
  return {
    entityId,
    state: "not_started",
    correctCount: 0,
    attemptCount: 0,
    recentAttempts: [],
    intervalDays: 0,
    nextReview: new Date().toISOString(),
    sessionStreak: 0,
    confusionPairs: [],
  };
}

/**
 * Record one attempt — updates counts, recentAttempts, confusion pairs.
 * ALL attempts update evidence. Only passed lessons allow promotion from not_started.
 */
export function recordAttempt(
  mastery: EntityMastery,
  attempt: RecentAttempt,
  lessonPassed: boolean,
): EntityMastery {
  // Capture pre-attempt interval for accurate→retained gate
  const preAttemptIntervalDays = mastery.intervalDays;

  // Update counts
  const attemptCount = mastery.attemptCount + 1;
  const correctCount = mastery.correctCount + (attempt.correct ? 1 : 0);
  const sessionStreak = attempt.correct ? mastery.sessionStreak + 1 : 0;

  // Update recentAttempts (capped at RECENT_ATTEMPTS_MAX, FIFO)
  const recentAttempts = [...mastery.recentAttempts, attempt].slice(-RECENT_ATTEMPTS_MAX);

  // Compute updated intervalDays — only increase on correct
  let intervalDays = mastery.intervalDays;
  if (attempt.correct) {
    const currentIdx = INTERVAL_LEVELS.indexOf(intervalDays as (typeof INTERVAL_LEVELS)[number]);
    if (currentIdx >= 0 && currentIdx < INTERVAL_LEVELS.length - 1) {
      intervalDays = INTERVAL_LEVELS[currentIdx + 1];
    } else if (currentIdx < 0) {
      // intervalDays is not a level value — snap to nearest upward
      intervalDays = INTERVAL_LEVELS.find((l) => l > intervalDays) ?? 30;
    }
    // Already at max: stay at 30
  }

  const updated: EntityMastery = {
    ...mastery,
    attemptCount,
    correctCount,
    sessionStreak,
    recentAttempts,
    intervalDays,
    nextReview: computeNextReview(intervalDays, attempt.timestamp),
  };

  // Compute new state after all evidence is updated
  const newState = transitionState(updated, lessonPassed, preAttemptIntervalDays);

  return { ...updated, state: newState };
}

/**
 * Apply demotion on review failure.
 * - introduced/unstable: reset intervalDays to 1
 * - accurate: step back one interval level
 * - retained: step back two interval levels
 * - Full reset to intervalDays=1 if 2+ consecutive failures in recentAttempts
 */
export function applyDemotion(mastery: EntityMastery): EntityMastery {
  // Full reset takes priority over graduated demotion
  if (hasTwoConsecutiveFailures(mastery.recentAttempts)) {
    return {
      ...mastery,
      intervalDays: 1,
      nextReview: computeNextReview(1),
    };
  }

  let intervalDays: number;

  switch (mastery.state) {
    case "not_started":
    case "introduced":
    case "unstable":
      intervalDays = 1;
      break;

    case "accurate":
      intervalDays = stepIntervalBack(mastery.intervalDays, 1);
      break;

    case "retained":
      intervalDays = stepIntervalBack(mastery.intervalDays, 2);
      break;
  }

  return {
    ...mastery,
    intervalDays,
    nextReview: computeNextReview(intervalDays),
  };
}

/** Record a confusion pair — creates or increments the confusion record */
export function recordConfusion(
  mastery: EntityMastery,
  confusedWithId: string,
  timestamp: string,
): EntityMastery {
  const existing = mastery.confusionPairs.find((c) => c.entityId === confusedWithId);

  let confusionPairs: ConfusionRecord[];

  if (existing) {
    confusionPairs = mastery.confusionPairs.map((c) =>
      c.entityId === confusedWithId ? { ...c, count: c.count + 1, lastSeen: timestamp } : c,
    );
  } else {
    confusionPairs = [
      ...mastery.confusionPairs,
      { entityId: confusedWithId, count: 1, lastSeen: timestamp },
    ];
  }

  return { ...mastery, confusionPairs };
}
