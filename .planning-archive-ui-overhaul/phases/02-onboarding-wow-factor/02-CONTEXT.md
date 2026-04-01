# Phase 2: Onboarding Wow Factor - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the onboarding flow from functional to stunning. Elevate every screen — Welcome, Tilawat, Hadith, StartingPoint, LetterReveal, LetterAudio, LetterQuiz, Finish — with richer visual warmth, branded assets, and polished animations. The signature moment is the "first letter" Alif reveal, which should feel elegant and sacred. Add a Bismillah breathing moment during onboarding AND before the first lesson of each app session.

</domain>

<decisions>
## Implementation Decisions

### Logo & Branding
- **D-01:** Replace the hand-coded SVG logo in Welcome screen with the real branded logos from `assets/logo/`. Use `tila-transparent-mark.svg` for the mark and the appropriate lockup for the full brand display.
- **D-02:** All onboarding screens should use the branded assets consistently — the crescent moon, stars, arch, and gold accents are the visual identity.

### First Letter Sacred Moment (LetterReveal)
- **D-03:** Elegant but restrained — not over-the-top. Warm glow intensifies, Alif fades in beautifully with a brief pause, then audio plays. Special but dignified.
- **D-04:** A beat of stillness (1-2 seconds) before the audio plays — let the letter sit with visual weight before sound confirms it.
- **D-05:** Subtle haptic pulse when the letter appears (milestone-tier from Phase 1 haptics system).
- **D-06:** Gold accent glow should be the visual signature — matches the branded crescent moon + keystone accent color.

### Bismillah Breathing Moment
- **D-07:** Bismillah appears during onboarding flow (between StartingPoint and LetterReveal, or as its own step).
- **D-08:** Bismillah also appears before the FIRST lesson of each app session — not every lesson, just the first one per session. This makes it a centering ritual.
- **D-09:** Duration: 2-3 seconds. Brief enough to not feel like friction. Beautiful Arabic calligraphy with gentle fade and warm glow.
- **D-10:** No skip button on the Bismillah moment — it's part of the experience, and at 2-3 seconds it's not long enough to annoy.

### Overall Onboarding Richness
- **D-11:** Elevate ALL onboarding screens, not just the letter moment. Every step should feel visually warm and intentional.
- **D-12:** Welcome screen gets the biggest upgrade — real branded logo, richer entrance animations, warmer visual treatment.
- **D-13:** Tilawat and Hadith screens should feel reverent — these set the Islamic context. Elegant typography, warm tones, subtle glow.
- **D-14:** Finish screen should feel celebratory — the user just completed onboarding, acknowledge it warmly.

### Animation & Transitions
- **D-15:** Use Phase 1's shared animation presets (`src/design/animations.ts`) for all timing — no new magic numbers.
- **D-16:** Step transitions should feel flowing — staggered content entrances, smooth fades between steps.
- **D-17:** Floating letters layer (already exists) should be preserved and potentially enhanced with warmer gold tones.

### Claude's Discretion
- Exact placement of Bismillah in the onboarding step sequence (could be a new step or integrated into LetterReveal)
- How to implement "first lesson per session" detection for Bismillah (likely via session timestamp in SecureStore)
- Specific animation choreography for each screen's entrance
- Whether to add new visual elements (decorative borders, Islamic geometric patterns) or enhance existing ones
- How to render SVG logo assets in React Native (react-native-svg or image conversion)
- FloatingLettersLayer enhancement approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Branded Assets
- `assets/logo/tila-logo-primary.svg` — Primary logo with dark green background, animated crescent/stars/arch
- `assets/logo/tila-transparent-mark.svg` — Transparent mark for light backgrounds
- `assets/logo/tila-horizontal-lockup.svg` — Horizontal brand lockup
- `assets/logo/tila-logo-light.svg` — Light variant
- `assets/logo/tila-app-icon.svg` — App icon
- `assets/logo/tila-favicon.svg` — Favicon

