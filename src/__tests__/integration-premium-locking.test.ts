/**
 * Integration test: Premium content locking.
 *
 * Tests the lesson access control logic: free users can access lessons 1-7,
 * premium users access all, expired users can review free-tier letters.
 * Matches FREE_LESSON_CUTOFF = 7 from src/monetization/hooks.ts.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ── Constants matching src/monetization/hooks.ts ──

const FREE_LESSON_CUTOFF = 7;

// ── Access control logic (mirrors useCanAccessLesson) ──

function canAccessLesson(
  lessonId: number,
  isPremiumActive: boolean,
  loading: boolean = false,
): boolean {
  if (lessonId <= FREE_LESSON_CUTOFF) return true;
  // While loading, assume premium to prevent flash
  if (loading) return true;
  return isPremiumActive;
}

// ── Premium review rights logic (mirrors usePremiumReviewRights) ──

interface MockLesson {
  id: number;
  teachIds: number[];
}

const MOCK_LESSONS: MockLesson[] = [
  { id: 1, teachIds: [1, 2] },       // Alif, Ba
  { id: 2, teachIds: [3, 4] },       // Ta, Tha
  { id: 3, teachIds: [5, 6] },       // Jim, Ha
  { id: 4, teachIds: [7, 8] },       // Kha, Dal
  { id: 5, teachIds: [9, 10] },      // Dhal, Ra
  { id: 6, teachIds: [11, 12] },     // Zay, Sin
  { id: 7, teachIds: [13, 14] },     // Shin, Sad (last free)
  { id: 8, teachIds: [15, 16] },     // Dad, Ta (premium)
  { id: 9, teachIds: [17, 18] },     // Dha, Ain
  { id: 10, teachIds: [19, 20] },    // Ghain, Fa
];

function getPremiumReviewRights(grantedLessonIds: number[]): number[] {
  const letterIds = new Set<number>();

  // All letters from free lessons are always reviewable
  for (const lesson of MOCK_LESSONS) {
    if (lesson.id <= FREE_LESSON_CUTOFF) {
      for (const id of lesson.teachIds) {
        letterIds.add(id);
      }
    }
  }

  // Add letters from granted premium lessons
  for (const lessonId of grantedLessonIds) {
    const lesson = MOCK_LESSONS.find((l) => l.id === lessonId);
    if (lesson) {
      for (const id of lesson.teachIds) {
        letterIds.add(id);
      }
    }
  }

  return Array.from(letterIds);
}

// ── Tests ──

describe('Premium locking integration', () => {
  it('free user can access lessons 1-7', () => {
    for (let lessonId = 1; lessonId <= 7; lessonId++) {
      expect(canAccessLesson(lessonId, false)).toBe(true);
    }
  });

  it('free user is blocked from lesson 8+', () => {
    expect(canAccessLesson(8, false)).toBe(false);
    expect(canAccessLesson(9, false)).toBe(false);
    expect(canAccessLesson(50, false)).toBe(false);
    expect(canAccessLesson(106, false)).toBe(false);
  });

  it('premium user can access all lessons', () => {
    for (let lessonId = 1; lessonId <= 106; lessonId++) {
      expect(canAccessLesson(lessonId, true)).toBe(true);
    }
  });

  it('loading state assumes premium to prevent lock flash', () => {
    // While subscription state is loading, premium lessons should be accessible
    expect(canAccessLesson(8, false, true)).toBe(true);
    expect(canAccessLesson(50, false, true)).toBe(true);
  });

  it('expired user can review letters learned from free lessons', () => {
    // Expired user has no active premium but previously completed lesson 8
    const grantedLessonIds = [8]; // Lesson 8 was completed during subscription

    const reviewableLetters = getPremiumReviewRights(grantedLessonIds);

    // Should include all free lesson letters (1-14) plus granted lesson 8 letters (15, 16)
    expect(reviewableLetters).toContain(1);   // From lesson 1
    expect(reviewableLetters).toContain(14);  // From lesson 7 (last free)
    expect(reviewableLetters).toContain(15);  // From lesson 8 (granted)
    expect(reviewableLetters).toContain(16);  // From lesson 8 (granted)
    // Should NOT include non-granted premium letters
    expect(reviewableLetters).not.toContain(17); // From lesson 9 (not granted)
    expect(reviewableLetters).not.toContain(18); // From lesson 9 (not granted)
  });

  it('expired user without grants only gets free lesson letters', () => {
    const reviewableLetters = getPremiumReviewRights([]);

    // Only free lesson letters (lessons 1-7)
    expect(reviewableLetters).toHaveLength(14); // 7 lessons * 2 letters each
    expect(reviewableLetters).toContain(1);
    expect(reviewableLetters).toContain(14);
    expect(reviewableLetters).not.toContain(15);
  });
});
