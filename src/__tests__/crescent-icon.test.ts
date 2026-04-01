import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

describe('Crescent icon (STAB-06)', () => {
  it('CrescentIcon component exists', () => {
    const filePath = path.resolve(__dirname, '../design/CrescentIcon.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('CrescentIcon exports a named function', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../design/CrescentIcon.tsx'),
      'utf-8'
    );
    expect(content).toMatch(/export\s+function\s+CrescentIcon/);
  });

  it('no unicode crescent emoji in component files', () => {
    const componentDirs = [
      path.resolve(__dirname, '../components'),
      path.resolve(__dirname, '../../app'),
    ];
    for (const dir of componentDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = glob.sync('**/*.{tsx,ts}', { cwd: dir });
      for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        expect(content, `${file} still contains crescent emoji`).not.toContain('\u263D');
      }
    }
  });

  it('AnimatedStreakBadge uses CrescentIcon', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../components/home/AnimatedStreakBadge.tsx'),
      'utf-8'
    );
    expect(content).toContain('CrescentIcon');
  });

  it('phase-complete uses CrescentIcon', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../app/phase-complete.tsx'),
      'utf-8'
    );
    expect(content).toContain('CrescentIcon');
  });
});
