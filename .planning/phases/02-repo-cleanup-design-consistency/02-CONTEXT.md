# Phase 2: Repo Cleanup & Design Consistency - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning
**Source:** MASTER-PLAN.md (Block 1, items 1.3–1.6) + codebase scout

<domain>
## Phase Boundary

Remove all Expo scaffold leftovers, guard RevenueCat initialization, and replace crescent emoji with a proper SVG icon matching the existing BrandedLogo style. Audio error handling (STAB-04) is already complete from v1.0 — verified in codebase.

</domain>

<decisions>
## Implementation Decisions

### Scaffold Cleanup (STAB-05)
- **D-01:** Delete these files: `assets/fonts/SpaceMono-Regular.ttf`, `components/EditScreenInfo.tsx`, `components/useClientOnlyValue.ts`, `constants/Colors.ts`
- **D-02:** Also delete `components/Themed.tsx` and `components/StyledText.tsx` — these are scaffold files that import from `constants/Colors.ts`
- **D-03:** Update `app/+not-found.tsx` to use the real design system (`src/design/`) instead of importing from `Themed.tsx`
- **D-04:** Verify no other imports reference any deleted files before committing

### RevenueCat Init Guard (STAB-03)
- **D-05:** Wrap `Purchases.configure({ apiKey })` in `src/monetization/revenuecat.ts` line 23 in try/catch
- **D-06:** On failure: log to Sentry via `Sentry.captureException`, set `_initialized = false`, return silently (app defaults to free tier)
- **D-07:** No user-facing notice on failure — silent degradation matching the audio error pattern from v1.0

### Audio Error Handling (STAB-04)
- **D-08:** ALREADY COMPLETE from v1.0. Both `playVoice` and `playSFX` in `src/audio/player.ts` are wrapped in try/catch with console.warn. No work needed — mark STAB-04 as satisfied.

### Crescent Emoji → SVG Icon (STAB-06)
- **D-09:** Replace ☽ emoji in 3 files: `src/components/home/AnimatedStreakBadge.tsx`, `app/phase-complete.tsx`, `app/return-welcome.tsx`
- **D-10:** SVG style: match the BrandedLogo crescent from `src/components/onboarding/BrandedLogo.tsx` — two overlapping circles creating a crescent shape
- **D-11:** Color: use `colors.accent` (gold) as the fill, matching current emoji color usage
- **D-12:** Create a reusable `CrescentIcon` component in `src/design/` (consistent with design system location)
- **D-13:** The `crescentCircle` decorative element in `return-welcome.tsx` (a styled View, not an emoji) can stay as-is — it's already a proper styled component, not a unicode character

### Claude's Discretion
- SVG sizing and exact circle proportions for the CrescentIcon
- Whether to use react-native-svg or inline SVG path
- Test approach for scaffold deletion verification

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scaffold Files (to delete)
- `components/EditScreenInfo.tsx` — Expo template component
- `components/Themed.tsx` — Expo template themed components (imports Colors.ts)
- `components/StyledText.tsx` — Expo template styled text (imports Themed.tsx)
- `components/useClientOnlyValue.ts` — Expo template web-only hook
- `constants/Colors.ts` — Expo template color constants (NOT the real design system)
- `assets/fonts/SpaceMono-Regular.ttf` — Expo template font

### Files That Need Updating
- `app/+not-found.tsx` — Currently imports from Themed.tsx, needs to use src/design/
- `src/components/home/AnimatedStreakBadge.tsx` — Has ☽ emoji at line 67
- `app/phase-complete.tsx` — Has ☽ emoji at line 127
- `app/return-welcome.tsx` — Has crescent comment but uses styled View (may not need change)

### Design System (source of truth)
- `src/design/tokens.ts` — Colors, typography, spacing
- `src/design/theme.ts` — useColors() hook
- `src/components/onboarding/BrandedLogo.tsx` — Contains crescent moon SVG to match (lines 149-151)

### RevenueCat
- `src/monetization/revenuecat.ts` — initRevenueCat function, line 23

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BrandedLogo.tsx` crescent SVG: two circles (cx=200 cy=160 r=52 primary, cx=218 cy=146 r=42 cutout)
- `src/design/` has tokens, theme, and shared components — new CrescentIcon belongs here
- `useColors()` hook provides theme colors including `accent` (gold #C4A464)

### Established Patterns
- Audio error handling: try/catch + console.warn, no user-facing error (v1.0 pattern)
- Design system: all UI uses `src/design/` tokens and `useColors()` — never `constants/Colors.ts`
- SVG components: react-native-svg already in dependencies (used by BrandedLogo)

### Integration Points
- `app/+not-found.tsx` needs to switch from Themed.tsx imports to src/design/ imports
- CrescentIcon replaces Text components rendering "☽" in AnimatedStreakBadge and phase-complete

</code_context>

<specifics>
## Specific Ideas

- The `src/__tests__/home-streak.test.ts` has a todo: `it.todo("displays crescent icon")` — this should be implemented as part of the CrescentIcon work
- The `crescentCircle` in return-welcome.tsx is a decorative View with border styling, not a unicode emoji — it may not need replacement (verify during implementation)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-repo-cleanup-design-consistency*
*Context gathered: 2026-04-01*
