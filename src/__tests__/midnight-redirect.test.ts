import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const homeScreenSrc = fs.readFileSync(
  path.resolve(__dirname, '../../app/(tabs)/index.tsx'), 'utf-8'
);

describe('HomeScreen midnight redirect — Bug 4 regression', () => {
  it('today is pinned via useState, not recalculated on every render', () => {
    // Regression: Bug 4 — today must be frozen for session lifetime
    // useState(() => getTodayDateString()) pins the date on mount
    expect(homeScreenSrc).toContain('useState(() => getTodayDateString())');
  });

  it('today is NOT a bare const recalculated on render', () => {
    // Regression: Bug 4 — the old pattern must not exist
    // Old: const today = getTodayDateString();
    // The line should NOT exist as a bare const (only inside useState)
    const lines = homeScreenSrc.split('\n');
    const bareConstLines = lines.filter(line =>
      line.includes('const today = getTodayDateString()') &&
      !line.includes('useState')
    );
    expect(bareConstLines.length).toBe(0);
  });
});
