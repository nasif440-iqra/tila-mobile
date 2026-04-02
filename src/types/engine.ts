/**
 * Shared engine type definitions.
 *
 * Central type registry for the engine layer. All cross-cutting interfaces
 * that multiple engine files depend on live here. File-local types stay
 * in their respective modules per D-05.
 */

import type { EntityState, SkillState, ConfusionState } from '../engine/progress';

// ── Letter data types ──────────────────────────────────────────────

export interface ArabicLetterArticulation {
  place: string;
  manner: string;
  breath: string;
  confusedWith: string;
  tryThis: string;
}

export interface ArabicLetter {
  id: number;
  letter: string;
  name: string;
  transliteration: string;
  sound: string;
  tip: string;
  dots: number;
  dotPos: string;
  visualRule: string;
  family: string;
  soundHint: string;
  articulation?: ArabicLetterArticulation;
}

// ── Mastery engine types ───────────────────────────────────────────

export type MasteryLevel =
  | 'not_started'
  | 'introduced'
  | 'unstable'
  | 'accurate'
  | 'retained';

export type ErrorCategory =
  | 'visual_confusion'
  | 'sound_confusion'
  | 'vowel_confusion'
  | 'random_miss';

// ── Engagement types ───────────────────────────────────────────────

export type CompletionTier =
  | 'firstLesson'
  | 'perfect'
  | 'great'
  | 'good'
  | 'struggling'
  | 'harakatPerfect'
  | 'harakatGreat'
  | 'harakatStruggling';

export type PerformanceBand = 'strong' | 'partial' | 'weak';

// ── Outcome types ──────────────────────────────────────────────────

export interface LessonOutcome {
  total: number;
  correct: number;
  accuracy: number;
  passed: boolean;
  threshold: number | null;
}

// ── Selector types ─────────────────────────────────────────────────

export interface PhaseCounts {
  p1Done: number;
  p2Done: number;
  p3Done: number;
  p4Done: number;
  p1Total: number;
  p2Total: number;
  p3Total: number;
  p4Total: number;
}

export interface ReviewSessionPlan {
  due: string[];
  unstable: string[];
  weak: string[];
  confused: Array<{ key: string; count: number; lastSeen: string | null }>;
  items: string[];
  totalItems: number;
  hasReviewWork: boolean;
  isUrgent: boolean;
}

// ── Harakat data types ─────────────────────────────────────────────

export interface Harakah {
  id: string;
  mark: string;
  name: string;
  sound: string;
  description: string;
  position: string;
}

export interface HarakatCombo {
  id: string;
  letterId: number;
  harakahId: string;
  display: string;
  audioText: string;
  sound: string;
  letterName: string;
}

// ── Connected forms types ──────────────────────────────────────────

export interface ConnectedFormData {
  forms: {
    isolated: string;
    initial: string;
    medial: string;
    final: string;
  };
  joins: boolean;
}

// ── Re-exports for convenience ─────────────────────────────────────

export type { EntityState, SkillState, ConfusionState };
