// Stagger ladder for content elements within a step
export const STAGGER_BASE = 150; // ms between elements
export const STAGGER_DURATION = 500; // ms per element animation

// Splash steps get a slower, more dramatic entrance
export const SPLASH_STAGGER_BASE = 250;
export const SPLASH_STAGGER_DURATION = 700;

// CTA button always enters last with a slight upward motion
export const CTA_DELAY_OFFSET = 200; // added after last content element
export const CTA_DURATION = 500;

// ── Transition presets (Phase 4a) ──
export const TRANSITION_FADE_IN = 300; // ms — container-level fade in
export const TRANSITION_FADE_OUT = 200; // ms — container-level fade out
export const TRANSITION_FADE_IN_DELAY = 100; // ms — delay before new content fades in
export const TRANSITION_LESSON_DURATION = 400; // ms — lesson slide up/down

// ── Sacred moment timing (Phase 2) ──
export const BISMILLAH_DISPLAY_DURATION = 2500; // ms — auto-advance timer for Bismillah step
export const STILLNESS_BEAT_DURATION = 1200; // ms — deliberate pause before Alif appears in LetterReveal

// Derived constant — no magic numbers downstream (per D-15)
export const LETTER_REVEAL_HAPTIC_DELAY =
  SPLASH_STAGGER_DURATION + STILLNESS_BEAT_DURATION; // 700 + 1200 = 1900ms — when to fire hapticMilestone in LetterReveal
