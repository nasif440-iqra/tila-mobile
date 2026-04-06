---
phase: 05-launch-ops-checklist
plan: 01
subsystem: infra
tags: [privacy-policy, app-store, eas-build, ipad, launch]

# Dependency graph
requires:
  - phase: 03-monetization-hardening
    provides: RevenueCat integration details for privacy declarations
provides:
  - Privacy policy document ready to host
  - App Store Connect privacy questionnaire answers
  - In-app privacy policy link on Progress tab
  - Verified iPad letterbox config and production build profile
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [privacy-policy-url-constant, in-app-legal-links]

key-files:
  created:
    - docs/PRIVACY_POLICY.md
    - docs/APP_STORE_PRIVACY.md
  modified:
    - app/(tabs)/progress.tsx

key-decisions:
  - "Privacy policy link on Progress tab (near reset button) rather than separate settings screen"
  - "Placeholder URL constant PRIVACY_POLICY_URL for owner to replace with hosted version"
  - "No ATT prompt needed -- PostHog configured without IDFA collection"

patterns-established:
  - "Legal links pattern: URL constant at top of screen file, Linking.openURL for external pages"

requirements-completed: [LAUNCH-01, LAUNCH-02, LAUNCH-03, LAUNCH-04]

# Metrics
duration: 2m30s
completed: 2026-04-01
---

# Phase 5 Plan 1: Launch Ops Checklist Summary

**Privacy policy, App Store privacy questionnaire guide, in-app privacy link, and verified iPad/production build configs for App Store submission**

## Performance

- **Duration:** 2m 30s
- **Started:** 2026-04-01T17:44:53Z
- **Completed:** 2026-04-01T17:47:22Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created comprehensive privacy policy reflecting actual PostHog, Sentry, and RevenueCat data collection
- Created App Store Connect privacy questionnaire answer guide with exact form responses
- Added privacy policy link to Progress tab accessible in-app
- Verified supportsTablet: false (iPad letterbox) and production EAS build profile already correct

## Task Commits

Each task was committed atomically:

1. **Task 1: Create privacy policy and App Store privacy questionnaire documentation** - `86ce1c0` (docs)
2. **Task 2: Add privacy policy link to Progress tab** - `df6454c` (feat)
3. **Task 3: Verify iPad letterbox config and production build profile** - No commit needed (verified existing configs are correct)

## Files Created/Modified
- `docs/PRIVACY_POLICY.md` - Full privacy policy for hosting and App Store Connect URL
- `docs/APP_STORE_PRIVACY.md` - App Store Connect privacy questionnaire answers and Google Play data safety form
- `app/(tabs)/progress.tsx` - Added privacy policy link with Linking.openURL

## Decisions Made
- Privacy policy link placed on Progress tab (near existing restore/reset buttons) rather than creating a separate settings screen -- minimizes scope while meeting App Store requirement
- PRIVACY_POLICY_URL defined as constant placeholder (https://tila.app/privacy) -- owner replaces with actual hosted URL before submission
- No ATT prompt needed -- PostHog configured with `captureAppLifecycleEvents: false`, `enableSessionReplay: false`, no IDFA collection
- Sentry crash reporting declared under "legitimate interest" exemption (no consent needed per GDPR)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

Before App Store submission, the owner must:
1. Host the privacy policy (from `docs/PRIVACY_POLICY.md`) at a public URL
2. Update `PRIVACY_POLICY_URL` constant in `app/(tabs)/progress.tsx` with the hosted URL
3. Complete the App Store Connect privacy questionnaire using answers from `docs/APP_STORE_PRIVACY.md`
4. Update `privacy@tila.app` email address in the privacy policy if using a different contact

## Next Phase Readiness
- All LAUNCH requirements addressed
- Privacy policy content ready -- needs hosting before submission
- App Store privacy questionnaire answers documented -- ready to fill in App Store Connect
- iPad and production build configs already correct in codebase

## Self-Check: PASSED

All created files exist. All commit hashes verified.

---
*Phase: 05-launch-ops-checklist*
*Completed: 2026-04-01*
