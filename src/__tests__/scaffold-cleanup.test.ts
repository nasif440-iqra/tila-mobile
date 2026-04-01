import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SCAFFOLD_FILES = [
  'assets/fonts/SpaceMono-Regular.ttf',
  'components/EditScreenInfo.tsx',
  'components/Themed.tsx',
  'components/StyledText.tsx',
  'components/useClientOnlyValue.ts',
  'components/useColorScheme.ts',
  'components/useColorScheme.web.ts',
  'constants/Colors.ts',
];

describe('Scaffold cleanup (STAB-05)', () => {
  for (const file of SCAFFOLD_FILES) {
    it(`${file} is deleted`, () => {
      const fullPath = path.resolve(__dirname, '../../', file);
      expect(fs.existsSync(fullPath)).toBe(false);
    });
  }

  it('app/+not-found.tsx does not import from scaffold', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../app/+not-found.tsx'),
      'utf-8'
    );
    expect(content).not.toContain('@/components/Themed');
    expect(content).not.toContain('constants/Colors');
    expect(content).toContain('useColors');
  });
});
