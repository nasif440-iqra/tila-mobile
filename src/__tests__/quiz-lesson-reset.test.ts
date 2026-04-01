import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const lessonScreenSrc = fs.readFileSync(
  path.resolve(__dirname, '../../app/lesson/[id].tsx'), 'utf-8'
);

describe('LessonScreen quiz reset — Bug 2 regression', () => {
  it('LessonQuiz has key={lesson.id} to force remount on lesson change', () => {
    // Regression: Bug 2 — quiz state must reset when lesson identity changes
    // The key prop forces React to unmount/remount, resetting all hook state
    expect(lessonScreenSrc).toContain('key={lesson.id}');
    // Verify it appears at least twice (once for LessonQuiz, once for LessonHybrid)
    const keyMatches = lessonScreenSrc.match(/key=\{lesson\.id\}/g);
    expect(keyMatches).not.toBeNull();
    expect(keyMatches!.length).toBeGreaterThanOrEqual(2);
  });
});
