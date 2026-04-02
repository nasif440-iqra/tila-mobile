# Phase 6: App Store Submission - Research

**Researched:** 2026-04-01
**Domain:** App Store / Google Play submission, EAS Submit, privacy manifests, metadata
**Confidence:** HIGH

## Summary

Phase 6 closes the gap between a working app and a published app. Most submission groundwork was completed in v1.0 Phase 5 (privacy policy, metadata draft, EAS config, privacy questionnaire). The remaining work is: (1) host the privacy policy on GitHub Pages, (2) add a support contact link in the app, (3) configure privacy manifests in app.config.ts, (4) capture screenshots, (5) trigger production EAS builds, (6) test on real device, and (7) submit via `eas submit`.

Critical prerequisites outside Claude's scope: the founder must have Apple Developer enrollment active, RevenueCat products configured as "Ready to Submit" in App Store Connect, and a Google Play Console account with the app created. The Android first submission must be done manually (Google Play API limitation) -- `eas submit` can only automate subsequent submissions.

**Primary recommendation:** Split work into code changes (support contact, privacy URL update, privacy manifest config), founder-dependent tasks (GitHub Pages repo creation, App Store Connect / Play Console setup, RevenueCat product config), and submission tasks (screenshots, production build, device test, submit).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Host privacy policy on GitHub Pages at `https://tila-app.github.io/privacy/`
- D-02: Create a simple `tila-app.github.io` repo with privacy policy content from `docs/PRIVACY_POLICY.md`
- D-03: Update the in-app privacy link on Progress tab to point to the live URL
- D-04: Add a support email link on the Progress tab alongside the existing privacy policy link
- D-05: Support email: `support@tila.app` (already used in scholarship mailto)
- D-06: No dedicated settings screen -- keep it simple on Progress tab: "Privacy Policy" + "Contact Support" links
- D-07: Claude selects best subtitle from 4 options in APP-STORE-METADATA.md
- D-08: Screenshots: capture on simulator for required sizes (6.7" iPhone 15 Pro Max, 5.5" iPhone 8 Plus for iOS; Phone and 7" tablet for Google Play)
- D-09: Screenshot screens: onboarding welcome, lesson in progress, quiz question, lesson summary with insights, progress tab, home screen with streak
- D-10: Use existing metadata document content -- don't rewrite
- D-11: Trigger production EAS build for both iOS and Android
- D-12: Test production build on real device: full lesson flow (onboarding -> lesson 1 -> completion -> progress)
- D-13: Submit to Apple App Store and Google Play Store via `eas submit`
- D-14: Review notes for Apple: explain free tier (7 lessons), subscription model, provide instructions for testing without purchase
- D-15: Privacy manifest handled by Expo/dependency plugins -- no custom PrivacyInfo.xcprivacy needed
- D-16: Privacy questionnaire answers already prepared in `docs/APP_STORE_PRIVACY.md`

### Claude's Discretion
- Subtitle selection from the 4 options
- Screenshot composition and framing
- Review notes wording for Apple
- Google Play content rating questionnaire answers
- Version/build number management

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONV-08 | App Store submission complete -- screenshots, metadata, privacy manifest, review notes, production build on device | Full submission pipeline researched: EAS Build + Submit commands, privacy manifest config, metadata from APP-STORE-METADATA.md, screenshot requirements, review notes for subscription app |
| CONV-09 | Support contact visible in app settings (required for early adopter data-loss mitigation) | Progress tab code reviewed (lines 366-374 for privacy link pattern); support email link follows same Pressable + Linking.openURL pattern |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| EAS CLI | 18.4.0 | Build + submit to stores | Already installed, authenticated as tila.app owner |
| expo-sqlite | 55.0.11 | Privacy manifest contributor | Expo SDK packages include their own PrivacyInfo.xcprivacy |
| PostHog RN | 4.39.0 | Analytics (privacy declaration) | Must declare in App Store privacy questionnaire |
| Sentry RN | 7.11.0 | Crash reporting (privacy declaration) | Must declare in App Store privacy questionnaire |
| RevenueCat | 9.15.0 | Subscription management | Products must be "Ready to Submit" in App Store Connect |

### Supporting (No New Dependencies)
This phase adds zero new npm packages. All work uses existing EAS CLI, Expo config, and React Native APIs (`Linking.openURL`).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GitHub Pages for privacy policy | Vercel, Netlify, tila.app domain | GitHub Pages is simplest -- single static HTML file, free, no deploy pipeline |
| `eas submit` | Transporter (iOS), manual Play Console upload | `eas submit` automates both platforms from CLI; Transporter is macOS-only |
| Simulator screenshots | Real device screenshots | Simulator is sufficient and provides clean status bars; real device may show personal data |

## Architecture Patterns

### Code Changes Required

The only in-app code change is adding a support contact link on the Progress tab. Everything else is configuration and external tooling.

```
app/(tabs)/progress.tsx     # Add "Contact Support" link (CONV-09)
app.config.ts               # Add privacyManifests config under ios
```

### Pattern: Support Contact Link (follows existing privacy link pattern)

**What:** Add a "Contact Support" Pressable below the Privacy Policy link on the Progress tab
**When to use:** This exact pattern already exists at lines 366-374 of progress.tsx
**Example:**
```typescript
// Source: existing progress.tsx pattern (lines 366-374)
{/* Contact Support */}
<Pressable
  onPress={() => Linking.openURL('mailto:support@tila.app')}
  style={styles.privacyLink}
>
  <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
    Contact Support
  </Text>
</Pressable>
```

### Pattern: Privacy Manifest Configuration

**What:** Declare required API reasons in app.config.ts so Expo generates PrivacyInfo.xcprivacy during build
**When to use:** Required for all iOS App Store submissions since May 2024
**Example:**
```typescript
// Source: https://docs.expo.dev/guides/apple-privacy/
ios: {
  supportsTablet: false,
  bundleIdentifier: "com.tilaapp.tila",
  privacyManifests: {
    NSPrivacyAccessedAPITypes: [
      {
        NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
        NSPrivacyAccessedAPITypeReasons: ["CA92.1"]
      }
    ]
  },
  infoPlist: {
    UIBackgroundModes: [],
    ITSAppUsesNonExemptEncryption: false,
  },
},
```

**Note on D-15:** The CONTEXT.md says "no custom PrivacyInfo.xcprivacy needed" -- this is mostly true because Expo SDK packages bundle their own. However, Apple does not always correctly parse PrivacyInfo from static CocoaPods dependencies, so adding `privacyManifests` in app.config.ts is the safety net. This is configuration, not a custom file. The planner should include this as a precautionary step.

### Pattern: Privacy Policy URL Update

**What:** Update the `PRIVACY_POLICY_URL` constant in progress.tsx
**Current value:** `"https://tila.app/privacy"` (line 48)
**New value:** `"https://tila-app.github.io/privacy/"` (per D-01)

### Anti-Patterns to Avoid
- **Submitting before RevenueCat products are "Ready to Submit":** Apple will reject if in-app purchases are not properly configured. Products must show "Ready to Submit" status in App Store Connect before the binary is submitted for review.
- **Skipping the manual first Android upload:** Google Play API requires at least one manual upload via Play Console before `eas submit` works. Plan must account for this.
- **Using `--auto-submit` on first submission:** Too risky -- better to build first, verify, then submit separately.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Privacy policy hosting | Custom web app or server | GitHub Pages with single index.html | Zero maintenance, free, survives indefinitely |
| Screenshot capture | Custom tooling or scripts | Simulator manual capture | Only needed once for v1.0, 6 screenshots total |
| App Store binary upload | Manual Transporter download | `eas submit --platform ios` | Works from Windows (unlike Transporter which is macOS-only) |
| Privacy manifest | Hand-crafted PrivacyInfo.xcprivacy | `privacyManifests` field in app.config.ts | Expo generates the file during build |

## Common Pitfalls

### Pitfall 1: RevenueCat Products Not Ready
**What goes wrong:** App is submitted but in-app purchases show "Missing Metadata" in App Store Connect, causing immediate rejection.
**Why it happens:** RevenueCat products and App Store Connect subscription groups must be configured and marked "Ready to Submit" before the binary is submitted.
**How to avoid:** Verify product status in App Store Connect before running `eas submit`. This is a founder task that blocks submission.
**Warning signs:** `STORE_PROBLEM` errors during testing, products not appearing in paywall.

### Pitfall 2: Google Play First Upload Must Be Manual
**What goes wrong:** `eas submit -p android` fails on first attempt because Google Play API rejects it.
**Why it happens:** Google Play Store API limitation -- the first AAB/APK must be uploaded manually through Play Console.
**How to avoid:** Plan explicitly calls out manual first upload as a founder task. Use `eas build -p android --profile production` to get the AAB, then upload manually to Play Console.
**Warning signs:** API error from Google Play during `eas submit`.

### Pitfall 3: Privacy Manifest Rejection
**What goes wrong:** Apple rejects build because required API usage reasons are missing from the privacy manifest.
**Why it happens:** Expo SDK packages include their own PrivacyInfo.xcprivacy, but Apple sometimes does not parse them from static CocoaPods dependencies.
**How to avoid:** Add `privacyManifests` configuration in app.config.ts as a safety net. At minimum declare UserDefaults usage (used by most RN apps).
**Warning signs:** Rejection email citing "ITMS-91053: Missing API declaration."

### Pitfall 4: Sandbox Payment Issues During Review
**What goes wrong:** Apple reviewer cannot complete a purchase, sees error, rejects app.
**Why it happens:** Apple's sandbox environment can be temporarily unavailable. RevenueCat's `STORE_PROBLEM` error appears.
**How to avoid:** Include detailed review notes explaining that the app has 7 free lessons that don't require purchase. Explain how to test the free tier thoroughly. Mention that subscription purchase is optional and the restore button exists.
**Warning signs:** Rejection citing Guideline 2.1 (Performance: App Completeness).

### Pitfall 5: Missing App Store Connect App Entry
**What goes wrong:** `eas submit --platform ios` fails because no app exists in App Store Connect.
**Why it happens:** The app entry must be created in App Store Connect (with matching bundle ID) before submission.
**How to avoid:** Founder must create the app entry in App Store Connect with bundle ID `com.tilaapp.tila` before the submission step.
**Warning signs:** EAS CLI error about missing app or mismatched bundle ID.

### Pitfall 6: Screenshot Size Mismatch
**What goes wrong:** Screenshots uploaded at wrong resolution, rejected or appear blurry.
**Why it happens:** Apple requires specific pixel dimensions per device class.
**How to avoid:** Capture on iPhone 15 Pro Max simulator (6.7", 1290x2796) and iPhone 8 Plus simulator (5.5", 1242x2208). For Google Play, use a phone simulator and 7" tablet.
**Warning signs:** App Store Connect shows warnings about screenshot sizes.

## Code Examples

### Adding Support Contact to Progress Tab
```typescript
// In app/(tabs)/progress.tsx, after the Privacy Policy Pressable (line 374):

{/* Contact Support */}
<Pressable
  onPress={() => Linking.openURL('mailto:support@tila.app')}
  style={styles.privacyLink}  // Reuse same style as privacy link
>
  <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
    Contact Support
  </Text>
</Pressable>
```

### Privacy Manifest in app.config.ts
```typescript
// In app.config.ts, under ios:
ios: {
  supportsTablet: false,
  bundleIdentifier: "com.tilaapp.tila",
  privacyManifests: {
    NSPrivacyAccessedAPITypes: [
      {
        NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
        NSPrivacyAccessedAPITypeReasons: ["CA92.1"]
      }
    ]
  },
  infoPlist: {
    UIBackgroundModes: [],
    ITSAppUsesNonExemptEncryption: false,
  },
},
```

### EAS Build Commands
```bash
# Production builds
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit iOS (after build completes)
eas submit --platform ios

# Submit Android (only after manual first upload to Play Console)
eas submit --platform android
```

### Apple Review Notes Template
```
Tila is a Quran reading education app. No login or account is required.

FREE CONTENT: The first 7 lessons are completely free. To test the app:
1. Open the app (no login needed)
2. Complete onboarding (optional name, motivation selection)
3. Start Lesson 1 and complete the quiz
4. Continue through lessons 1-7 (all free)

SUBSCRIPTION: After lesson 7, a paywall appears offering premium access.
Subscription pricing: $8.99/month or $49.99/year with 7-day free trial.
Scholarship program available for those who cannot afford subscription.

RESTORE PURCHASES: Available on the Progress tab (bottom of screen).

The app works fully offline. All learning data is stored locally on device.
```

### GitHub Pages Privacy Policy (index.html)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tila - Privacy Policy</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 720px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333; }
    h1, h2, h3 { color: #163323; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f4f4f4; }
  </style>
</head>
<body>
  <!-- Convert docs/PRIVACY_POLICY.md to HTML and paste here -->
</body>
</html>
```

## Subtitle Recommendation

From the 4 options in APP-STORE-METADATA.md:

| # | Subtitle | Chars | Assessment |
|---|----------|-------|------------|
| 1 | Learn to Read Quranic Arabic | 28 | Best keyword coverage: "learn", "read", "Quranic", "Arabic" all high-value search terms |
| 2 | Read the Quran from Alif | 24 | Good but "Alif" is niche -- most searchers won't use it |
| 3 | Master Arabic Letters | 21 | Too narrow -- misses "Quran" keyword entirely |
| 4 | Quran Reading for Beginners | 27 | Strong but "Beginners" may discourage some users |

**Recommendation:** Option 1 -- "Learn to Read Quranic Arabic" -- maximizes keyword relevance for the target audience searching for Quran + Arabic + learning.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Transporter upload (macOS only) | `eas submit` from any OS | EAS CLI v1+ | Windows users can submit iOS apps |
| Custom PrivacyInfo.xcprivacy file | `privacyManifests` in app.config | Expo SDK 50+ | No Xcode needed for managed workflow |
| Manual first Play Store upload required | Still required | Unchanged | First Android submission must go through Play Console UI |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| EAS CLI | Build + submit | Yes | 18.4.0 | -- |
| Node.js | EAS CLI | Yes | 24.14.0 | -- |
| npm | Package management | Yes | 11.9.0 | -- |
| Apple Developer Account | iOS submission | Unknown | -- | Founder must verify enrollment is active |
| App Store Connect App Entry | iOS submission | Unknown | -- | Founder must create before submission |
| Google Play Console Account | Android submission | Unknown | -- | Founder must create before submission |
| Google Service Account Key | `eas submit -p android` | Unknown | -- | Manual upload via Play Console for first submission |
| RevenueCat products configured | Subscription review | Unknown | -- | BLOCKS submission -- must be resolved first |
| iOS Simulator (Xcode) | Screenshots | Unknown (Windows machine) | -- | Use Expo Go on real device or remote macOS |
| Android Emulator | Screenshots | Unknown | -- | Use real Android device |

**Missing dependencies with no fallback (BLOCKING):**
- Apple Developer enrollment must be active
- App Store Connect app entry must exist with bundle ID `com.tilaapp.tila`
- RevenueCat products must be "Ready to Submit" in App Store Connect

**Missing dependencies with fallback:**
- iOS Simulator not available on Windows -- screenshots can be captured on a real iPhone or via EAS Build's build artifacts on macOS cloud
- Google Service Account Key -- first upload done manually, key needed only for subsequent automated submissions

**Critical note on screenshots:** The user is on Windows. iOS Simulator requires macOS/Xcode. Options: (1) capture on a real iPhone, (2) use a cloud Mac service, (3) take screenshots from Expo Go on a real device. Android screenshots can be captured on a local emulator or real device. The planner must flag this to the founder.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONV-08 | App Store submission (screenshots, metadata, build, submit) | manual-only | N/A -- submission is an operational task, not testable via unit tests | N/A |
| CONV-09 | Support contact visible on Progress tab | unit | `npx vitest run src/__tests__/support-contact.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run validate`
- **Phase gate:** Full suite green + production build verified on device

### Wave 0 Gaps
- [ ] `src/__tests__/support-contact.test.ts` -- verify support contact link renders on Progress tab and uses correct mailto URL

## Founder Prerequisites Checklist

These items CANNOT be done by Claude and must be completed by the founder before submission tasks execute:

1. **Apple Developer Program enrollment** -- must be active (costs $99/year)
2. **App Store Connect app entry** -- create app with bundle ID `com.tilaapp.tila`, primary category Education
3. **RevenueCat products** -- configure subscription products in App Store Connect, link to RevenueCat, ensure "Ready to Submit" status
4. **Google Play Console** -- create developer account ($25 one-time), create app listing
5. **Google Service Account Key** -- create for automated submissions (optional if doing manual first upload)
6. **GitHub organization `tila-app`** -- create for hosting privacy policy at `tila-app.github.io`
7. **Domain email** -- ensure `support@tila.app` and `privacy@tila.app` are receiving mail

## Open Questions

1. **iOS Screenshots on Windows**
   - What we know: iOS Simulator requires macOS/Xcode, user is on Windows
   - What's unclear: Whether the founder has access to a Mac or real iPhone
   - Recommendation: Plan should flag this and offer alternatives (real device, cloud Mac, or founder captures manually)

2. **RevenueCat Product Configuration Status**
   - What we know: STATE.md lists "RevenueCat / App Store Connect subscription config has issues (founder resolving separately)"
   - What's unclear: Whether products are configured and "Ready to Submit"
   - Recommendation: Plan should make submission task explicitly dependent on this being resolved. Include a verification step.

3. **ascAppId for EAS Submit**
   - What we know: EAS submit needs the Apple App Store Connect app ID
   - What's unclear: Whether the app entry exists yet in App Store Connect
   - Recommendation: Plan should include a step to add `ascAppId` to eas.json once the founder provides it

## Sources

### Primary (HIGH confidence)
- [Expo Privacy Manifests Guide](https://docs.expo.dev/guides/apple-privacy/) -- privacyManifests config, SDK package handling
- [EAS Submit iOS Docs](https://docs.expo.dev/submit/ios/) -- iOS submission flow, ascAppId, credentials
- [EAS Submit Android Docs](https://docs.expo.dev/submit/android/) -- Android submission flow, manual first upload requirement
- [RevenueCat App Store Rejections](https://www.revenuecat.com/docs/test-and-launch/app-store-rejections) -- common subscription-related rejection reasons

### Secondary (MEDIUM confidence)
- [App Store Review Guidelines 2026](https://theapplaunchpad.com/blog/app-store-review-guidelines) -- current rejection patterns
- [Apple App Store Rejection Reasons 2025](https://twinr.dev/blogs/apple-app-store-rejection-reasons-2025/) -- common rejection categories

### Tertiary (LOW confidence)
- Privacy manifest UserDefaults reason code "CA92.1" -- verified in Expo docs but exact required reasons may vary per app's dependency tree

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all tooling already installed and authenticated
- Architecture: HIGH -- single file change (progress.tsx) + config change (app.config.ts), patterns already established in codebase
- Pitfalls: HIGH -- well-documented rejection reasons from RevenueCat docs and Apple guidelines
- Submission process: MEDIUM -- first-time submission has unknowns around founder-dependent tasks (Apple enrollment, RevenueCat config)

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable -- App Store submission process changes infrequently)
