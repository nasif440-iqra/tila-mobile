import type { Lesson } from '../../types/lesson';
import type { ProgressState } from '../progress';
import type { Question } from '../../types/question';

export function generateLessonQuestions(
  lesson: Lesson,
  progress: { completedLessonIds: number[]; mastery: ProgressState["mastery"] }
): Question[];

export function generateHybridExercises(
  lesson: Lesson,
  progress: Partial<{ completedLessonIds: number[]; mastery: ProgressState["mastery"] }>
): Question[];

export function shuffle<T>(array: T[]): T[];
export function pickRandom<T>(array: T[]): T | undefined;

// Secondary exports — individual generators
export function generateRecognitionQs(lesson: Lesson, ...args: unknown[]): Question[];
export function generateSoundQs(lesson: Lesson, ...args: unknown[]): Question[];
export function generateContrastQs(lesson: Lesson, ...args: unknown[]): Question[];
export function generateHarakatIntroQs(lesson: Lesson, ...args: unknown[]): Question[];
export function generateHarakatQs(lesson: Lesson, ...args: unknown[]): Question[];

// Explanation functions
export function getWrongExplanation(...args: unknown[]): string;
export function getContrastExplanation(...args: unknown[]): string;
export function getHarakatWrongExplanation(...args: unknown[]): string;
