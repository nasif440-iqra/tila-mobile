import { describe, it, expect } from 'vitest';
import type { ConfusionState } from '../engine/progress';

// ── ConfusionState type tests ──────────────────────────────────────

describe('ConfusionState', () => {
  it('accepts categories field with string-keyed number values', () => {
    const state: ConfusionState = {
      count: 3,
      lastSeen: '2026-03-29T10:00:00Z',
      categories: { visual_confusion: 2, sound_confusion: 1 },
    };
    expect(state.categories).toEqual({ visual_confusion: 2, sound_confusion: 1 });
  });

  it('works without categories field (backwards compatibility)', () => {
    const state: ConfusionState = {
      count: 1,
      lastSeen: null,
    };
    expect(state.categories).toBeUndefined();
  });

  it('accepts empty categories object', () => {
    const state: ConfusionState = {
      count: 0,
      lastSeen: null,
      categories: {},
    };
    expect(state.categories).toEqual({});
  });

  it('accepts categories with a single key', () => {
    const state: ConfusionState = {
      count: 5,
      lastSeen: '2026-03-28T08:00:00Z',
      categories: { visual_confusion: 5 },
    };
    expect(state.categories?.visual_confusion).toBe(5);
  });
});
