# Phase 7: Loading & Error States - Research

**Researched:** 2026-03-28
**Domain:** React Native loading states, error boundaries, empty state UX
**Confidence:** HIGH

## Summary

Phase 7 closes the last UX gaps: a branded loading experience during app init, encouraging empty states for screens with no data, and an error boundary that catches crashes gracefully. The app currently shows nothing (returns `null`) during font loading and database initialization, has no error boundary anywhere, and screens with no data show a generic `ActivityIndicator`.

The technical scope is modest: one branded loading component for the app shell, two empty state components (home + progress), and one error boundary wrapping the app. All reuse existing brand assets (BrandedLogo, WarmGlow) and design tokens. Sentry already ships `Sentry.ErrorBoundary` which integrates error reporting automatically.

**Primary recommendation:** Use `Sentry.ErrorBoundary` from `@sentry/react-native` (already installed v7.11.0) as the error boundary wrapper, with a custom branded fallback component. Replace the `null` returns in `_layout.tsx` and `provider.tsx` with a branded loading screen reusing BrandedLogo from Phase 2. Add empty state components to home and progress screens.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: App launch should show a beautiful branded loading state -- not a white screen or generic spinner. Use the Tila brand identity (crescent, warm cream, gold accents).
- D-02: The loading state should feel like part of the app experience, not a technical delay.
- D-03: Empty states (no progress, no lessons completed, first-time screens) should show encouraging guidance. Warm tone, Islamic encouragement where appropriate.
- D-04: Empty states should make the user feel welcomed, not like they're seeing an error.
- D-05: App crashes should be caught gracefully with a recovery option (restart/retry). Not a white screen of death.
- D-06: Error state should maintain the brand look -- warm cream background, gentle messaging, clear action button.

### Claude's Discretion
- Specific branded loading screen design (how to use splash screen vs. custom loading component)
- Which screens need empty states (progress screen with zero data, home screen before first lesson)
- Error boundary implementation approach (React error boundary component)
- Whether to use the BrandedLogo from Phase 2 in the loading screen
- Recovery mechanism (reload app, navigate back, retry action)

### Deferred Ideas (OUT OF SCOPE)
None -- final phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STATE-01 | App shows beautiful loading state while initializing (not a blank screen) | Branded loading component using BrandedLogo + WarmGlow, replacing null returns in _layout.tsx and provider.tsx |
| STATE-02 | Empty states show encouraging messages and guidance (not blank space) | EmptyState component for home (no lessons completed) and progress (zero data) screens |
| STATE-03 | Error boundary catches crashes gracefully with recovery option | Sentry.ErrorBoundary wrapping app with branded fallback UI + Updates.reloadAsync() recovery |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @sentry/react-native | 7.11.0 | Error boundary + crash reporting | Already installed; provides ErrorBoundary component that auto-reports to Sentry |
| react-native-reanimated | (installed) | Loading screen animations | Already used throughout; BrandedLogo depends on it |
| expo-splash-screen | 55.0.12 | Native splash control | Already installed; controls when native splash hides |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-updates | (check if installed) | App reload on error recovery | `Updates.reloadAsync()` for hard restart from error boundary |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sentry.ErrorBoundary | Custom class component | Lose automatic Sentry error reporting; more code to maintain |
| expo-updates reloadAsync | RN DevSettings.reload | DevSettings only works in dev; Updates works in production |

**No new packages required.** Sentry and splash-screen are already installed. For recovery, `expo-updates` may already be available -- if not, a simple `Updates.reloadAsync()` import covers it. Worst case, the error fallback can suggest closing and reopening the app.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    feedback/
      AppLoadingScreen.tsx    # Branded loading (BrandedLogo + WarmGlow + text)
      ErrorFallback.tsx       # Error boundary fallback UI
      EmptyState.tsx          # Reusable empty state component
