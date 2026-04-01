# Phase 2: Repo Cleanup & Design Consistency - Research

**Researched:** 2026-04-01
**Domain:** File cleanup, error handling guards, SVG icon replacement
**Confidence:** HIGH

## Summary

This phase covers four distinct requirements: removing Expo scaffold leftovers (STAB-05), wrapping RevenueCat initialization in try/catch (STAB-03), verifying audio error handling (STAB-04), and replacing unicode crescent emoji with an SVG component (STAB-06). All four are well-scoped, low-risk changes with clear boundaries.

STAB-04 (audio error handling) is VERIFIED COMPLETE. Both `playVoice` and `playSFX` in `src/audio/player.ts` have try/catch wrappers with console.warn, and comprehensive tests exist in `src/__tests__/audio-safety.test.ts`. No additional audio calls exist outside this file. The planner should mark STAB-04 as pre-satisfied with no tasks.

The scaffold cleanup is straightforward -- 8 files to delete, 1 file to update (`app/+not-found.tsx`). No other files in the codebase import from the scaffold files. The RevenueCat guard is a single-file change following established patterns. The crescent SVG replacement requires creating one new component and updating 2 files.

**Primary recommendation:** Execute as 3 small tasks (scaffold cleanup, RevenueCat guard, CrescentIcon SVG). STAB-04 requires zero work.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Delete files: `assets/fonts/SpaceMono-Regular.ttf`, `components/EditScreenInfo.tsx`, `components/useClientOnlyValue.ts`, `constants/Colors.ts`
- D-02: Also delete `components/Themed.tsx` and `components/StyledText.tsx` (scaffold files importing Colors.ts)
- D-03: Update `app/+not-found.tsx` to use real design system (`src/design/`) instead of Themed.tsx
- D-04: Verify no other imports reference deleted files before committing
- D-05: Wrap `Purchases.configure({ apiKey })` in `src/monetization/revenuecat.ts` in try/catch
- D-06: On failure: log to Sentry via `Sentry.captureException`, set `_initialized = false`, return silently
- D-07: No user-facing notice on failure -- silent degradation
- D-08: STAB-04 ALREADY COMPLETE -- no work needed
- D-09: Replace crescent emoji in: `src/components/home/AnimatedStreakBadge.tsx`, `app/phase-complete.tsx`, `app/return-welcome.tsx`
- D-10: SVG style: match BrandedLogo crescent (two overlapping circles)
- D-11: Color: use `colors.accent` (gold) as fill
- D-12: Create reusable `CrescentIcon` component in `src/design/`
- D-13: The `crescentCircle` decorative View in return-welcome.tsx can stay as-is (not a unicode character)

### Claude's Discretion
- SVG sizing and exact circle proportions for CrescentIcon
- Whether to use react-native-svg or inline SVG path
- Test approach for scaffold deletion verification

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STAB-03 | RevenueCat init wrapped in try/catch with free-tier fallback and Sentry logging | Verified `src/monetization/revenuecat.ts` line 23 has bare `Purchases.configure()`. Sentry is available via `@sentry/react-native`. Pattern established in `src/analytics/index.ts`. |
| STAB-04 | All audio calls wrapped in try/catch | VERIFIED COMPLETE. `playVoice` and `playSFX` both have try/catch. Tests in `audio-safety.test.ts` confirm. No work needed. |
| STAB-05 | Expo scaffold leftovers removed | Verified 8 files to delete, 1 file to update. No imports from scaffold files exist outside the scaffold cluster itself (except `app/+not-found.tsx`). |
| STAB-06 | Crescent emoji replaced with SVG icon | Verified emoji in 2 files (AnimatedStreakBadge line 67, phase-complete line 127). `return-welcome.tsx` uses a styled View, not emoji. `react-native-svg` 15.15.3 is installed. BrandedLogo crescent pattern available as reference. |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-svg | 15.15.3 | SVG rendering for CrescentIcon | Already in package.json, used by BrandedLogo |
| @sentry/react-native | 7.11.0 | Error reporting for RevenueCat guard | Already in stack, used in analytics |
| react-native-purchases | 9.15.0 | RevenueCat SDK (target of the guard) | Already in stack |

### No New Dependencies
This phase requires zero new packages. All work uses existing dependencies.

## Architecture Patterns

### Scaffold File Dependency Graph (DELETE ALL)

