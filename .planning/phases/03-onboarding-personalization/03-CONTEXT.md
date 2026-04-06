# Phase 3: Sacred Moments - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Onboarding and Bismillah feel like spiritual thresholds, not static content — text unfolds word-by-word instead of appearing all at once, creating genuine moments of revelation. This phase builds a shared PhraseReveal primitive and applies it to Bismillah (as a micro-lesson), Tilawah, and Hadith screens. All onboarding screens get AtmosphereBackground. Finish screen gains gravity.

</domain>

<decisions>
## Implementation Decisions

### Phrase Reveal Primitive (SACR-01)
- **D-01:** Build a shared `PhraseReveal` component that takes Arabic words + transliterations as data. Used by Bismillah, Tilawah, and Hadith screens.
- **D-02:** Auto-timed reveal — words appear automatically with staggered timing (600-800ms per word, 300-400ms stagger). Tap anywhere to skip ahead.
- **D-03:** Transliteration fades in beneath each Arabic word after it reveals — creates a two-line pair per word. Clear connection between Arabic and pronunciation.
- **D-04:** English meaning appears per-word ONLY in Bismillah (teaching moment). Tilawah and Hadith show full English translation after the reveal completes.

### Bismillah Micro-Lesson (SACR-02)
- **D-05:** Break Bismillah into 4 semantic units: Bismi / Allahi / Ar-Rahmani / Ar-Raheem. Each unit shows Arabic word, transliteration, and English meaning.
- **D-06:** All 4 units auto-reveal sequentially using the PhraseReveal primitive. The current 4-second auto-advance timer is removed.
- **D-07:** After all 4 units reveal, show a CTA button (e.g., "Continue"). User absorbs at their own pace — no auto-advance on sacred content.
- **D-08:** Stacked vertical layout — each unit on its own row: Arabic word on top, transliteration below, meaning below that. Clean, spacious, meditative.

### Onboarding Atmosphere (SACR-03, SACR-04, SACR-05)
- **D-09:** Wrap the entire onboarding flow in AtmosphereBackground 'onboarding' preset. Every step feels like one continuous inhabited space.
- **D-10:** Welcome screen: AtmosphereBackground only. Keep existing staggered fade-in animations and BrandedLogo. The atmosphere IS the upgrade.
- **D-11:** Tilawah screen: Replace static Arabic block with word-by-word PhraseReveal. Remove ShimmerWord animation (replaced by reveal). Keep headline and motto text.
- **D-12:** Hadith screen: Keep ArchOutline and WarmGlow (they add atmosphere). Replace static quote with word-by-word PhraseReveal. Keep source attribution.

### Finish Screen Gravity (SACR-06)
- **D-13:** Replace bouncy spring checkmark with gentle fade-in + subtle scale settle (1.02→1.0). Checkmark appears quietly — gravity, not celebration.
- **D-14:** Keep the ambient Alif watermark (200px, 8% opacity). It's subtle and ties back to "you're about to learn your first letter."
- **D-15:** Keep CTA text as "Start Lesson 1" — direct, clear, grounding after emotional buildup.

### Claude's Discretion
- PhraseReveal animation easing curves and exact timing values within the 600-800ms/300-400ms ranges
- Reduce Motion fallback for PhraseReveal (likely: show all words at once with simple fade)
- Where to place AtmosphereBackground wrapper (OnboardingFlow level vs per-screen)
- Exact scale settle curve for Finish checkmark
- Whether Bismillah CTA says "Continue" or something else
- Typography sizing for transliteration text in PhraseReveal
- Whether PhraseReveal lives in `src/design/components/` or `src/components/shared/`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Onboarding Screens (modify these)
- `src/components/onboarding/steps/BismillahMoment.tsx` — Current Bismillah screen (replace with micro-lesson using PhraseReveal)
- `src/components/onboarding/steps/Tilawat.tsx` — Current Tilawah screen (replace static Arabic with PhraseReveal, remove ShimmerWord)
- `src/components/onboarding/steps/Hadith.tsx` — Current Hadith screen (replace static quote with PhraseReveal, keep ArchOutline + WarmGlow)
- `src/components/onboarding/steps/Welcome.tsx` — Welcome screen (atmosphere only, no content changes)
- `src/components/onboarding/steps/Finish.tsx` — Finish screen (replace bouncy spring with gentle settle)
- `src/components/onboarding/OnboardingStepLayout.tsx` — Layout wrapper with splash/centered/card variants
- `src/components/onboarding/OnboardingFlow.tsx` — Flow orchestrator (may need AtmosphereBackground wrapper)

