# Phase 7: Loading & Error States - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure no screen ever feels broken, blank, or abandoned. Add a branded loading state for app launch, encouraging empty states for screens with no data, and an error boundary that catches crashes gracefully with recovery. This is the final polish phase — closing the last gaps in the user experience.

</domain>

<decisions>
## Implementation Decisions

### Loading State
- **D-01:** App launch should show a beautiful branded loading state — not a white screen or generic spinner. Use the Tila brand identity (crescent, warm cream, gold accents).
- **D-02:** The loading state should feel like part of the app experience, not a technical delay.

### Empty States
- **D-03:** Empty states (no progress, no lessons completed, first-time screens) should show encouraging guidance. Warm tone, Islamic encouragement where appropriate.
- **D-04:** Empty states should make the user feel welcomed, not like they're seeing an error.

### Error Boundary
- **D-05:** App crashes should be caught gracefully with a recovery option (restart/retry). Not a white screen of death.
- **D-06:** Error state should maintain the brand look — warm cream background, gentle messaging, clear action button.

### Claude's Discretion
- Specific branded loading screen design (how to use splash screen vs. custom loading component)
- Which screens need empty states (progress screen with zero data, home screen before first lesson)
- Error boundary implementation approach (React error boundary component)
- Whether to use the BrandedLogo from Phase 2 in the loading screen
- Recovery mechanism (reload app, navigate back, retry action)

</decisions>

<canonical_refs>
## Canonical References

### Current Loading/Error Code
- `app/_layout.tsx` — Root layout with font loading, splash screen management
- `src/db/provider.tsx` — DatabaseProvider that returns null during init

### Brand Assets
- `src/components/onboarding/BrandedLogo.tsx` — Animated branded logo (Phase 2)
- `src/components/onboarding/WarmGlow.tsx` — Animated warm glow

### Design System
- `src/design/animations.ts` — Shared animation presets
- `src/design/haptics.ts` — Haptic presets
- `src/design/tokens.ts` — Color tokens, typography

</canonical_refs>

<code_context>
## Existing Code Insights

### Current State
- `app/_layout.tsx` loads fonts and initializes analytics. If fonts aren't loaded, it returns null (white screen).
- `src/db/provider.tsx` DatabaseProvider returns null during DB init — children don't render until DB is ready.
- No error boundary exists anywhere in the app.
- No empty state components exist — screens with no data show blank space or a loading spinner.

### Reusable Assets
- **BrandedLogo (Phase 2):** Animated crescent/stars/arch — perfect for loading screen.
- **WarmGlow (Phase 2):** Animated warm glow for visual warmth on loading/empty screens.
- **Design tokens:** Full color/typography system for consistent branding.

</code_context>

<specifics>
## Specific Ideas

- Loading screen should feel like the app is welcoming you, not making you wait
- Empty states are an opportunity to encourage, not just fill space
- Error recovery should be simple and clear — one button, not a technical error message

</specifics>

<deferred>
## Deferred Ideas

None — final phase scope

</deferred>

---

*Phase: 07-loading-error-states*
*Context gathered: 2026-03-29*