```
constants/Colors.ts
  <- components/Themed.tsx (imports Colors)
       <- components/StyledText.tsx (imports Themed)
       <- components/EditScreenInfo.tsx (imports StyledText + Colors)
       <- app/+not-found.tsx (imports Themed) [UPDATE, don't delete]
  <- components/useColorScheme.ts (used only by Themed.tsx)
  <- components/useColorScheme.web.ts (used only by Themed.tsx)
assets/fonts/SpaceMono-Regular.ttf (referenced only by StyledText)
components/useClientOnlyValue.ts (no imports found -- orphan)
```

**Total files to delete:** 8
1. `constants/Colors.ts`
2. `components/Themed.tsx`
3. `components/StyledText.tsx`
4. `components/EditScreenInfo.tsx`
5. `components/useClientOnlyValue.ts`
6. `components/useColorScheme.ts`
7. `components/useColorScheme.web.ts`
8. `assets/fonts/SpaceMono-Regular.ttf`

**File to update:** `app/+not-found.tsx` -- replace `import { Text, View } from '@/components/Themed'` with standard React Native `Text`/`View` + design system colors.

**Empty directories after deletion:** `constants/` will be empty and should be deleted. The `components/` directory may become empty and should be deleted if so.

### Pattern: RevenueCat Guard

Follow the exact pattern from `src/analytics/index.ts` line 16:
```typescript
try { initSentry(); } catch (e) { console.warn('Sentry init failed:', e); }
```

The RevenueCat guard should:
1. Import `* as Sentry from '@sentry/react-native'`
2. Wrap `Purchases.configure({ apiKey })` and `_initialized = true` in try/catch
3. In catch: call `Sentry.captureException(e)`, leave `_initialized` as false (default), console.warn
4. The app already defaults to free tier when `_initialized` is false (no configure = no purchases)

**Note:** `Sentry.captureException()` is NOT currently used anywhere in the codebase. This will be its first usage. The import exists in `src/analytics/sentry.ts` but only `Sentry.init`, `Sentry.setUser` are called. Adding `captureException` to the RevenueCat guard establishes a pattern for future error reporting.

### Pattern: CrescentIcon SVG Component

The BrandedLogo crescent uses two overlapping circles:
```
Circle cx=200 cy=160 r=52 fill={colors.primary}    -- main circle
Circle cx=218 cy=146 r=42 fill={colors.bgWarm}      -- cutout circle (creates crescent shape)
```

For the standalone CrescentIcon:
- Use `react-native-svg` (already a dependency at 15.15.3)
- Accept `size` and `color` props
- Normalize the circle coordinates to fit within a viewBox
- Fill the main circle with the passed color (default: `colors.accent`)
- Fill the cutout circle with `"transparent"` so the background shows through
- Place in `src/design/CrescentIcon.tsx`

### Anti-Patterns to Avoid
- **Don't use emoji as icons:** Cross-platform rendering varies. The crescent emoji renders differently on iOS vs Android vs different Android OEMs.
- **Don't import Sentry in every file:** Import directly from `@sentry/react-native` in `revenuecat.ts` since it's a standalone module, not through the analytics barrel.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG rendering | Custom drawing/canvas | react-native-svg `<Svg><Circle />` | Already in dependencies, hardware-accelerated |
| Error reporting | console.log to file | Sentry.captureException | Already configured, aggregates in dashboard |

## Common Pitfalls

### Pitfall 1: Broken Import After Scaffold Deletion
**What goes wrong:** Deleting scaffold files but missing an import reference causes a build failure.
**Why it happens:** Import references can be in unexpected locations (test files, config files, dynamically constructed paths).
**How to avoid:** After deletion, run `npm run validate` (lint + typecheck). The TypeScript compiler will catch any missing imports. Grep confirmed only `app/+not-found.tsx` imports from scaffold files.
**Warning signs:** TypeScript errors referencing deleted file paths.

### Pitfall 2: Empty `constants/` Directory Left Behind
**What goes wrong:** Git tracks the file deletion but leaves an empty directory, which looks messy.
**Why it happens:** Git doesn't track directories, only files. If `Colors.ts` is the only file in `constants/`, the directory disappears from git automatically. But local filesystem may keep it.
**How to avoid:** Verify `constants/` contains only `Colors.ts` before deleting. It does (verified). Git will handle directory cleanup automatically.

