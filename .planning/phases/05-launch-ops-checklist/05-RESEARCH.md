# Phase 5: Launch Ops Checklist - Research

**Researched:** 2026-04-01
**Domain:** App Store submission compliance, privacy policy, production builds
**Confidence:** HIGH

## Summary

Phase 5 is an operational phase requiring no business logic changes. The work covers four areas: (1) creating and hosting a privacy policy, (2) documenting App Store privacy nutrition label answers, (3) verifying iPad letterbox mode via expo prebuild, and (4) producing and verifying a production EAS build on a physical iPhone.

Key research finding: PostHog React Native SDK v4.39.0 does **not** collect IDFA or any advertising identifiers -- confirmed by scanning the SDK source code (`node_modules/posthog-react-native/dist/`) which contains zero references to IDFA, advertisingId, or ATTrackingManager. This means no ATT prompt is required and "No tracking" can be declared in App Store Connect.

**Primary recommendation:** Create a standalone privacy policy hosted on GitHub Pages, document exact nutrition label answers for PostHog/Sentry/RevenueCat, verify prebuild config, and run a production build through the full reviewer flow on a physical iPhone.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Create a new privacy policy from scratch -- none exists yet
- **D-02:** Host on GitHub Pages (e.g., tila-app.github.io/privacy or similar)
- **D-03:** Policy must cover PostHog analytics (consent-gated), Sentry crash reporting (legitimate interest), and RevenueCat purchase data
- **D-04:** Claude's Discretion -- place privacy policy link where it makes most sense for App Store review
- **D-05:** Researcher must verify whether PostHog React Native SDK collects IDFA/advertising identifiers
- **D-06:** Claude's Discretion -- classify Sentry crash data for App Store privacy nutrition labels
- **D-07:** ATT prompt is out of scope -- if PostHog doesn't collect IDFA, declare "No tracking" in App Store Connect
- **D-08:** Category: Education (primary)
- **D-09:** Screenshots: iPhone only -- 6.7" (Pro Max) + 6.1" (standard). No iPad screenshots needed
- **D-10:** Prepare full metadata: description, subtitle, keywords -- none exist yet
- **D-11:** Generate 3-4 subtitle options for user to pick from during planning
- **D-12:** iOS physical device available for testing; Apple Developer account enrolled and active
- **D-13:** Android testing via EAS build distribution (no physical device for now)
- **D-14:** Verification flow: full "reviewer run" -- fresh install, onboarding, lesson 1, subscription screen, offline behavior
- **D-15:** Production EAS build must be verified on physical iPhone before submission

### Claude's Discretion
- In-app privacy policy link placement (D-04)
- Sentry privacy nutrition label classification (D-06)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LAUNCH-01 | Privacy policy URL surfaced in-app and ready for App Store Connect | Privacy policy template structure, GitHub Pages hosting, in-app link placement in Progress tab |
| LAUNCH-02 | App Store Connect privacy questionnaire answers prepared based on actual PostHog/Sentry data collection | PostHog IDFA verification (negative), Sentry data classification, RevenueCat nutrition label requirements |
| LAUNCH-03 | iPad letterbox QA pass (verify supportsTablet: false persists through expo prebuild) | Known Expo issue #32344 research, verification command, TARGETED_DEVICE_FAMILY check |
| LAUNCH-04 | Production EAS build verified on physical device | EAS Build production workflow, internal distribution for iOS, reviewer run checklist |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stack locked:** Expo SDK 55, React Native 0.83, New Architecture -- no framework changes
- **No business logic changes:** Engine algorithms stay the same
- **Offline-first:** All fixes must work without network connectivity
- **Backwards compatible:** Existing user data must not be corrupted
- **Validation commands:** `npm run validate` (lint + typecheck), `npm test`, production build on real device
- **Reviewer run defined:** Fresh install, complete onboarding, finish lesson 1, check subscription screen, verify offline behavior

## PostHog IDFA Verification (D-05 Answer)

**Finding: PostHog React Native SDK v4.39.0 does NOT collect IDFA.**

**Confidence:** HIGH -- verified by direct source inspection

