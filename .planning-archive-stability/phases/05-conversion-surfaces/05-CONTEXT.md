# Phase 5: Conversion Surfaces - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign upgrade/upsell cards to match the app's premium design quality and build the complete paywall flow: lesson 7 celebration → trial offer → annual-first pricing → scholarship program. Also add a trial countdown badge on the home screen.

This phase does NOT change RevenueCat's native paywall modal (it handles pricing/purchase UI). We're designing the custom surfaces AROUND it — the emotional arc, the trial CTA card, the locked lesson UX, and the scholarship access.

</domain>

<decisions>
## Implementation Decisions

### Lesson 7 Celebration → Paywall Transition (CONV-07)
- **D-01:** When a free user completes lesson 7, show a special mini-celebration: "You just learned to tell Ba, Ta, and Tha apart!" with confetti
- **D-02:** Brief pause (1-2 seconds) to let the celebration land emotionally
- **D-03:** Trial offer card slides in AFTER the pause — not simultaneously. The celebration moment is separate from the ask.
- **D-04:** This celebration replaces the current basic trial CTA that appears in LessonSummary at lesson 7

### Upgrade Card Design (CONV-06)
- **D-05:** Visual direction: gold accent (#C4A464) border, warm cream background, subtle shadow, Lora heading font. Clean and warm — no gradients.
- **D-06:** Apply this design to ALL upgrade surfaces: trial CTA card (lesson 7), locked lesson gate, trial countdown badge
- **D-07:** CTA button: dark green (#163323) background with white text, matching existing Button component style
- **D-08:** Pricing display: "$4.17/mo (billed yearly at $49.99)" — annual price front and center, monthly equivalent highlighted. Monthly option ($8.99/mo) visible but visually secondary.

### Paywall Flow (CONV-07)
- **D-09:** Paywall triggers: (1) after lesson 7 completion (celebration → offer), (2) when free/expired user taps lesson 8+
- **D-10:** Tapping "Start Free Trial" on ANY upgrade surface calls `showPaywall()` which opens RevenueCat's native paywall modal — we don't build our own purchase UI
- **D-11:** Post-expiry behavior: users can still review premium letters learned during trial/subscription. Cannot start new lessons 8+. (Already implemented in usePremiumReviewRights)
- **D-12:** Locked lesson UI: replace 🔐 emoji with a proper lock icon. Show "Unlock with Tila Premium" instead of just "Premium". Keep reduced opacity (0.4).

### Scholarship Program (CONV-07)
- **D-13:** Scholarship section appears on the trial CTA card (lesson 7) and on the locked lesson gate
- **D-14:** Copy: "Financial hardship should never prevent Quran learning."
- **D-15:** CTA: "Request a Scholarship" — opens mailto:support@tila.app with pre-filled subject line "Tila Scholarship Request"
- **D-16:** Keep it simple for v1 — manual review via email. No in-app form, no code entry UI. Apple Offer Codes are fulfillment-side, not app-side.

### Home Screen Subscription State
- **D-17:** Trial users see a small countdown badge near the header: "5 days left" (uses existing `trialDaysRemaining` from subscription state)
- **D-18:** Free users see nothing subscription-related on the home screen — paywall appears only when tapping locked lessons
- **D-19:** Expired users see nothing on home — paywall appears when tapping locked lessons (same as free)
- **D-20:** Badge design: small pill, gold accent color, matches the design system

### Claude's Discretion
- Exact animation timing for celebration → pause → offer transition
- Lock icon SVG design (can reuse or create alongside CrescentIcon pattern)
- Trial badge exact positioning relative to header elements
- Whether to animate the trial offer card slide-in (recommended: FadeInDown)
- Test approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Monetization Layer
- `src/monetization/hooks.ts` — FREE_LESSON_CUTOFF, useCanAccessLesson, useSubscription, usePremiumReviewRights
- `src/monetization/paywall.ts` — showPaywall wrapper around RevenueCatUI.presentPaywall()
- `src/monetization/provider.tsx` — SubscriptionState, stage, trialDaysRemaining, isPremiumActive
- `src/monetization/analytics.ts` — trackScholarshipTapped, purchase/restore event tracking

### Current Upgrade UI (to redesign)
- `src/components/LessonSummary.tsx` — Trial CTA card at lines 771-802, scholarship link at 794-800
- `src/components/home/JourneyNode.tsx` — Locked lesson UI at lines 193-276, lock emoji at 272
- `src/components/home/LessonGrid.tsx` — isPremiumLocked logic

### Lesson Flow
- `app/lesson/[id].tsx` — Lesson 7 trigger at line 365-367, locked lesson gate, showPaywall calls
- `app/(tabs)/index.tsx` — Home screen, header area for trial badge placement

### Design System
- `src/design/tokens.ts` — Colors (primary #163323, accent #C4A464, bg #F8F6F0), typography, spacing, shadows
- `src/design/theme.ts` — useColors() hook
- `src/design/components.tsx` — Button, Card components
- `src/design/CrescentIcon.tsx` — SVG icon pattern to follow for lock icon

### MASTER-PLAN.md
- Block 2, item 2.7 — Complete paywall flow specification (pricing, post-expiry, scholarship details)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `showPaywall(trigger)` — already wraps RevenueCat with analytics. All upgrade surfaces should call this.
- `trialDaysRemaining` — already computed in subscription provider. Badge just displays it.
- `trackScholarshipTapped(trigger)` — analytics event already exists
- `Button` component in design system — use for CTA buttons
- `Card` component — extend for premium-styled upgrade cards
- `CrescentIcon` SVG pattern — follow same approach for lock icon
- Confetti animation already exists in LessonSummary (lines 117-139) — reuse for lesson 7 celebration

### Established Patterns
- Subscription state checks: `isPremiumActive`, `stage`, `subStage`
- Loading-state UX: assume premium during loading (prevents false-lock flash)
- Animated entrances: FadeIn/FadeInDown from react-native-reanimated (used throughout app)

### Integration Points
- LessonSummary receives `showTrialCTA` and `onStartTrial` props — extend for the redesigned flow
- JourneyNode receives `premiumLocked` and `onPress` — update visual treatment
- Home screen header area (index.tsx ~line 460) — add trial badge alongside streak badge

</code_context>

<specifics>
## Specific Ideas

- The expert reviewer said: "the upgrade and upsell cards are the most important conversion surfaces in the product, and they are getting the least design love." This phase fixes that.
- The lesson 7 celebration copy should acknowledge the specific achievement: recognizing the Ba/Ta/Tha family (letters that look similar). This is a real milestone for a convert.
- The scholarship copy should feel compassionate, not transactional. "Financial hardship should never prevent Quran learning" was chosen deliberately.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-conversion-surfaces*
*Context gathered: 2026-04-02*