### Pitfall 3: Sentry Not Initialized When RevenueCat Fails
**What goes wrong:** `Sentry.captureException()` is called in the RevenueCat catch block, but Sentry itself may not be initialized yet.
**Why it happens:** Init order in `app/_layout.tsx` -- if RevenueCat initializes before Sentry, the capture call is a no-op.
**How to avoid:** Check init order. Sentry is initialized in `initAnalytics()` which is called in `_layout.tsx`. RevenueCat is also initialized there. Ensure Sentry init comes first. If unsure, `Sentry.captureException` silently no-ops when Sentry isn't configured -- it won't throw.

### Pitfall 4: CrescentIcon Transparent Cutout
**What goes wrong:** The crescent cutout circle uses a solid background color, which breaks when rendered over different backgrounds.
**Why it happens:** BrandedLogo uses `colors.bgWarm` for the cutout because it knows the background. A reusable icon can't assume the background.
**How to avoid:** Use SVG masking or set cutout fill to `"transparent"`. For simplicity, since the crescent is small and decorative, using a clip path or simply `"transparent"` fill works well at icon sizes.

### Pitfall 5: return-welcome.tsx False Positive
**What goes wrong:** Replacing the styled View `crescentCircle` in return-welcome.tsx when it's not actually a unicode emoji.
**Why it happens:** The file has "crescent" in variable names, misleading a search.
**How to avoid:** D-13 explicitly states the styled View can stay. The crescent is rendered via CSS (border-radius creating a circle shape), not via unicode. Only Text components rendering "unicode-character" need replacement.

## Code Examples

### Not-Found Screen Update (from scaffold to design system)
```typescript
// BEFORE (app/+not-found.tsx)
import { Text, View } from '@/components/Themed';

// AFTER
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/src/design/theme';
// Use colors.bg for background, colors.text for text, colors.accent for link
```

### RevenueCat Guard Pattern
```typescript
// src/monetization/revenuecat.ts
import * as Sentry from '@sentry/react-native';

// Inside initRevenueCat(), wrap configure call:
try {
  Purchases.configure({ apiKey });
  _initialized = true;
} catch (e) {
  Sentry.captureException(e);
  console.warn('RevenueCat init failed:', e);
  // _initialized remains false -- app defaults to free tier
}
```

### CrescentIcon Component Shape
```typescript
// src/design/CrescentIcon.tsx
import Svg, { Circle } from 'react-native-svg';

interface CrescentIconProps {
  size?: number;
  color?: string;
}

// Two overlapping circles: main + transparent cutout
// Proportions derived from BrandedLogo: main r=52, cutout r=42, offset dx=18 dy=-14
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAB-03 | RevenueCat init try/catch guard | unit (source scan) | `npx vitest run src/__tests__/revenuecat-guard.test.ts` | No -- Wave 0 |
| STAB-04 | Audio try/catch wrappers | unit (source scan) | `npx vitest run src/__tests__/audio-safety.test.ts` | Yes |
| STAB-05 | Scaffold files deleted, no broken imports | unit (fs check) + validate | `npm run validate` | No -- Wave 0 |
| STAB-06 | No unicode crescent emoji in components | unit (source scan) | `npx vitest run src/__tests__/crescent-icon.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm run validate && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/revenuecat-guard.test.ts` -- source scan test verifying try/catch around Purchases.configure (follow audio-safety.test.ts pattern)
- [ ] `src/__tests__/scaffold-cleanup.test.ts` -- fs.existsSync checks that deleted files don't exist, validate runs clean
- [ ] `src/__tests__/crescent-icon.test.ts` -- source scan test verifying no unicode crescent emoji in component files (grep for the character)

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/audio/player.ts` -- verified try/catch on playVoice (line 161) and playSFX (line 208)
- Codebase inspection: `src/__tests__/audio-safety.test.ts` -- 6 tests covering STAB-04
- Codebase inspection: `src/monetization/revenuecat.ts` -- bare Purchases.configure at line 23
- Codebase inspection: `components/Themed.tsx` -- only consumer of `constants/Colors.ts` and `components/useColorScheme.ts`
- Codebase inspection: `app/+not-found.tsx` -- only non-scaffold file importing from scaffold
- Codebase inspection: `src/components/onboarding/BrandedLogo.tsx` lines 149-151 -- crescent SVG reference
- Codebase inspection: `package.json` -- react-native-svg 15.15.3 confirmed installed

### Secondary (MEDIUM confidence)
- None needed -- all findings from direct codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed, versions verified in package.json
- Architecture: HIGH -- all files inspected, import graph fully traced
- Pitfalls: HIGH -- based on direct codebase analysis, not speculation

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable -- no external dependencies changing)