**Evidence:**
1. Searched entire `node_modules/posthog-react-native/dist/` directory for: `idfa`, `IDFA`, `advertisingId`, `advertising_id`, `advertisingIdentifier`, `ATTrackingManager`, `trackingTransparency` -- zero matches
2. The SDK uses `anonymousId` (a randomly generated UUID stored locally via AsyncStorage) and `distinct_id` for user identification -- these are first-party identifiers, not advertising identifiers
3. The app's PostHog config (`src/analytics/posthog.ts`) has conservative settings: `captureAppLifecycleEvents: false`, `enableSessionReplay: false`, `preloadFeatureFlags: false`, `personProfiles: 'identified_only'`
4. PostHog is consent-gated in the app -- only initialized when user explicitly consents

**Implication:** Declare "No" for "Does your app track users?" in App Store Connect. No ATT prompt needed. This aligns with the Out of Scope decision in REQUIREMENTS.md.

## App Store Privacy Nutrition Labels (D-06 Answer)

### Data Types to Declare

Based on actual SDK configurations in the codebase:

#### PostHog (consent-gated analytics)
| Data Type | Category | Linked to User | Used for Tracking | Purpose |
|-----------|----------|----------------|-------------------|---------|
| Product Interaction | Usage Data | Yes (via anonymous ID) | No | Analytics |
| Other Usage Data | Usage Data | Yes | No | Analytics |

**What PostHog actually collects:** Event names, event properties (lesson completion, quiz scores, navigation), anonymous user ID (UUID), device type, OS version, app version. No PII by default. Consent-gated -- only collects when user opts in.

#### Sentry (always-on crash reporting)
| Data Type | Category | Linked to User | Used for Tracking | Purpose |
|-----------|----------|----------------|-------------------|---------|
| Crash Data | Diagnostics | No | No | App Functionality |
| Performance Data | Diagnostics | No | No | App Functionality |

**What Sentry actually collects:** Stack traces, device info (model, OS version), app state at crash time, request URLs. The app config has `tracesSampleRate: 0` (no performance tracing), `sendDefaultPii` is not set (defaults to false -- no user IPs stored on Sentry side beyond server logs), and `enabled: !__DEV__` (production only). User ID is set via anonymous PostHog ID -- not PII.

**Sentry classification rationale:** Crash data is "Diagnostics" category, purpose is "App Functionality" (maintaining app quality). Not linked to user identity because the anonymous ID is not PII. Not used for tracking.

#### RevenueCat (subscription management)
| Data Type | Category | Linked to User | Used for Tracking | Purpose |
|-----------|----------|----------------|-------------------|---------|
| Purchase History | Purchases | Yes | No | App Functionality |
| Product Interaction | Usage Data | Yes | No | Analytics |

**Source:** [RevenueCat Apple App Privacy docs](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy) -- RevenueCat requires declaring Purchase History with both "Analytics" and "App Functionality" purposes. The app does not use custom app user IDs with RevenueCat (no `identify()` call in revenuecat.ts), so Device ID declaration may not be needed.

#### Summary for App Store Connect
- **Data Used to Track You:** None (no IDFA, no cross-app tracking)
- **Data Linked to You:** Purchase History (RevenueCat), Usage Data (PostHog -- consent-gated)
- **Data Not Linked to You:** Crash Data, Performance Data (Sentry)

## Privacy Policy Structure

### Required Content (Apple Guidelines)
Apple requires the privacy policy to:
1. Clearly identify what data the app collects
2. How it collects that data
3. All uses of that data
4. Third-party data sharing disclosure
5. Data retention and deletion practices
6. Be accessible via URL in App Store Connect AND within the app

### Recommended Sections
1. **Information We Collect** -- analytics events (PostHog), crash reports (Sentry), purchase data (RevenueCat)
2. **How We Use Your Information** -- improve app quality, fix crashes, process subscriptions
3. **Third-Party Services** -- PostHog (analytics), Sentry (crash reporting), RevenueCat (subscriptions), Apple (payments)
4. **Data Retention** -- analytics data retained per PostHog/Sentry defaults, purchase data per RevenueCat
5. **Your Choices** -- analytics consent toggle, subscription management via Apple
6. **Children's Privacy** -- app does not knowingly collect data from children under 13 (note: Tila targets adult converts, not children)
7. **Contact Information** -- email address for privacy inquiries
8. **Changes to This Policy** -- how updates are communicated

