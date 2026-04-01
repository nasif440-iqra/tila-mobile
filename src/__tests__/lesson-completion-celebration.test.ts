import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const lessonScreenSrc = fs.readFileSync(
  path.resolve(__dirname, '../../app/lesson/[id].tsx'), 'utf-8'
);

describe('mastery celebration fresh data - STAB-02 regression', () => {
  it('destructures updatedMastery from completeLesson return', () => {
    // The lesson screen must use the fresh mastery returned from completeLesson
    expect(lessonScreenSrc).toMatch(/\{\s*updatedMastery\s*\}.*completeLesson/s);
  });

  it('uses updatedMastery for newly mastered detection, not progress.mastery', () => {
    // After completeLesson, celebration detection must iterate updatedMastery.entities
    // not progress.mastery (which is stale)
    expect(lessonScreenSrc).toContain('updatedMastery.entities');
  });

  it('does not read progress.mastery after completeLesson for celebration', () => {
    // The old pattern was: const postMastery = progress.mastery ?? ...
    // This must NOT appear after the completeLesson call
    expect(lessonScreenSrc).not.toMatch(/completeLesson[\s\S]*?postMastery\s*=\s*progress\.mastery/);
  });
});