### Onboarding Code
- `src/components/onboarding/OnboardingFlow.tsx` — Main 8-step orchestrator
- `src/components/onboarding/OnboardingStepLayout.tsx` — Shared layout wrapper
- `src/components/onboarding/FloatingLettersLayer.tsx` — Animated background letters
- `src/components/onboarding/WarmGlow.tsx` — Ambient glow effect
- `src/components/onboarding/ProgressBar.tsx` — Step progress indicator
- `src/components/onboarding/animations.ts` — Bridge file (onboarding-specific constants + re-exports from design/animations)
- `src/components/onboarding/steps/Welcome.tsx` — Welcome screen with inline SVG logo (to be replaced)
- `src/components/onboarding/steps/LetterReveal.tsx` — Alif reveal (to be elevated)
- `src/components/onboarding/steps/LetterAudio.tsx` — Audio playback step
- `src/components/onboarding/steps/LetterQuiz.tsx` — First quiz
- `src/components/onboarding/steps/Tilawat.tsx` — Islamic context
- `src/components/onboarding/steps/Hadith.tsx` — Motivational hadith
- `src/components/onboarding/steps/StartingPoint.tsx` — Level selection
- `src/components/onboarding/steps/Finish.tsx` — Completion celebration

### Design System (from Phase 1)
- `src/design/animations.ts` — Shared animation presets (springs, durations, staggers, easings)
- `src/design/haptics.ts` — Haptic feedback presets (tap, success, error, milestone)
- `src/design/tokens.ts` — Color tokens, typography, spacing
- `src/design/theme.ts` — Theme context with useColors()

### Research
- `.planning/research/FEATURES.md` — Differentiator analysis (onboarding letter moment, Bismillah breathing)
- `.planning/research/PITFALLS.md` — Arabic diacritic clipping risks, Reanimated performance

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **WarmGlow component:** Already creates accent-colored radial gradient. Can be enhanced for the letter reveal.
- **FloatingLettersLayer:** 12 Arabic letters with continuous animations. Already shows on steps 0-2.
- **OnboardingStepLayout:** Layout wrapper with splash and normal variants. Used by all steps.
- **Phase 1 animations.ts:** Centralized presets (springs, durations, staggers, easings) — use for all new animations.
- **Phase 1 haptics.ts:** Named presets including `hapticMilestone` — use for letter reveal moment.
- **Branded SVG logos:** Full animated SVGs with crescent, stars, arch, gold glow effects.

### Established Patterns
- **Step transitions:** Controlled by OnboardingFlow via step state. FadeIn/FadeOut for container, FadeInDown/FadeInUp for content elements.
- **Stagger pattern:** SPLASH_STAGGER_BASE (250ms) between elements, SPLASH_STAGGER_DURATION (700ms) per element.
- **Audio integration:** `playOnboardingAdvance()` on step change, `playLetterName()` for audio.
- **Auto-advance:** LetterReveal auto-advances to LetterAudio after 3.5s timeout.

### Integration Points
- **OnboardingFlow.tsx:** Step orchestrator — Bismillah step would be added here (new step or integrated).
- **app/onboarding.tsx:** Route entry point — renders OnboardingFlow.
- **app/lesson/[id].tsx:** Lesson entry — Bismillah per-session would be triggered here.
- **expo-secure-store:** Already used for install date tracking — can track session Bismillah state.

</code_context>

<specifics>
## Specific Ideas

- Use the real branded logos from `assets/logo/` — the user specifically requested these be included
- "Elegant but restrained" for the first letter — special but dignified, not fireworks
- Bismillah before first lesson per session is a ritual/centering concept, not just a splash screen
- The whole onboarding should feel like opening a beautiful manuscript for the first time
- Target audience (converts) may feel intimidated — every screen should feel welcoming and encouraging

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-onboarding-wow-factor*
*Context gathered: 2026-03-28*
