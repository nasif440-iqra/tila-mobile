# Phase 5: Launch Ops Checklist - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Prepare all non-code App Store submission requirements: privacy policy, privacy questionnaire answers, iPad QA verification, App Store metadata, and production build verified on physical device. No new features or code changes beyond what's needed for submission compliance.

</domain>

<decisions>
## Implementation Decisions

### Privacy Policy
- **D-01:** Create a new privacy policy from scratch — none exists yet
- **D-02:** Host on GitHub Pages (e.g., tila-app.github.io/privacy or similar)
- **D-03:** Policy must cover PostHog analytics (consent-gated), Sentry crash reporting (legitimate interest), and RevenueCat purchase data

### In-App Privacy Link
- **D-04:** Claude's Discretion — place the privacy policy link where it makes most sense for App Store review (likely Progress tab settings area near existing Restore Purchases)

### Data Collection / Privacy Questionnaire
- **D-05:** Researcher must verify whether PostHog React Native SDK collects IDFA/advertising identifiers — this determines ATT prompt requirement and privacy label declarations
- **D-06:** Claude's Discretion — classify Sentry crash data for App Store privacy nutrition labels based on actual SDK config
- **D-07:** ATT prompt is out of scope per PROJECT.md — if PostHog doesn't collect IDFA, declare "No tracking" in App Store Connect

### App Store Metadata
- **D-08:** Category: Education (primary)
- **D-09:** Screenshots: iPhone only — 6.7" (Pro Max) + 6.1" (standard). No iPad screenshots needed (supportsTablet: false)
- **D-10:** Prepare full metadata: description, subtitle, keywords — none exist yet
- **D-11:** Generate 3-4 subtitle options for user to pick from during planning

### Build Verification
- **D-12:** iOS physical device available for testing; Apple Developer account enrolled and active
- **D-13:** Android testing via EAS build distribution (no physical device for now)
- **D-14:** Verification flow: full "reviewer run" — fresh install → onboarding → complete lesson 1 → check subscription screen → verify offline behavior
- **D-15:** Production EAS build must be verified on physical iPhone before submission

### Claude's Discretion
- In-app privacy policy link placement (D-04)
- Sentry privacy nutrition label classification (D-06)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### App Configuration
- `app.config.ts` — Bundle IDs, supportsTablet: false, splash config, plugins
- `eas.json` — EAS Build profiles (development, preview, production) and submit config

### Analytics & Data Collection
- `src/analytics/index.ts` — PostHog consent gating, Sentry always-on init
- `src/analytics/posthog.ts` — PostHog SDK initialization and config
- `src/analytics/sentry.ts` — Sentry DSN and initialization

### Monetization
- `src/monetization/revenuecat.ts` — RevenueCat client setup (data collection implications)

### Project Requirements
- `.planning/REQUIREMENTS.md` — LAUNCH-01 through LAUNCH-04 acceptance criteria
- `.planning/ROADMAP.md` — Phase 5 success criteria (4 items)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app.config.ts` already has `supportsTablet: false`, bundle identifiers, and icon assets configured
- `eas.json` has production build profile with `autoIncrement: true` and empty `submit.production` ready to configure
- Progress tab exists with Restore Purchases button — natural location for privacy policy link

### Established Patterns
- Analytics init is consent-gated for PostHog, always-on for Sentry
- RevenueCat integration is isolated in `src/monetization/`
- Expo Router file-based routing with tab navigator

### Integration Points
- Privacy policy link would go in Progress tab or a settings section
- EAS Submit (`eas submit`) is already configured with empty production config
- `expo prebuild` generates native projects for iPad QA verification

</code_context>

<specifics>
## Specific Ideas

- Full "reviewer run" test flow matches CLAUDE.md's defined verification: fresh install → onboarding → lesson 1 → subscription screen → offline behavior
- GitHub Pages hosting keeps privacy policy version-controlled alongside the codebase
- iPhone-only screenshots since app explicitly sets supportsTablet: false

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-launch-ops-checklist*
*Context gathered: 2026-04-01*