```

### Pattern 1: Branded Loading Screen (replacing null returns)
**What:** A lightweight component shown while fonts load and database initializes, using existing BrandedLogo and WarmGlow assets.
**When to use:** In `_layout.tsx` instead of `return null`, and optionally as DatabaseProvider's loading state.

The key insight: the native splash screen (`expo-splash-screen`) already covers the very first moments of app launch. The branded loading screen covers the gap between native splash hiding (fonts loaded) and the app being fully ready (DB initialized, navigation resolved). Currently fonts-loaded hides the splash, but then DB init shows nothing because `DatabaseProvider` returns `null`.

**Approach:** Keep `SplashScreen.preventAutoHideAsync()` as-is. When fonts load, hide the native splash and immediately show the branded React loading screen. The branded screen persists until DatabaseProvider is ready. This avoids a jarring white flash between native splash and app content.

```typescript
// In _layout.tsx, replace: if (!fontsLoaded && !fontError) return null;
// With: if (!fontsLoaded && !fontError) return <AppLoadingScreen />;
// Note: native splash is still visible at this point, so this is belt-and-suspenders

// The real win: DatabaseProvider shows loading instead of null
// In provider.tsx, replace: if (!db) return null;
// With: if (!db) return <AppLoadingScreen />;
// OR: pass a loading prop from _layout.tsx to control it
```

### Pattern 2: Sentry Error Boundary Wrapper
**What:** Wrap the app tree in `Sentry.ErrorBoundary` with a custom fallback component.
**When to use:** In `_layout.tsx`, wrapping `DatabaseProvider` and `Stack`.

```typescript
import * as Sentry from '@sentry/react-native';

// In _layout.tsx return:
<ThemeContext.Provider value={{ colors, mode }}>
  <Sentry.ErrorBoundary fallback={({ resetError }) => (
    <ErrorFallback onRetry={resetError} />
  )}>
    <DatabaseProvider>
      <Stack>...</Stack>
    </DatabaseProvider>
  </Sentry.ErrorBoundary>
</ThemeContext.Provider>
```

**Why Sentry.ErrorBoundary over custom:** Already have Sentry installed (v7.11.0). The boundary automatically captures error + componentStack and sends to Sentry. No need to write a custom class component. The `fallback` prop accepts a render function with `{error, componentStack, resetError}`.

### Pattern 3: Reusable Empty State Component
**What:** A branded empty state with icon area, title, subtitle, and optional action button.
**When to use:** Home screen (no lessons yet -- though this may not happen due to onboarding redirect) and progress screen (zero data).

```typescript
interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;  // Optional custom icon (e.g., BrandedLogo small)
  actionLabel?: string;
  onAction?: () => void;
}
```

### Anti-Patterns to Avoid
- **Showing ActivityIndicator as the only loading state:** Generic spinner feels broken and cheap. Replace with branded experience.
- **Error boundary inside DatabaseProvider:** If DB init itself crashes, the boundary wouldn't catch it. Place the boundary OUTSIDE the DatabaseProvider.
- **Complex loading state machine:** No need for redux or state management. A simple boolean (`fontsLoaded && dbReady`) is sufficient.
- **Hiding the native splash too long:** Don't delay `SplashScreen.hideAsync()` past font loading. The branded React loading screen takes over from there.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundary class component | Custom getDerivedStateFromError class | `Sentry.ErrorBoundary` | Auto-reports to Sentry, handles resetError, tested in production |
| App reload on crash recovery | Custom reload mechanism | `expo-updates` `Updates.reloadAsync()` or `DevSettings.reload()` | Platform-specific reload is tricky; Expo handles it |
| Animated logo | New logo animation | Existing `BrandedLogo` component | Already built in Phase 2 with 5 shared values, crescent/stars/arch |
| Warm ambient glow | New glow effect | Existing `WarmGlow` component | Already built in Phase 2, configurable size/opacity/pulse |

## Common Pitfalls

### Pitfall 1: White Flash Between Splash and Loading
**What goes wrong:** Native splash hides, then a frame or two of white/nothing shows before React renders the loading screen.
**Why it happens:** `SplashScreen.hideAsync()` is called, but React hasn't mounted the loading component yet. Currently `_layout.tsx` calls `hideAsync` when fonts load, then `DatabaseProvider` returns `null`.
**How to avoid:** The branded loading screen should be rendered in `_layout.tsx` BEFORE the native splash hides. Since `_layout.tsx` currently returns `null` until fonts load (while native splash is still showing), the real gap is after fonts load but before DB is ready. Ensure `DatabaseProvider` renders the branded loading screen instead of `null`.
**Warning signs:** Brief white/blank flash on app launch before content appears.

### Pitfall 2: Error Boundary Not Catching DB Init Errors
**What goes wrong:** Database initialization fails, but the error boundary doesn't catch it because the boundary is inside the provider.
**Why it happens:** Boundary placement -- if `Sentry.ErrorBoundary` is inside `DatabaseProvider`, a `getDatabase()` crash renders nothing.
**How to avoid:** Place `Sentry.ErrorBoundary` ABOVE `DatabaseProvider` in the component tree.
**Warning signs:** App shows white screen on corrupted DB instead of error fallback.

### Pitfall 3: BrandedLogo Needs ThemeContext
**What goes wrong:** `BrandedLogo` calls `useColors()` which depends on `ThemeContext`. If rendered outside ThemeContext, it crashes.
**Why it happens:** Loading screen renders before full provider tree is set up.
**How to avoid:** Keep `ThemeContext.Provider` as the outermost wrapper (already is in `_layout.tsx`). The loading screen is rendered inside ThemeContext but outside DatabaseProvider -- this works fine.
**Warning signs:** "Cannot read property 'primary' of undefined" crash on load.

### Pitfall 4: React 19 Error Boundary Behavior Change
**What goes wrong:** In dev mode, errors are rethrown to global handler; error boundary may not visually render fallback as expected.
**Why it happens:** React 19 changed error handling: single error logged instead of duplicate, and dev mode rethrows to global handler.
**How to avoid:** Test error boundary behavior in production/preview builds, not just dev. Sentry.ErrorBoundary is compatible with React 19.
**Warning signs:** Error boundary works in production but seems to "not work" in dev.

### Pitfall 5: Empty State Shows Briefly Before Data Loads
**What goes wrong:** Progress screen shows empty state for a split second before data loads from SQLite.
**Why it happens:** `useProgress()` starts with `loading: true`, then data arrives. If empty state checks `completedLessonIds.length === 0` without checking loading first, it flickers.
**How to avoid:** Always check `progress.loading` BEFORE checking for empty data. Show loading state during load, empty state only when loaded AND empty.
**Warning signs:** Brief flash of "Start your journey!" before progress data appears.

## Code Examples

### Branded Loading Screen Component
```typescript
// src/components/feedback/AppLoadingScreen.tsx
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing } from "../../design/tokens";
import { BrandedLogo } from "../onboarding/BrandedLogo";
import { WarmGlow } from "../onboarding/WarmGlow";

