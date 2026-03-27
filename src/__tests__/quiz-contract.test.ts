import { describe, it, expect } from 'vitest';
import {
  mapQuizResultsToAttempts,
  deriveSkillBucket,
  type QuizResultItem,
  type QuestionAttempt,
} from '../types/quiz';

describe('deriveSkillBucket', () => {
  it('maps recognition types to visual', () => {
    expect(deriveSkillBucket('tap')).toBe('visual');
    expect(deriveSkillBucket('find')).toBe('visual');
    expect(deriveSkillBucket('name_to_letter')).toBe('visual');
    expect(deriveSkillBucket('letter_to_name')).toBe('visual');
    expect(deriveSkillBucket('rule')).toBe('visual');
  });

  it('maps sound types to sound', () => {
    expect(deriveSkillBucket('audio_to_letter')).toBe('sound');
    expect(deriveSkillBucket('letter_to_sound')).toBe('sound');
    expect(deriveSkillBucket('contrast_audio')).toBe('sound');
  });

  it('returns null for null input', () => {
    expect(deriveSkillBucket(null)).toBeNull();
  });

  it('returns null for unknown types', () => {
    expect(deriveSkillBucket('unknown_type')).toBeNull();
  });
});

describe('mapQuizResultsToAttempts', () => {
  const sampleResult: QuizResultItem = {
    targetId: 1,
    correct: true,
    selectedId: '1',
    questionType: 'tap',
    correctId: '1',
    isHarakat: false,
    hasAudio: false,
    responseTimeMs: 1500,
  };

  it('maps all required QuestionAttempt fields', () => {
    const [attempt] = mapQuizResultsToAttempts([sampleResult]);
    expect(attempt).toHaveProperty('questionType', 'tap');
    expect(attempt).toHaveProperty('skillBucket', 'visual');
    expect(attempt).toHaveProperty('targetEntity', '1');
    expect(attempt).toHaveProperty('correct', true);
    expect(attempt).toHaveProperty('selectedOption', '1');
    expect(attempt).toHaveProperty('correctOption', '1');
    expect(attempt).toHaveProperty('responseTimeMs', 1500);
  });

  it('produces no undefined values for any field', () => {
    const [attempt] = mapQuizResultsToAttempts([sampleResult]);
    for (const [key, value] of Object.entries(attempt)) {
      expect(value, `${key} should not be undefined`).not.toBeUndefined();
    }
  });

  it('converts targetId to string targetEntity', () => {
    const [attempt] = mapQuizResultsToAttempts([{ ...sampleResult, targetId: 42 }]);
    expect(attempt.targetEntity).toBe('42');
  });

  it('handles sound question types', () => {
    const [attempt] = mapQuizResultsToAttempts([{ ...sampleResult, questionType: 'audio_to_letter' }]);
    expect(attempt.skillBucket).toBe('sound');
  });

  it('handles null questionType gracefully', () => {
    const [attempt] = mapQuizResultsToAttempts([{ ...sampleResult, questionType: null }]);
    expect(attempt.questionType).toBe('unknown');
    expect(attempt.skillBucket).toBeNull();
  });
});