### Important Note on COPPA
Tila teaches Quranic Arabic to converts and new Muslims -- the target audience is adults. The app does not target children under 13. However, the Education category can trigger Apple scrutiny about children's privacy. The privacy policy should explicitly state the app is designed for users 13+ and does not knowingly collect data from children.

## GitHub Pages Hosting

**Confidence:** HIGH

### Setup (Simplest Path)
1. Create a new GitHub repository (e.g., `tila-app/privacy` or use a `docs/` folder in the main repo)
2. Add `index.html` with the privacy policy content
3. Enable GitHub Pages in repo Settings > Pages > Deploy from branch (main, root)
4. URL will be: `https://tila-app.github.io/privacy/` (or similar)

**Recommendation:** Use a separate small repo for the privacy policy. This keeps legal docs independent of app releases and allows updates without code deploys. Alternatively, a `/docs` folder in the main repo works if simplicity is preferred.

### Format
Plain HTML with inline CSS. No build step needed. A single `index.html` file is sufficient. Style it to match Tila branding (warm cream background, dark green text, Amiri/Inter fonts via Google Fonts CDN).

## In-App Privacy Policy Link Placement (D-04 Recommendation)

**Recommendation:** Place in the Progress tab, below the existing "Restore Purchases" button.

**Rationale:**
- Progress tab already has the Restore Purchases button (line 311-326 in `app/(tabs)/progress.tsx`)
- Apple reviewers expect privacy policy links in Settings/Account areas
- Natural grouping: Restore Purchases + Privacy Policy + (optional) Terms of Service
- Uses `Linking.openURL()` to open the GitHub Pages URL in the system browser
- No new screens needed -- just a tappable text link or small button

## App Store Metadata

### Character Limits (Verified)
| Field | Limit | Notes |
|-------|-------|-------|
| App Name | 30 chars | "Tila" is 4 chars -- room for subtitle in name if desired |
| Subtitle | 30 chars | Shown below app name in search results |
| Description | 4,000 chars | First 3 lines visible before "more" fold |
| Keywords | 100 chars | Comma-separated, no spaces after commas |
| Promotional Text | 170 chars | Can be updated without new build |
| What's New | 4,000 chars | Release notes |

### Required Metadata for Submission
- App Name
- Subtitle
- Description
- Keywords
- Category: Education (primary)
- Content Rights: original content
- Age Rating: 4+ (no objectionable content -- educational religious content is fine)
- Privacy Policy URL
- Support URL
- Screenshots (see below)

### Screenshot Requirements
| Display Size | Dimensions (Portrait) | Required |
|-------------|----------------------|----------|
| 6.7" (iPhone Pro Max) | 1290 x 2796 px (or 1260 x 2736 px) | Yes -- primary |
| 6.1" (standard iPhone) | 1170 x 2532 px (or 1284 x 2778 px) | Optional (6.7" scales down) |

- Format: PNG or JPEG
- Minimum: 1 screenshot, Maximum: 10
- Apple can scale 6.7" screenshots down to 6.1" automatically
- **Recommendation:** Provide 3-5 screenshots showing: (1) lesson grid/home, (2) letter quiz in action, (3) mastery/progress, (4) onboarding/value prop, (5) wird/streak tracking

### Subtitle Options (D-11)
Generate during planning. Research suggests effective Education app subtitles focus on the learning outcome:
- "Learn to Read Quranic Arabic" (28 chars)
- "Read the Quran from Alif" (25 chars)
- "Master Arabic Letters" (21 chars)
- "Quran Reading for Beginners" (27 chars)

## iPad Letterbox Verification (LAUNCH-03)