export function AppLoadingScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.center}>
        <WarmGlow size={280} animated pulseMin={0.06} pulseMax={0.18} />
        <View style={styles.logoWrap}>
          <BrandedLogo width={100} height={130} />
        </View>
      </View>
      <Text style={[typography.body, styles.tagline, { color: colors.textMuted }]}>
        Preparing your lesson...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  center: { alignItems: "center", justifyContent: "center" },
  logoWrap: { position: "absolute" },
  tagline: { marginTop: spacing.xl, textAlign: "center" },
});
```

### Error Fallback Component
```typescript
// src/components/feedback/ErrorFallback.tsx
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";

interface ErrorFallbackProps {
  onRetry: () => void;
}

export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[typography.heading2, { color: colors.text }]}>
        Something went wrong
      </Text>
      <Text style={[typography.body, styles.message, { color: colors.textSoft }]}>
        Don't worry -- your progress is saved. Tap below to try again.
      </Text>
      <Pressable
        onPress={onRetry}
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        <Text style={[typography.bodyLarge, { color: colors.white }]}>
          Try Again
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  message: { marginTop: spacing.md, textAlign: "center", marginBottom: spacing.xxl },
  button: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderRadius: radii.md },
});
```

### Empty State Component
```typescript
// src/components/feedback/EmptyState.tsx
interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}
// Warm cream bg, encouraging tone, optional CTA button
// Used in progress screen (zero data) and potentially home (no lessons)
```

### Integration in _layout.tsx
```typescript
// Key changes to app/_layout.tsx:
import * as Sentry from '@sentry/react-native';
import { AppLoadingScreen } from '../src/components/feedback/AppLoadingScreen';
import { ErrorFallback } from '../src/components/feedback/ErrorFallback';

// Replace: if (!fontsLoaded && !fontError) return null;
// With: if (!fontsLoaded && !fontError) return null; // native splash still covers this
// The real change: pass loading component to DatabaseProvider or handle in layout

