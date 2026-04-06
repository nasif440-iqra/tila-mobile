# Phase 5: Conversion Surfaces - Research

**Researched:** 2026-04-01
**Domain:** React Native UI components, monetization UX, RevenueCat integration
**Confidence:** HIGH

## Summary

Phase 5 redesigns the upgrade/upsell cards and builds the complete paywall flow. The scope is entirely UI/UX work with no new dependencies -- everything needed is already in the codebase. The existing `showPaywall()` wrapper, `useSubscription()` hook, `trialDaysRemaining` computed value, and `trackScholarshipTapped()` analytics are all ready to use. The design system (tokens, Button, Card, CrescentIcon SVG pattern) provides all building blocks.

The work involves: (1) creating a premium-styled `UpgradeCard` component using design tokens, (2) reworking the lesson 7 completion flow with celebration + pause + slide-in offer, (3) redesigning the locked lesson gate in `app/lesson/[id].tsx`, (4) adding a trial countdown badge to the home screen header, and (5) creating a `LockIcon` SVG following the CrescentIcon pattern. All surfaces call the existing `showPaywall(trigger)` which opens RevenueCat's native modal.

**Primary recommendation:** Build a single reusable `UpgradeCard` component that accepts variant props (lesson-7-cta, locked-gate, expired) and renders with design system tokens. All upgrade surfaces share the same visual language: gold accent border, warm cream background, Lora heading, dark green CTA button.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: When a free user completes lesson 7, show a special mini-celebration: "You just learned to tell Ba, Ta, and Tha apart!" with confetti
- D-02: Brief pause (1-2 seconds) to let the celebration land emotionally
- D-03: Trial offer card slides in AFTER the pause -- not simultaneously. The celebration moment is separate from the ask.
- D-04: This celebration replaces the current basic trial CTA that appears in LessonSummary at lesson 7
- D-05: Visual direction: gold accent (#C4A464) border, warm cream background, subtle shadow, Lora heading font. Clean and warm -- no gradients.
- D-06: Apply this design to ALL upgrade surfaces: trial CTA card (lesson 7), locked lesson gate, trial countdown badge
- D-07: CTA button: dark green (#163323) background with white text, matching existing Button component style
- D-08: Pricing display: "$4.17/mo (billed yearly at $49.99)" -- annual price front and center, monthly option ($8.99/mo) visible but visually secondary.
- D-09: Paywall triggers: (1) after lesson 7 completion (celebration then offer), (2) when free/expired user taps lesson 8+
- D-10: Tapping "Start Free Trial" on ANY upgrade surface calls showPaywall() which opens RevenueCat's native paywall modal -- we don't build our own purchase UI
- D-11: Post-expiry behavior: users can still review premium letters learned during trial/subscription. Cannot start new lessons 8+. (Already implemented in usePremiumReviewRights)
- D-12: Locked lesson UI: replace lock emoji with a proper lock icon. Show "Unlock with Tila Premium" instead of just "Premium". Keep reduced opacity (0.4).
- D-13: Scholarship section appears on the trial CTA card (lesson 7) and on the locked lesson gate
- D-14: Copy: "Financial hardship should never prevent Quran learning."
- D-15: CTA: "Request a Scholarship" -- opens mailto:support@tila.app with pre-filled subject line "Tila Scholarship Request"
- D-16: Keep it simple for v1 -- manual review via email. No in-app form, no code entry UI.
- D-17: Trial users see a small countdown badge near the header: "5 days left" (uses existing trialDaysRemaining)
- D-18: Free users see nothing subscription-related on the home screen
- D-19: Expired users see nothing on home -- paywall appears when tapping locked lessons
- D-20: Badge design: small pill, gold accent color, matches the design system

### Claude's Discretion
- Exact animation timing for celebration -> pause -> offer transition
- Lock icon SVG design (can reuse or create alongside CrescentIcon pattern)
- Trial badge exact positioning relative to header elements
- Whether to animate the trial offer card slide-in (recommended: FadeInDown)
- Test approach

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONV-06 | Upgrade/upsell cards redesigned to match design system (premium feel matching onboarding quality) | UpgradeCard component using tokens (accent border, bg, shadows.card, Lora heading, Button primary variant). Applied to lesson 7 CTA, locked gate, trial badge. |
| CONV-07 | Complete paywall flow -- lesson 7 trigger, annual-first pricing, scholarship program, post-expiry review access | Lesson 7 celebration + pause + slide-in flow in LessonSummary. Pricing display with annual-first. Scholarship mailto link. Post-expiry already implemented via usePremiumReviewRights. |

</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | 4.2.1 | Animations (FadeIn, FadeInDown, withDelay) | Already used throughout app for all animated entrances |
| react-native-svg | (installed) | LockIcon SVG component | Already used for CrescentIcon, CheckIcon patterns |
| react-native-purchases-ui | (installed) | RevenueCat native paywall modal | Already integrated via presentPaywall() |
| react-native-purchases | 9.15.0 | Subscription state, customer info | Already integrated via SubscriptionProvider |

### Supporting (Already Available)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-haptics | (installed) | Haptic feedback on CTA button press | Already used via hapticTap() from design/haptics |
| react-native (Linking) | 0.83.2 | mailto: link for scholarship | Already used in lesson/[id].tsx for scholarship |

**Installation:** No new packages required. Zero dependency additions.

## Architecture Patterns

### Recommended Component Structure

```
src/
  components/
    monetization/
      UpgradeCard.tsx          # Shared premium card (lesson 7 CTA, locked gate)
      TrialCountdownBadge.tsx  # Home screen trial pill badge
      LockIcon.tsx             # SVG lock icon (follows CrescentIcon pattern)
      PricingDisplay.tsx       # Annual-first pricing layout
      ScholarshipLink.tsx      # Compassionate scholarship CTA
```

### Pattern 1: Reusable UpgradeCard Component

**What:** A single styled card that renders differently based on a `variant` prop.
**When to use:** Every upgrade surface (lesson 7 CTA, locked lesson gate).
**Why:** D-06 requires ALL upgrade surfaces to share the same visual design. A single component ensures consistency and reduces maintenance.

```typescript
// Pattern derived from existing Card component (src/design/components/Card.tsx)
interface UpgradeCardProps {
  variant: "lesson-7-cta" | "locked-gate";
  onStartTrial: () => void;
  onScholarship?: () => void;
}
```

**Styling pattern (from D-05, D-07):**
```typescript
const upgradeCardStyle = {
  backgroundColor: colors.bg,       // warm cream #F8F6F0
  borderColor: colors.accent,       // gold #C4A464
  borderWidth: borderWidths.normal,  // 1.5
  borderRadius: radii.xl,           // 24
  ...shadows.card,                  // standard card shadow
  padding: spacing.xl,              // 24
};
// Heading uses typography.heading2 (Lora_600SemiBold, 20px)
// CTA button uses Button component with variant="primary" (dark green bg, white text)
```

### Pattern 2: Celebration-then-Offer Flow (LessonSummary)

**What:** When lesson 7 completes, show celebration confetti first, pause 1.5s, then slide in the UpgradeCard.
**Where:** Replaces current trial CTA block in LessonSummary.tsx (lines 771-802).

```typescript
// Use existing ConfettiBurst (already in LessonSummary lines 117-139)
// Add FadeInDown with delay for the offer card
<Animated.View entering={FadeInDown.delay(1500).duration(400).springify()}>
  <UpgradeCard variant="lesson-7-cta" onStartTrial={onStartTrial} onScholarship={onScholarship} />
</Animated.View>
```

**Key:** The `delay(1500)` creates the pause (D-02). The celebration copy and confetti come first with no delay. The UpgradeCard slides in after.

### Pattern 3: Trial Countdown Badge (Home Header)

**What:** Small pill badge showing "X days left" for trial users.
**Where:** Home screen header, alongside existing streak badge.
**Reference pattern:** AnimatedStreakBadge (same pill structure, same positioning area).

```typescript
// Follow AnimatedStreakBadge structure exactly
// Pill: flexDirection: "row", gap: xs, paddingVertical: xs, paddingHorizontal: md, borderRadius: full
// Uses accent color for border/icon, same font sizes
// Only renders when stage === "trial" && trialDaysRemaining !== null
```

### Pattern 4: LockIcon SVG Component

**What:** SVG lock icon following CrescentIcon pattern.
**Where:** `src/components/monetization/LockIcon.tsx` or `src/design/LockIcon.tsx`.

```typescript
// Follow CrescentIcon pattern: simple props interface, Svg from react-native-svg
interface LockIconProps {
  size?: number;
  color?: string;
}

export function LockIcon({ size = 14, color = '#C4A464' }: LockIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Standard lock path: rectangle body + arc shackle */}
      <Rect x={5} y={11} width={14} height={10} rx={2} fill={color} />
      <Path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}
```

### Pattern 5: Locked Lesson Gate Redesign

**What:** Replace the plain error-like gate in `app/lesson/[id].tsx` (lines 274-304) with a full-screen premium offer.
**Current:** Plain SafeAreaView with "Premium Lesson" text and basic buttons.
**New:** Centered layout with LockIcon, UpgradeCard, scholarship link, and "Go Home" ghost button.

### Anti-Patterns to Avoid
- **Building a custom purchase UI:** RevenueCat's native paywall handles all pricing/purchase UI. We only design the surfaces AROUND it (the emotional arc, the CTA card). Never replicate pricing selection or payment flow.
- **Hardcoding price strings:** The "$4.17/mo (billed yearly at $49.99)" display is for our custom CTA surfaces only. RevenueCat's modal shows real localized pricing. Our display is informational/motivational.
- **Animating everything simultaneously:** D-03 explicitly requires celebration and offer to be sequential, not simultaneous. The pause is critical for emotional impact.
- **Showing subscription state to free users on home:** D-18 says free users see nothing. Only trial users get the countdown badge.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Purchase flow | Custom pricing/payment UI | `showPaywall(trigger)` -> RevenueCat native modal | Apple/Google compliance, localized pricing, receipt validation all handled |
| Subscription state | Custom cache/state layer | `useSubscription()` hook from provider | Already derives stage, trialDaysRemaining, isPremiumActive from RevenueCat SDK |
| Post-expiry access logic | Custom access check | `usePremiumReviewRights()` | Already implemented, handles free + granted lesson letters |
| Analytics tracking | Custom event calls | `trackScholarshipTapped(trigger)`, `trackPaywallShown()` | Already wired to PostHog with typed events |
| Haptic feedback | Custom vibration | `hapticTap()` from design/haptics | Already used on all interactive elements |
| Animated entrance | Custom useSharedValue animation | FadeIn/FadeInDown from reanimated entering prop | Declarative, matches existing patterns throughout app |

## Common Pitfalls

### Pitfall 1: Confetti Timing Conflict
**What goes wrong:** The celebration confetti and the UpgradeCard appear at the same time, making the offer feel pushy.
**Why it happens:** Not respecting D-02/D-03 -- the pause is easy to skip during implementation.
**How to avoid:** Use `FadeInDown.delay(1500)` on the UpgradeCard entering animation. The confetti uses its own animation with no delay. The 1500ms gap is intentional.
**Warning signs:** If the card appears before confetti finishes falling.

### Pitfall 2: Trial Badge Showing for Non-Trial Users
**What goes wrong:** Badge renders with "null days left" or shows for free/expired users.
**Why it happens:** Not guarding on `stage === "trial"` before rendering.
**How to avoid:** Conditionally render: `{stage === "trial" && trialDaysRemaining !== null && <TrialCountdownBadge ... />}`.
**Warning signs:** Badge appears on fresh install or after subscription expires.

### Pitfall 3: Locked Lesson Flash on Load
**What goes wrong:** Premium lessons briefly show as locked during subscription loading.
**Why it happens:** `isPremiumActive` is false while `loading` is true.
**How to avoid:** Already handled -- `useCanAccessLesson` returns true while loading. But the locked gate in `app/lesson/[id].tsx` uses `canAccess` which calls this hook. Verify it still works after gate redesign.
**Warning signs:** Brief flash of lock icon then disappears.

### Pitfall 4: Scholarship mailto Not Opening
**What goes wrong:** `Linking.openURL("mailto:...")` fails silently on some devices.
**Why it happens:** No email client configured, or URL encoding issue.
**How to avoid:** Wrap in try/catch. The existing pattern in `app/lesson/[id].tsx` line 367 already works. Keep the same URL: `mailto:support@tila.app?subject=Tila%20Scholarship%20Request`.
**Warning signs:** Nothing happens on tap.

### Pitfall 5: Price String Localization
**What goes wrong:** Hardcoded "$4.17/mo" displays in non-USD markets.
**Why it happens:** RevenueCat handles localized pricing in its modal, but our custom surfaces show hardcoded USD strings.
**How to avoid:** For v1, this is acceptable (US-first launch). Document as known limitation. RevenueCat's native modal will show the correct localized price.
**Warning signs:** N/A for v1 launch.

## Code Examples

### Existing UpgradeCard Integration Points

**LessonSummary trial CTA (lines 771-802) -- to be replaced:**
```typescript
// CURRENT: basic card with primarySoft bg
{passed && showTrialCTA && onStartTrial && (
  <Animated.View entering={FadeIn.delay(850).duration(400)}
    style={[styles.trialCTACard, { backgroundColor: colors.primarySoft, borderColor: "rgba(22,51,35,0.15)" }]}>
    <Text>You just learned to recognize the Arabic alphabet.</Text>
    <Text>Ready to learn how they sound? Start your free 7-day trial.</Text>
    <Pressable onPress={onStartTrial}><Text>Start Free Trial</Text></Pressable>
  </Animated.View>
)}

// NEW: celebration copy first (no delay), then UpgradeCard (with delay)
{passed && showTrialCTA && onStartTrial && (
  <>
    <Animated.View entering={FadeIn.delay(500).duration(400)}>
      <Text style={celebrationHeadline}>You just learned to tell Ba, Ta, and Tha apart!</Text>
    </Animated.View>
    <Animated.View entering={FadeInDown.delay(1500).duration(400)}>
      <UpgradeCard variant="lesson-7-cta" onStartTrial={onStartTrial} onScholarship={onScholarship} />
    </Animated.View>
  </>
)}
```

**Locked lesson gate (app/lesson/[id].tsx lines 274-304) -- to be redesigned:**
```typescript
// CURRENT: plain error-like layout
if (lesson && !canAccess) {
  return (
    <SafeAreaView>
      <Text>Premium Lesson</Text>
      <Text>This lesson requires Tila Premium.</Text>
      <Button title="Start Free Trial" onPress={() => showPaywall("lesson_locked")} />
      <Button title="Go Home" variant="ghost" onPress={() => router.replace("/(tabs)")} />
    </SafeAreaView>
  );
}

// NEW: premium-styled with UpgradeCard + scholarship
if (lesson && !canAccess) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.lockedGateContent}>
        <LockIcon size={48} color={colors.accent} />
        <UpgradeCard variant="locked-gate" 
          onStartTrial={() => showPaywall("lesson_locked")} 
          onScholarship={() => Linking.openURL("mailto:...")} />
        <Button title="Go Home" variant="ghost" onPress={() => router.replace("/(tabs)")} />
      </View>
    </SafeAreaView>
  );
}
```

**JourneyNode locked label (lines 265-275) -- lock icon replacement:**
```typescript
// CURRENT
<Text style={[styles.nodeSubtitle, { color: premiumLocked ? colors.accent : colors.textMuted }]}>
  {premiumLocked ? "\uD83D\uDD12 Premium" : "Locked"}
</Text>

// NEW
<View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
  {premiumLocked ? <LockIcon size={12} color={colors.accent} /> : null}
  <Text style={[styles.nodeSubtitle, { color: premiumLocked ? colors.accent : colors.textMuted }]}>
    {premiumLocked ? "Unlock with Tila Premium" : "Locked"}
  </Text>
</View>
```

**Home screen trial badge (app/(tabs)/index.tsx ~line 486):**
```typescript
// Add alongside existing streak badge
<Animated.View style={[styles.headerRight, headerEntranceStyle]}>
  {dailyGoal > 0 && <DailyGoalPill ... />}
  {stage === "trial" && trialDaysRemaining !== null && (
    <TrialCountdownBadge daysLeft={trialDaysRemaining} />
  )}
  {currentWird > 0 && <AnimatedStreakBadge count={currentWird} enterDelay={200} />}
</Animated.View>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom paywall UI | RevenueCat native paywall (presentPaywall) | Already implemented | No custom purchase UI needed, just design surfaces around it |
| Lock emoji (unicode) | SVG icon components | CrescentIcon pattern established in Phase 2 | Clean, scalable, theme-aware icons |
| Basic text CTAs | Design-system-styled cards | This phase | Premium feel matching onboarding quality |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test -- --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONV-06-a | UpgradeCard renders with correct design tokens (gold border, cream bg, Lora heading) | unit | `npx vitest run src/__tests__/upgrade-card.test.ts -x` | Wave 0 |
| CONV-06-b | LockIcon renders as SVG (follows CrescentIcon pattern) | unit | `npx vitest run src/__tests__/lock-icon.test.ts -x` | Wave 0 |
| CONV-06-c | TrialCountdownBadge only renders for trial stage | unit | `npx vitest run src/__tests__/trial-badge.test.ts -x` | Wave 0 |
| CONV-07-a | showTrialCTA prop triggers when lesson.id === FREE_LESSON_CUTOFF and not premium | unit | `npx vitest run src/__tests__/lesson-summary.test.ts -x` | Exists (extend) |
| CONV-07-b | Scholarship link opens correct mailto URL | unit | `npx vitest run src/__tests__/upgrade-card.test.ts -x` | Wave 0 |
| CONV-07-c | Locked gate shows UpgradeCard for non-premium users on lessons > 7 | unit | `npx vitest run src/__tests__/locked-gate.test.ts -x` | Wave 0 |
| CONV-07-d | Post-expiry review rights (already tested) | unit | `npx vitest run src/__tests__/subscription-types.test.ts -x` | Exists |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test -- --coverage`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] `src/__tests__/upgrade-card.test.ts` -- covers CONV-06-a, CONV-07-b
- [ ] `src/__tests__/lock-icon.test.ts` -- covers CONV-06-b
- [ ] `src/__tests__/trial-badge.test.ts` -- covers CONV-06-c
- [ ] `src/__tests__/locked-gate.test.ts` -- covers CONV-07-c

Note: These are unit tests verifying component exports, prop types, and conditional rendering logic. They do NOT test visual rendering (no jsdom/react-native-testing-library in current setup). Tests should follow the existing pattern of import verification and logic assertions (see subscription-types.test.ts and monetization-events.test.ts for examples).

## Open Questions

1. **Price string updates for non-US markets**
   - What we know: RevenueCat modal shows localized pricing. Our custom surfaces show hardcoded "$4.17/mo" and "$49.99/yr".
   - What's unclear: Will the app launch in non-USD markets initially?
   - Recommendation: Hardcode USD for v1 (US-first launch). RevenueCat handles the real pricing in the purchase modal. Add TODO comment for future localization.

2. **Trial badge when 0 days remaining**
   - What we know: `trialDaysRemaining` returns 0 when trial expires same day.
   - What's unclear: Should badge show "0 days left" or "Last day"?
   - Recommendation: Use "Last day!" when trialDaysRemaining === 0, "X days left" otherwise.

## Project Constraints (from CLAUDE.md)

- **Stack locked:** Expo SDK 55, React Native 0.83, React 19, TypeScript 5.9 -- no framework changes
- **No business logic changes:** Engine algorithms stay the same
- **Offline-first:** All UI must work without network (subscription state cached by RevenueCat)
- **Performance:** No regressions on mid-range Android (60fps animations)
- **Backwards compatible:** Existing SQLite data must not be corrupted
- **Validation:** Run `npm run validate` (zero errors) and `npm test` (all pass) before completion
- **GSD workflow:** All work through GSD commands

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/monetization/` (hooks.ts, paywall.ts, provider.tsx, analytics.ts) -- full monetization layer
- Codebase inspection: `src/design/tokens.ts` -- all color, typography, spacing, shadow tokens
- Codebase inspection: `src/design/components/` -- Button, Card, CrescentIcon patterns
- Codebase inspection: `src/components/LessonSummary.tsx` -- current trial CTA (lines 771-802), confetti (lines 117-139)
- Codebase inspection: `app/lesson/[id].tsx` -- locked gate (lines 274-304), lesson 7 trigger (line 365)
- Codebase inspection: `src/components/home/JourneyNode.tsx` -- locked label (lines 265-275)
- Codebase inspection: `src/components/home/AnimatedStreakBadge.tsx` -- badge pattern for trial pill
- Codebase inspection: `app/(tabs)/index.tsx` -- home header layout (lines 477-489)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, everything already installed and used
- Architecture: HIGH -- patterns directly derived from existing codebase (Card, CrescentIcon, AnimatedStreakBadge)
- Pitfalls: HIGH -- identified from reading actual code paths and existing integration points

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable -- no dependency changes expected)
