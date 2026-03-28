# Research Summary: Tila UI Overhaul -- Premium Polish Stack

**Domain:** Mobile app UI polish (Expo / React Native)
**Researched:** 2026-03-28
**Overall confidence:** HIGH

## Executive Summary

Tila's existing stack (Expo 55, React Native 0.83, Reanimated 4.2.1, react-native-svg) already contains the core animation engine needed for premium polish. The research question was: what additional libraries are needed to go from "functional animations" to "Duolingo-level polish with Quranic elegance"?

The answer is five targeted additions: react-native-gesture-handler for interactive gestures, expo-linear-gradient and expo-blur for visual depth, @shopify/react-native-skia for GPU-accelerated effects (particles, shaders, ambient glow), and lottie-react-native for designer-created celebration animations. These are the exact tools used by award-winning Expo apps (Callie won the 2025 Expo App Awards' "Most Creative" using this same Reanimated + Skia combination).

Critically, Reanimated 4's new CSS Animations API (animationName with keyframes, transitionProperty) is the primary workhorse -- it handles 80%+ of needed animations declaratively, without the complexity of worklets. The existing Reanimated 4.2.1 installation already supports this. Skia and Lottie are reserved for the 20% of effects that CSS-style animations cannot express (particles, complex character animations, GPU shaders).

The main risk is performance on mid-range Android devices when multiple animation layers compound. The mitigation is simple: budget max 3 simultaneous animated layers per screen, test on real hardware, and use Reanimated's `useReducedMotion()` as an escape valve.

## Key Findings

**Stack:** Keep existing Reanimated 4.2.1 as primary engine. Add Skia for GPU effects, Lottie for celebrations, expo-blur/gradient for visual depth, Gesture Handler for interactions.
**Architecture:** Animation presets module centralizes timing. Celebration tier system (micro/small/big/milestone) maps achievement severity to visual intensity.
**Critical pitfall:** Skia rendering surfaces conflict with native views (z-ordering, touch passthrough). Use Skia only for self-contained visual areas, never layered behind interactive ScrollViews.

## Implications for Roadmap

Based on research, the stack additions should be phased to match the existing 4-phase overhaul plan:

1. **Foundation Polish (Phase 1 continuation)** - Install expo-linear-gradient, expo-blur, react-native-gesture-handler. These are lightweight, first-party Expo packages with zero configuration. Use immediately for gradient backgrounds, blur modals, and gesture feedback.
   - Addresses: skeleton shimmer screens, modal blur overlays, button feedback
   - Avoids: premature Skia/Lottie integration before animation architecture is stable

2. **Celebration System (Phase 2)** - Install lottie-react-native. Source/create Lottie files in Tila's color palette. Build tiered celebration system.
   - Addresses: lesson completion celebrations, streak milestones, progress visualization
   - Avoids: Lottie bundle bloat (budget 500KB total)

3. **Premium Effects (Phase 3)** - Install @shopify/react-native-skia. Build ambient background effects, particle systems, glow overlays.
   - Addresses: onboarding wow moment, Arabic calligraphy decorations, ambient effects
   - Avoids: Skia rendering surface conflicts (test z-ordering rigorously)

4. **Integration Polish (Phase 4)** - No new libraries. Combine all tools for final polish pass. Performance audit on mid-range Android.
   - Addresses: consistency across all screens, performance optimization
   - Avoids: animation performance death by a thousand cuts

**Phase ordering rationale:**
- Expo first-party packages (gradient, blur, gesture) have zero risk and immediate payoff -- install first
- Lottie before Skia because Lottie is simpler and handles celebration use cases that users notice most
- Skia last because it requires dev client builds and has the steepest learning curve
- Final phase is integration-only to catch performance regressions before shipping

**Research flags for phases:**
- Phase 3 (Skia): Needs deeper research on specific shader effects for Arabic calligraphy glow
- Phase 2 (Celebrations): May need deeper research on Lottie color theming at runtime (limited capability)
- Phase 1 and 4: Standard patterns, unlikely to need additional research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommended libraries are actively maintained, compatible with Expo SDK 55, and verified via npm/official docs |
| Features | HIGH | Feature landscape is well-defined by PROJECT.md constraints and Duolingo pattern analysis |
| Architecture | HIGH | Animation presets + celebration tiers are proven patterns from production apps |
| Pitfalls | HIGH | Performance, Skia z-ordering, and Lottie bloat are well-documented community issues |
| Skia shader specifics | MEDIUM | Skia is compatible and powerful, but specific shader implementations for Arabic glow need experimentation |
| react-native-css-animations | MEDIUM | Lab project from Software Mansion, not an official release. May not be maintained long-term. Presets are simple enough to copy if abandoned. |

## Gaps to Address

- Specific Lottie assets needed (celebration types, loading states) -- sourcing/creation is a design task, not a stack decision
- Skia shader recipes for Arabic calligraphy glow effects -- needs experimentation during Phase 3
- Phosphor icon migration plan -- when to replace existing icons needs a separate audit
- react-native-css-animations stability -- monitor as a lab project; have fallback plan of copying presets into project code

## Sources

- [Reanimated 4 Stable Release](https://blog.swmansion.com/reanimated-4-stable-release-the-future-of-react-native-animations-ba68210c3713)
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55)
- [React Native Skia - Expo Docs](https://docs.expo.dev/versions/latest/sdk/skia/)
- [Expo BlurView Docs](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [lottie-react-native npm](https://www.npmjs.com/package/lottie-react-native)
- [Callie - Expo App Awards 2025](https://expo.dev/blog/making-ai-feel-human-in-a-mobile-app-with-expo-reanimated-and-skia)

---
*Research summary for: Tila UI Overhaul -- Premium Polish*
*Researched: 2026-03-28*
