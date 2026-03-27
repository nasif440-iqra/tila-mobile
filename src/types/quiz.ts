// src/types/quiz.ts

/**
 * Shape recorded by useLessonQuiz during the quiz UI.
 * This is the UI-layer result — NOT the DB shape.
 */
export interface QuizResultItem {
  targetId: string | number;
  correct: boolean;
  selectedId: string;
  questionType: string | null;
  correctId: string;
  isHarakat: boolean;
  hasAudio: boolean;
  responseTimeMs: number;
}

/**
 * Shape expected by saveQuestionAttempts in progress.ts.
 * Matches the question_attempts DB columns exactly.
 */
export interface QuestionAttempt {
  questionType: string;
  skillBucket: string | null;
  targetEntity: string | null;
  correct: boolean;
  selectedOption: string | null;
  correctOption: string | null;
  responseTimeMs: number | null;
}

/**
 * Derive skillBucket from questionType.
 * Maps question generator types to the skill categories used in mastery_skills.
 */
export function deriveSkillBucket(questionType: string | null): string | null {
  if (!questionType) return null;
  const map: Record<string, string> = {
    tap: 'visual',
    find: 'visual',
    name_to_letter: 'visual',
    letter_to_name: 'visual',
    rule: 'visual',
    audio_to_letter: 'sound',
    letter_to_sound: 'sound',
    contrast_audio: 'sound',
  };
  return map[questionType] ?? (questionType.includes('harakat') ? 'harakat' : null);
}

/**
 * Boundary adapter: transforms UI quiz results into DB QuestionAttempt objects.
 * Called at the completeLesson boundary, NOT inside UI components.
 */
export function mapQuizResultsToAttempts(results: QuizResultItem[]): QuestionAttempt[] {
  return results.map((r) => ({
    questionType: r.questionType ?? 'unknown',
    skillBucket: deriveSkillBucket(r.questionType),
    targetEntity: r.targetId != null ? String(r.targetId) : null,
    correct: r.correct,
    selectedOption: r.selectedId ?? null,
    correctOption: r.correctId ?? null,
    responseTimeMs: r.responseTimeMs ?? null,
  }));
}
