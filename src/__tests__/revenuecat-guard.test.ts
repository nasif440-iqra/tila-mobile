import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('RevenueCat init guard (STAB-03)', () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, '../monetization/revenuecat.ts'),
    'utf-8'
  );

  it('has try/catch around Purchases.configure', () => {
    expect(src).toMatch(/try\s*\{[\s\S]*Purchases\.configure/);
  });

  it('catches exceptions with Sentry', () => {
    expect(src).toContain('Sentry.captureException');
  });

  it('imports Sentry', () => {
    expect(src).toMatch(/import.*Sentry.*from.*@sentry\/react-native/);
  });

  it('logs warning on failure', () => {
    expect(src).toContain("console.warn('RevenueCat init failed:");
  });
});
