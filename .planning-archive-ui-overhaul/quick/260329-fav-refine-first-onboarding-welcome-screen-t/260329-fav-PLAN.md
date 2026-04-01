---
phase: quick
plan: 260329-fav
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/onboarding/steps/Welcome.tsx
  - src/components/onboarding/FloatingLettersLayer.tsx
  - src/components/onboarding/OnboardingStepLayout.tsx
autonomous: true
requirements: [QUICK-REFINE-WELCOME]
must_haves:
  truths:
    - "Welcome screen content feels 20% smaller and more delicate than before"
    - "CTA button is a contained pill, not full-width"
    - "Floating Arabic letters are barely perceptible background texture"
    - "Overall impression is restrained, premium, intentional"
  artifacts:
    - path: "src/components/onboarding/steps/Welcome.tsx"
      provides: "Refined welcome layout with scaled-down typography and contained CTA"
    - path: "src/components/onboarding/FloatingLettersLayer.tsx"
      provides: "More subtle floating letters with reduced opacity and size"
  key_links:
    - from: "src/components/onboarding/steps/Welcome.tsx"
      to: "src/design/components/Button.tsx"
      via: "style override for CTA sizing"
      pattern: "maxWidth.*paddingVertical"
---

<objective>
Refine the first onboarding welcome screen to match the web reference's restrained, premium aesthetic. Scale down all content ~20%, make floating letters more subtle, contain the CTA button, and adjust spacing for a more delicate overall feel.

Purpose: The current welcome screen is slightly oversized and heavy compared to the web reference. This refinement brings visual parity — everything should feel intentional and premium, not oversized.
Output: Updated Welcome.tsx, FloatingLettersLayer.tsx, and OnboardingStepLayout.tsx with refined values.
</objective>

<execution_context>
@.planning/quick/260329-fav-refine-first-onboarding-welcome-screen-t/260329-fav-PLAN.md
</execution_context>

<context>
@src/components/onboarding/steps/Welcome.tsx
@src/components/onboarding/FloatingLettersLayer.tsx
@src/components/onboarding/WarmGlow.tsx
@src/components/onboarding/OnboardingStepLayout.tsx
@src/design/components/Button.tsx
@src/design/tokens.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scale down Welcome content, contain CTA, and reduce floating letter presence</name>
  <files>
    src/components/onboarding/steps/Welcome.tsx
    src/components/onboarding/FloatingLettersLayer.tsx
    src/components/onboarding/OnboardingStepLayout.tsx
  </files>
  <action>
**Welcome.tsx — scale down content and contain CTA:**

1. Remove the dead `WarmGlow` import (imported but never used in JSX).

2. Update BrandedLogo dimensions from `width={180} height={240}` to `width={140} height={186}`.

3. Change logo container `marginBottom` from `spacing.xxl` (32px) to `20` (literal).

4. Update `appName` style:
   - `fontSize`: 44 -> 36
   - `letterSpacing`: 5.3 -> 4
   - `lineHeight`: 52 -> 44

5. Update `brandMotto` style:
   - `fontSize`: 11 -> 10
   - `marginBottom`: `spacing.xl` (24px) -> `spacing.lg` (16px)

6. Update `tagline` style:
   - `fontSize`: 16 -> 15
   - `lineHeight`: 26 -> 22

7. Replace `fullWidthBtn` style from `{ width: "100%" }` to `{ maxWidth: 280, width: "100%", alignSelf: "center" as const, paddingVertical: 14 }`. This creates a contained pill-shape CTA instead of edge-to-edge. The `paddingVertical: 14` slightly reduces the button height from the default 16px.

**FloatingLettersLayer.tsx — reduce opacity and font sizes:**

8. In the `floatingLetters` array, multiply every letter's `opacity` value by 0.6 (round to 2 decimal places):
   - 0.10 -> 0.06
   - 0.08 -> 0.05
   - 0.09 -> 0.05
   - 0.07 -> 0.04

9. Reduce every letter's `size` by ~15%:
   - 32 -> 27
   - 28 -> 24
   - 26 -> 22
   - 30 -> 26
   - 24 -> 20

**OnboardingStepLayout.tsx — adjust splash vertical position:**

10. Change `splashContent.paddingTop` from `SCREEN_HEIGHT * 0.15` to `SCREEN_HEIGHT * 0.12`. This shifts the content slightly higher, giving more breathing room below and making the overall center feel more natural after content is scaled down.
  </action>
  <verify>
    <automated>cd "C:\Users\Nasif\Desktop\Iqra AI\tila-mobile" && npx tsc --noEmit --pretty 2>&1 | head -20</automated>
  </verify>
  <done>
    - BrandedLogo is 140x186 (down from 180x240)
    - App name font is 36px with 4 letter-spacing (down from 44/5.3)
    - Brand motto gap reduced to 16px
    - Tagline font is 15/22 (down from 16/26)
    - CTA button is maxWidth 280 pill (not full-width)
    - All floating letter opacities reduced to 0.04-0.06 range
    - All floating letter sizes reduced ~15%
    - Splash content shifted slightly higher (0.12 factor)
    - No TypeScript errors
    - Dead WarmGlow import removed from Welcome.tsx
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Refined welcome screen with scaled-down content, contained CTA, more subtle floating letters, and adjusted vertical positioning to match the web reference's restrained premium aesthetic.</what-built>
  <how-to-verify>
    1. Run `npm start` and open the app on device/simulator
    2. Navigate to the onboarding welcome screen (clear app data if needed to trigger onboarding)
    3. Verify the overall feel is more delicate and premium:
       - Logo illustration should be noticeably smaller
       - "tila" text should be smaller and tighter
       - "READ BEAUTIFULLY" motto should have less gap below it
       - Tagline text should be slightly smaller
       - "Get Started" button should be a contained pill shape (~280px wide), NOT edge-to-edge
       - Floating Arabic letters in background should be barely perceptible
       - Content should sit slightly higher in the vertical center
    4. Compare side-by-side with web reference if available
    5. Confirm animations still work (stagger entrance, button press)
  </how-to-verify>
  <resume-signal>Type "approved" or describe specific adjustments needed (e.g., "logo still too big", "button needs to be wider")</resume-signal>
</task>

</tasks>

<verification>
- TypeScript compiles without errors: `npm run typecheck`
- Visual comparison against web reference shows improved parity
- All entrance animations still function correctly
- Button press animation and haptic still work
</verification>

<success_criteria>
Welcome screen feels 20% more delicate and restrained, matching the web reference's premium aesthetic. CTA is a contained pill, floating letters are barely visible background texture, and content sits at a natural vertical center.
</success_criteria>

<output>
No summary file needed for quick tasks.
</output>
