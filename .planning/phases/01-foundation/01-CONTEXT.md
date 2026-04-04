# Phase 1: Foundation - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the infrastructure every subsequent phase depends on: fix Arabic typography clipping, create a global ambient background system, add breathing/drift animation tiers, implement Reduce Motion accessibility, and fix the FloatingLettersLayer 12-minute freeze bug.

This phase delivers zero visible new features to users — it delivers the primitives that make Phases 2 and 3 possible. Success means every screen has consistent atmosphere, Arabic never clips, and animations respect accessibility.

</domain>

<decisions>
## Implementation Decisions

### Ambient Background System
- **D-01:** Claude's Discretion on where to wrap — root layout vs per-screen wrapper. Claude should pick the approach that works best with Expo Router's nested layout structure. Both are valid; optimize for consistency and minimal per-screen boilerplate.
- **D-02:** Claude's Discretion on WarmGlow fate — relocate+enhance vs build new. WarmGlow is proven (SVG RadialGradient, 17 files use it). Claude decides whether to relocate to `src/design/atmosphere/` and enhance, or build a new AmbientBackground system that uses WarmGlow internally for point-of-light effects.
- **D-03:** Claude's Discretion on preset system — presets (named moods like 'home', 'sacred', 'quiz') vs raw composition. Claude picks what centralizes aesthetic decisions best.
- **D-04:** Claude's Discretion on WarmGradient replacement — replace all WarmGradient imports now vs deprecate and migrate incrementally. Claude decides based on effort vs consistency tradeoff.

### Arabic Typography Fix
- **D-05:** Fix ALL Arabic tiers, not just display. Update lineHeight ratios for display (72px), large (36px), AND body (24px). Research says minimum 1.67x for Quranic text with stacked diacritics.
- **D-06:** Add overflow:visible to Arabic text containers to prevent clipping.
- **D-07:** Add a new quiz-hero size tier (48-56px) between display and large for quiz contexts where Arabic should feel like primary content.
- **D-08:** Full cross-platform audit — verify on both iOS and Android that no diacritic is clipped at any tier.

### Animation Tiers
- **D-09:** Breathing cycle = 4.5 seconds (2s inhale, 0.5s hold, 2s exhale). Matches meditative breathing rhythm. This is the heartbeat of the ambient system.
- **D-10:** Drift cycle = 18-24 seconds. Barely perceptible background movement. Like sunlight moving across a wall.
- **D-11:** Keep existing interaction timers (150-600ms) unchanged. Add breathing and drift as new tiers in animations.ts alongside existing springs/durations/easings.

### Reduce Motion
- **D-12:** Full accessibility implementation. When device Reduce Motion is enabled: disable ALL ambient animations (breathing, drift, floating letters), replace ALL entrance animations (slide, stagger) with simple opacity fades, use static warm backgrounds instead of animated gradients.
- **D-13:** Use `useReducedMotion()` from Reanimated 4.2.1 — already installed, synchronous, works on all platforms.

### FloatingLettersLayer Bug Fix
- **D-14:** Replace `withRepeat(-1)` with a restart-loop pattern that avoids the 12-minute Android freeze. Keep the same visual behavior — 12 drifting Arabic letters at low opacity.

### Claude's Discretion
- Ambient system architecture (root vs per-screen, preset vs composition, WarmGlow relocation strategy)
- WarmGradient migration approach
- Specific lineHeight multiplier values per tier (minimum 1.67x for display, empirically tested)
- Animation easing curves for breathing and drift
- FloatingLettersLayer restart-loop implementation approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `src/design/tokens.ts` — Current color tokens, typography definitions (arabicDisplay/Large/Body), spacing
- `src/design/animations.ts` — Current animation timers, springs, easings (interaction tier only)
- `src/design/components/ArabicText.tsx` — Current Arabic text component with size tiers
- `src/design/components/WarmGradient.tsx` — Old banded-View gradient (may be replaced)
- `src/design/theme.tsx` — ThemeContext, useColors() hook

### Atmosphere Components
- `src/components/onboarding/WarmGlow.tsx` — SVG RadialGradient primitive (17 files import this)
- `src/components/onboarding/FloatingLettersLayer.tsx` — Drifting Arabic letters (has withRepeat(-1) bug)

### Research
- `.planning/research/PITFALLS.md` — Arabic clipping details, withRepeat bug, SVG perf warnings, animation budget (15-20 shared values)
- `.planning/research/ARCHITECTURE.md` — Component composition patterns, Reduce Motion architecture
- `.planning/research/STACK.md` — Available libraries, what NOT to add

### Project Context
- `.planning/PROJECT.md` — Emotional Design Contract, constraints
- `.planning/REQUIREMENTS.md` — FOUN-01 through FOUN-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WarmGlow` (onboarding/WarmGlow.tsx): Proven SVG RadialGradient with static and animated modes. Good API (size, opacity, animated, color, pulseMin, pulseMax). 17 files use it.
- `WarmGradient` (design/components/WarmGradient.tsx): Old banded-View approach. Still imported but inferior to WarmGlow.
- `animations.ts`: Clean token-based structure with springs, durations, staggers, easings. Easy to extend with new tiers.
- `ArabicText`: Clean component with size prop ('display' | 'large' | 'body'). Easy to add 'quizHero' tier.

### Established Patterns
- Design system lives in `src/design/` — tokens, theme, components
- Components use `useColors()` for theme access
- Reanimated is the animation standard — springs, timings, shared values
- SVG via react-native-svg for gradient effects (proven in WarmGlow)

### Integration Points
- `app/_layout.tsx` — root layout, potential ambient background wrapper location
- `app/(tabs)/_layout.tsx` — tab layout, another potential wrapper location
- All screens import from `src/design/tokens` for typography — single place to fix lineHeight

</code_context>

<specifics>
## Specific Ideas

- User reference: "like walking into the National Mosque of Malaysia" — light as architecture, cleanliness as reverence, softness as welcome
- Breathing rhythm should feel meditative, not mechanical
- Drift should feel like sunlight moving across a wall
- Background motion exists whether you notice it or not — "patterns exist whether you notice them or not"
- Arabic letters are living presences — this phase's typography fix enables that in Phase 2
- SVG is wrong for animated effects on Android (from research) — use View opacity/scale for animations, SVG for static gradients only

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-04*