### Atmosphere System (reference, built in Phase 1)
- `src/design/atmosphere/AtmosphereBackground.tsx` — Ambient background with presets (use 'onboarding' and 'sacred')
- `src/design/atmosphere/WarmGlow.tsx` — SVG RadialGradient with breathing animation (used in Hadith)
- `src/design/atmosphere/FloatingLettersLayer.tsx` — Drifting Arabic letters (optional for onboarding)

### Design System (extend these)
- `src/design/tokens.ts` — Typography tiers, colors, spacing
- `src/design/animations.ts` — Animation tokens (breathing, drift, settle from Phase 1)
- `src/design/components/ArabicText.tsx` — Arabic text component with size tiers
- `src/design/haptics.ts` — hapticSelection (used in BismillahMoment)

### Audio
- `src/audio/player.ts` — playSacredMoment() function (used in BismillahMoment, keep)

### Project Context
- `.planning/PROJECT.md` — Emotional Design Contract, constraints
- `.planning/REQUIREMENTS.md` — SACR-01 through SACR-06

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AtmosphereBackground` (Phase 1): Has 'onboarding' and 'sacred' presets ready to use
- `WarmGlow` (Phase 1): SVG RadialGradient with breathing, useReducedMotion — already used in Hadith
- `OnboardingStepLayout`: 3 variants (splash/centered/card), handles safe area + footer — all screens use this
- `ArabicText`: Size tier component with display/large/body/quizHero/quizOption — use for PhraseReveal Arabic
- `playSacredMoment()`: Audio cue for Bismillah — keep in micro-lesson
- `hapticSelection()`: Subtle haptic for Bismillah entrance — keep
- `springs.bouncy`: Currently used in Finish checkmark — replace with gentle ease

### Established Patterns
- Onboarding steps receive `onNext` prop, render content, call `onNext()` to advance
- Stagger animations use `SPLASH_STAGGER_BASE` and `SPLASH_STAGGER_DURATION` constants from `src/components/onboarding/animations.ts`
- AtmosphereBackground wraps content and provides ambient visuals behind children
- Reduce Motion handled via `useReducedMotion()` from Reanimated — all new animations must respect this

### Integration Points
- `OnboardingFlow.tsx` — wrap in AtmosphereBackground at the flow level (all steps inherit atmosphere)
- `BismillahMoment.tsx` — remove 4s setTimeout, add CTA button, use PhraseReveal for 4 semantic units
- `Tilawat.tsx` — remove ShimmerWord component, use PhraseReveal for Arabic word-by-word
- `Hadith.tsx` — keep WarmGlow + ArchOutline, use PhraseReveal for quote
- `Finish.tsx` — replace `withSpring(1.0, springs.bouncy)` with gentle fade-in + scale settle

</code_context>

<specifics>
## Specific Ideas

- The PhraseReveal should feel like calligraphy being written — words appearing as if drawn by an invisible hand, not flipping through cards
- Bismillah is both a spiritual threshold AND a first teaching moment — "This is sacred, and you're about to be able to read it yourself"
- The stacked vertical layout for Bismillah should feel meditative and spacious — no information density
- AtmosphereBackground on the entire onboarding flow creates one continuous inhabited space — "like entering a quiet room"
- The Finish screen checkmark settling quietly says "this is real" — no party, just arrival

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-sacred-moments*
*Context gathered: 2026-04-06*