// Wrap tree in error boundary:
return (
  <ThemeContext.Provider value={{ colors, mode }}>
    <Sentry.ErrorBoundary fallback={({ resetError }) => (
      <ErrorFallback onRetry={resetError} />
    )}>
      <DatabaseProvider loadingComponent={<AppLoadingScreen />}>
        <Stack>...</Stack>
      </DatabaseProvider>
    </Sentry.ErrorBoundary>
  </ThemeContext.Provider>
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom class error boundary | Sentry.ErrorBoundary (auto-reports) | Sentry v7+ | No custom class needed; auto crash reporting |
| return null during loading | Branded loading components | Standard pattern | No white flash, feels intentional |
| react-error-boundary npm package | Sentry.ErrorBoundary or built-in class | React 19 | Sentry integrates reporting; fewer dependencies |

**Deprecated/outdated:**
- `componentDidCatch` alone for error reporting: React 19 changed behavior; use `getDerivedStateFromError` for UI + Sentry for reporting
- `ErrorUtils.setGlobalHandler` for RN error catching: Error boundaries are the React-standard approach

## Open Questions

1. **DatabaseProvider loading prop vs. internal loading screen**
   - What we know: DatabaseProvider currently returns `null` during init. We need it to show the branded loading screen.
   - What's unclear: Should the loading screen be rendered inside DatabaseProvider (changing its return), or should _layout.tsx detect DB readiness and show loading externally?
   - Recommendation: Simplest approach -- add an optional `fallback` prop to DatabaseProvider (like React.Suspense pattern). Default to `null` for backward compat. Pass `<AppLoadingScreen />` from _layout.tsx.

2. **Home screen empty state applicability**
   - What we know: Home screen redirects to onboarding if `!onboarded`. After onboarding, lesson 1 is available immediately.
   - What's unclear: Is there ever a state where home screen shows with zero lessons completed but user IS onboarded?
   - Recommendation: Yes -- after completing onboarding, user returns to home with zero completed lessons. The HeroCard already handles this (shows first lesson). An empty state may not be needed for home. Focus empty state effort on progress screen.

3. **Error recovery: resetError vs. full app reload**
   - What we know: Sentry.ErrorBoundary provides `resetError` which re-renders children. `Updates.reloadAsync()` does a full app reload.
   - What's unclear: Will `resetError` work if the crash is in initialization code?
   - Recommendation: Try `resetError` first (it's less disruptive). If the boundary catches a second error, offer full reload as escalation. For MVP, `resetError` is sufficient.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STATE-01 | AppLoadingScreen uses BrandedLogo + WarmGlow + design tokens | unit (source-audit) | `npx vitest run src/__tests__/app-loading.test.ts` | Wave 0 |
| STATE-02 | EmptyState component renders title/subtitle/action, progress screen uses it | unit (source-audit) | `npx vitest run src/__tests__/empty-state.test.ts` | Wave 0 |
| STATE-03 | ErrorFallback renders retry button, _layout.tsx wraps in Sentry.ErrorBoundary | unit (source-audit) | `npx vitest run src/__tests__/error-boundary.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/app-loading.test.ts` -- covers STATE-01 (source-audit: BrandedLogo import, WarmGlow import, design tokens)
- [ ] `src/__tests__/empty-state.test.ts` -- covers STATE-02 (source-audit: EmptyState in progress screen, encouraging copy)
- [ ] `src/__tests__/error-boundary.test.ts` -- covers STATE-03 (source-audit: Sentry.ErrorBoundary in _layout.tsx, ErrorFallback component)

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `app/_layout.tsx`, `src/db/provider.tsx`, `src/components/onboarding/BrandedLogo.tsx`, `src/components/onboarding/WarmGlow.tsx`
- [Sentry React Native Error Boundary docs](https://docs.sentry.io/platforms/react-native/integrations/error-boundary/) - API, props, usage patterns
- [Expo SplashScreen docs](https://docs.expo.dev/versions/latest/sdk/splash-screen/) - preventAutoHideAsync/hideAsync API

### Secondary (MEDIUM confidence)
- [React 19 Error Boundary changes](https://andrei-calazans.com/posts/react-19-error-boundary-changed/) - React 19 single-error behavior, dev mode rethrow
- [React official Component docs](https://react.dev/reference/react/Component) - getDerivedStateFromError still class-only

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, versions verified via npm ls
- Architecture: HIGH - straightforward component additions, no new patterns
- Pitfalls: HIGH - identified from direct codebase analysis of current null-return gaps

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable domain, no fast-moving dependencies)