### Known Issue
Expo issue [#32344](https://github.com/expo/expo/issues/32344): `supportsTablet: false` may be ignored during `expo prebuild`, adding `UISupportedInterfaceOrientations~ipad` to Info.plist even when tablet support is disabled. PR #32361 was merged (December 2024) to fix this, but reports suggest regression in some versions.

**Current state in Tila:** `app.config.ts` line 20 has `supportsTablet: false`. Expo SDK is 55.0.8.

### Verification Steps
1. Run `npx expo prebuild --platform ios --clean`
2. Check `ios/tila/Info.plist` for `UIDeviceFamily` -- should contain only `1` (iPhone), not `2` (iPad)
3. Check for absence of `UISupportedInterfaceOrientations~ipad` key
4. Also verify `TARGETED_DEVICE_FAMILY` in `ios/tila.xcodeproj/project.pbxproj` is `1` (iPhone only)

**If the bug persists in SDK 55:** Use a config plugin or post-prebuild script to strip iPad entries. The `TARGETED_DEVICE_FAMILY = 1` in the Xcode project is what actually controls device targeting at the binary level.

### Important Apple Behavior
Even with `supportsTablet: false`, the app will run on iPad in iPhone compatibility mode (letterbox). Apple may still test on iPad and reject if the letterboxed UI is unusable (clipped buttons, unreadable text). The app's portrait-only, phone-optimized layout should be fine.

## EAS Build Production Workflow (LAUNCH-04)

### Current Config
`eas.json` has a production profile with `autoIncrement: true` and empty `submit.production`. EAS CLI 18.4.0 is installed.

### Build Commands
```bash
# iOS production build (App Store distribution)
eas build --platform ios --profile production

# iOS internal distribution (for device testing before submission)
# Requires ad hoc provisioning -- device UDID must be registered
eas device:create    # Register test device
eas build --platform ios --profile preview  # Internal distribution build

# Android production build
eas build --platform android --profile production
```

### iOS Production Build Flow
1. **For App Store submission:** `eas build --platform ios --profile production` creates an `.ipa` signed for App Store distribution. This CANNOT be installed on devices directly -- only via TestFlight or App Store.
2. **For device testing (pre-submission):** Use the `preview` profile with `"distribution": "internal"`. This creates an ad hoc provisioned build installable on registered devices.
3. **Device registration:** Run `eas device:create` to register the physical iPhone's UDID before building.

### Verification Flow (D-14 -- "Reviewer Run")
1. Install preview/internal build on physical iPhone
2. Fresh state (delete app if previously installed)
3. Complete onboarding flow
4. Complete lesson 1 fully
5. Check subscription screen (paywall renders, prices load or show gracefully offline)
6. Enable airplane mode, verify app works (lessons, progress, navigation)
7. Check that privacy policy link opens in browser

### Important: Production vs Preview
The "production" profile in `eas.json` produces App Store-signed builds. For physical device testing, use the "preview" profile (internal distribution). The success criterion says "production EAS build installs and launches correctly on a physical device" -- this likely means a TestFlight build (production profile uploaded to App Store Connect, then installed via TestFlight) OR adjusting the production profile to also support ad hoc distribution for direct install.

**Recommendation:** Test with `preview` profile on device first (fast iteration). Then do one final `production` build, upload to TestFlight, and verify the TestFlight install works on the physical device. This satisfies LAUNCH-04 and prepares for actual submission.

## Common Pitfalls

### Pitfall 1: Missing Privacy Policy URL at Submission
**What goes wrong:** Apple rejects the build because no privacy policy URL is provided in App Store Connect
**Why it happens:** Developers create the policy but forget to paste the URL in App Store Connect metadata
**How to avoid:** Document the exact URL in the plan and include it in the App Store Connect metadata checklist
**Warning signs:** Empty "Privacy Policy URL" field in App Store Connect

### Pitfall 2: Incorrect Privacy Nutrition Labels
**What goes wrong:** Apple flags discrepancy between declared data collection and actual SDK behavior
**Why it happens:** Developers guess at nutrition labels instead of auditing actual SDK data collection
**How to avoid:** This research documents exact data types per SDK -- use these as the source of truth
**Warning signs:** App uses analytics/crash SDKs but declares "no data collected"

### Pitfall 3: supportsTablet Bug Causes iPad Rejection
**What goes wrong:** App renders broken on iPad because prebuild incorrectly adds iPad support
**Why it happens:** Known Expo bug #32344 -- supportsTablet: false not fully respected
**How to avoid:** After prebuild, inspect Info.plist and project.pbxproj. Verify TARGETED_DEVICE_FAMILY = 1
**Warning signs:** `UISupportedInterfaceOrientations~ipad` present in Info.plist after prebuild

### Pitfall 4: Production Build Not Testable on Device
**What goes wrong:** Production-signed build cannot be installed directly on device
**Why it happens:** App Store distribution builds require TestFlight -- they cannot be sideloaded
**How to avoid:** Use preview/internal distribution profile for device testing, then do final production build for TestFlight
**Warning signs:** "Unable to install" error when trying to install production IPA on device

### Pitfall 5: Education Category + Children's Privacy
**What goes wrong:** Apple asks about COPPA compliance because app is in Education category
**Why it happens:** Education category triggers additional scrutiny for children's data protection
**How to avoid:** Explicitly state in privacy policy and age rating that app is designed for users 13+. Set age rating to 4+ (content is appropriate for all ages, but the user base is adults)
**Warning signs:** Apple review team asks "Is this app designed for children?"

### Pitfall 6: Screenshots Rejected for Device Frame Mismatch
**What goes wrong:** Screenshots rejected because pixel dimensions don't match required sizes
**Why it happens:** Taking screenshots on wrong device/simulator size
**How to avoid:** Use iPhone 15 Pro Max simulator (6.7") for primary screenshots. Verify exact pixel dimensions before upload
**Warning signs:** App Store Connect shows upload error for screenshot dimensions

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Privacy policy | Custom legal drafting | Template-based approach covering actual SDK data | Legal accuracy matters more than custom prose |
| Nutrition label answers | Guesswork | SDK source inspection (done in this research) | Must match actual data collection |
| Device registration | Manual UDID entry | `eas device:create` | Generates shareable registration URL |
| Build distribution | Manual IPA transfer | EAS Build internal distribution | Handles provisioning profiles automatically |

## Architecture Patterns

### Privacy Policy File Structure
```
docs/privacy/
  index.html          # Full privacy policy page
```
OR (separate repo):
```
tila-privacy/
  index.html          # Privacy policy
  CNAME               # (optional) custom domain
```

### In-App Privacy Link Pattern
```typescript
// In Progress tab, below Restore Purchases button
import { Linking } from 'react-native';

const PRIVACY_POLICY_URL = 'https://tila-app.github.io/privacy/';

// Simple pressable text link
<Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
  <Text style={styles.linkText}>Privacy Policy</Text>
</Pressable>
```

### App Store Metadata Document Pattern
Create a markdown file documenting all metadata for easy review:
```
docs/app-store-metadata.md
  - App Name
  - Subtitle (user picks from options)
  - Description (full 4000 chars)
  - Keywords (100 chars)
  - Category
  - Privacy nutrition label answers
  - Privacy policy URL
  - Support URL
  - Screenshot list
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test -- --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAUNCH-01 | Privacy policy URL accessible in-app | Manual | Open app on device, tap link, verify URL loads | N/A (manual) |
| LAUNCH-02 | Privacy questionnaire answers documented | Documentation review | N/A (document artifact) | N/A |
| LAUNCH-03 | supportsTablet: false in prebuild output | Script verification | `npx expo prebuild --platform ios --clean && grep -c "UIDeviceFamily" ios/tila/Info.plist` | N/A (one-time check) |
| LAUNCH-04 | Production build verified on device | Manual | `eas build --platform ios --profile preview` then install and run reviewer flow | N/A (manual) |

### Sampling Rate
- **Per task commit:** `npm run validate` (lint + typecheck)
- **Per wave merge:** `npm test`
- **Phase gate:** Full reviewer run on physical device

### Wave 0 Gaps
None -- this phase is primarily documentation and configuration. No new test files needed. Validation is manual (device testing and document review).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| EAS CLI | Build & submit | Yes | 18.4.0 | -- |
| Node.js | Build tooling | Yes | v24.14.0 | -- |
| Expo CLI | Prebuild verification | Yes | 55.0.18 (npx) | -- |
| Apple Developer Account | iOS build signing | Yes (per D-12) | -- | -- |
| Physical iPhone | Device testing | Yes (per D-12) | -- | -- |
| GitHub account | GitHub Pages hosting | Assumed yes | -- | Alternative hosting |
| Git | Version control | Yes | -- | -- |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual IPA distribution | EAS Build internal distribution | EAS Build v1+ (2022) | No need for manual provisioning profile management |
| App Store nutrition labels optional | Mandatory privacy declarations | iOS 14.3 (Dec 2020) | Must declare all data collection accurately |
| No privacy manifest | PrivacyInfo.xcprivacy required | iOS 17+ (2024) | SDKs must include privacy manifests -- Sentry and PostHog already include them |
| IDFA freely accessible | ATT required for IDFA | iOS 14.5 (Apr 2021) | Apps not using IDFA (like Tila) simply declare "No tracking" |

## Open Questions

1. **GitHub Pages repo structure**
   - What we know: GitHub Pages works with any public repo containing index.html
   - What's unclear: Whether to use a separate repo or a `/docs` folder in the main repo
   - Recommendation: Planner decides -- separate repo is cleaner for legal independence; `/docs` folder is simpler

2. **Screenshot creation tooling**
   - What we know: Need 6.7" and optionally 6.1" iPhone screenshots
   - What's unclear: Whether screenshots exist already or need to be created from scratch
   - Recommendation: Take screenshots from iPhone 15 Pro Max simulator during the reviewer run. This is manual work -- no tooling needed for 3-5 screenshots

3. **Support URL**
   - What we know: Apple requires a support URL in App Store Connect
   - What's unclear: Whether one exists
   - Recommendation: Can be the same GitHub Pages site with a contact page, or a simple email link page

## Sources

### Primary (HIGH confidence)
- PostHog React Native SDK v4.39.0 source code -- direct inspection of `node_modules/posthog-react-native/dist/` for IDFA references (zero found)
- `src/analytics/posthog.ts` -- actual PostHog configuration in the app
- `src/analytics/sentry.ts` -- actual Sentry configuration in the app
- `src/monetization/revenuecat.ts` -- actual RevenueCat configuration in the app
- `app.config.ts` -- supportsTablet: false, bundle IDs, plugins
- `eas.json` -- build profiles and submit configuration
- [RevenueCat Apple App Privacy docs](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy) -- nutrition label requirements
- [Sentry Data Collected docs](https://docs.sentry.io/platforms/react-native/data-management/data-collected/) -- data categories

### Secondary (MEDIUM confidence)
- [Apple Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) -- device sizes and pixel dimensions
- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/) -- nutrition label requirements
- [Expo Internal Distribution docs](https://docs.expo.dev/build/internal-distribution/) -- ad hoc provisioning flow
- [Expo Issue #32344](https://github.com/expo/expo/issues/32344) -- supportsTablet bug (closed with PR #32361, possible regression)

### Tertiary (LOW confidence)
- [App Store Review Guidelines 2026](https://theapplaunchpad.com/blog/app-store-review-guidelines) -- common rejection reasons (third-party summary, not Apple source)

## Metadata

**Confidence breakdown:**
- PostHog IDFA: HIGH -- verified by direct SDK source inspection
- Privacy nutrition labels: HIGH -- based on actual SDK configs and official RevenueCat/Sentry docs
- Privacy policy requirements: HIGH -- Apple guidelines well-documented
- EAS Build workflow: HIGH -- EAS CLI installed, eas.json configured, well-documented
- supportsTablet verification: MEDIUM -- known Expo bug may require workaround on SDK 55
- App Store metadata: HIGH -- character limits from official Apple docs

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable domain -- Apple guidelines change infrequently)
