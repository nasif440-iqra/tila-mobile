# Phase 6: App Store Submission - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning
**Source:** MASTER-PLAN.md (Block 2, item 2.8) + v1.0 launch ops artifacts

<domain>
## Phase Boundary

Get the app submitted to App Store and Google Play with all required assets, metadata, support contact, and a production build verified on device. Most groundwork was completed in v1.0 Phase 5 (launch ops) — this phase closes the remaining gaps and executes the submission.

</domain>

<decisions>
## Implementation Decisions

### Privacy Policy Hosting
- **D-01:** Host privacy policy on GitHub Pages at `https://tila-app.github.io/privacy/` (already referenced in v1.0 metadata)
- **D-02:** Create a simple `tila-app.github.io` repo with the privacy policy content from `docs/PRIVACY_POLICY.md`
- **D-03:** Update the in-app privacy link on Progress tab to point to the live URL

### Support Contact (CONV-09)
- **D-04:** Add a support email link on the Progress tab alongside the existing privacy policy link
- **D-05:** Support email: `support@tila.app` (already used in scholarship mailto)
- **D-06:** No dedicated settings screen — keep it simple on the Progress tab: "Privacy Policy" + "Contact Support" links

### App Store Metadata
- **D-07:** Claude selects the best subtitle from the 4 options in the existing APP-STORE-METADATA.md based on keyword optimization and App Store best practices
- **D-08:** Screenshots: capture on simulator for required sizes (6.7" iPhone 15 Pro Max, 5.5" iPhone 8 Plus for iOS; Phone and 7" tablet for Google Play)
- **D-09:** Screenshot screens: onboarding welcome, lesson in progress, quiz question, lesson summary with insights, progress tab, home screen with streak
- **D-10:** Use existing metadata document content — don't rewrite

### Production Build & Submission
- **D-11:** Trigger production EAS build for both iOS and Android
- **D-12:** Test production build on real device: full lesson flow (onboarding → lesson 1 → completion → progress)
- **D-13:** Submit to Apple App Store and Google Play Store via `eas submit`
- **D-14:** Review notes for Apple: explain free tier (7 lessons), subscription model, provide instructions for testing without purchase

### Privacy Manifest
- **D-15:** Privacy manifest handled by Expo/dependency plugins — no custom PrivacyInfo.xcprivacy needed
- **D-16:** Privacy questionnaire answers already prepared in `docs/APP_STORE_PRIVACY.md` — use directly in App Store Connect

### Claude's Discretion
- Subtitle selection from the 4 options
- Screenshot composition and framing
- Review notes wording for Apple
- Google Play content rating questionnaire answers
- Version/build number management

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Submission Assets (from v1.0)
- `docs/PRIVACY_POLICY.md` — Complete privacy policy document
- `docs/APP_STORE_PRIVACY.md` — App Store Connect privacy questionnaire answers
- `.planning/milestones/v1.0-phases/05-launch-ops-checklist/APP-STORE-METADATA.md` — Title, subtitle options, description, keywords, screenshots plan

### App Configuration
- `eas.json` — Build profiles (development, preview, production) + submit config
- `app.json` — Version 1.0.0, bundle IDs (iOS: com.tilaapp.tila, Android: com.tila.app), tablet support, encryption declaration

### In-App Links
- `app/(tabs)/progress.tsx` — Privacy policy link (line 48), restore purchases button (lines 349-364)

### Design System
- `src/design/tokens.ts` — For any UI additions (support contact link styling)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Privacy policy link pattern on Progress tab — follow same pattern for support contact
- `Linking.openURL()` for external links (already used for scholarship mailto)
- EAS CLI for builds and submission

### What's Already Done
- Privacy policy content written
- Privacy questionnaire answered
- App Store metadata drafted (needs subtitle selection)
- EAS production profile configured
- iPad letterbox verified
- Restore purchases button implemented

### What's Missing
- GitHub Pages repo for privacy policy hosting
- Support contact link in app
- Screenshots
- Production build (preview was used in v1.0)
- Actual submission

</code_context>

<specifics>
## Specific Ideas

- The MASTER-PLAN.md notes common rejection risks: missing privacy manifest, subscription metadata mismatch, missing restore purchases button (already implemented), no way for reviewer to test premium features
- Review notes should explain how to test: complete onboarding, play lessons 1-7 (free), see paywall at lesson 7, restore purchases available on Progress tab
- RevenueCat product configuration in App Store Connect is a separate founder workstream — must be resolved before submission

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-app-store-submission*
*Context gathered: 2026-04-02*
