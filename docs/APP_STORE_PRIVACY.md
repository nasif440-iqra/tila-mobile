# App Store Connect Privacy Questionnaire Answers

**App:** Tila - Learn Quranic Arabic
**Last Updated:** April 1, 2026

This document provides the exact answers for the App Store Connect privacy questionnaire during app submission. Answers are based on actual SDK usage in the codebase.

---

## App Tracking Transparency (ATT)

**Does your app use the App Tracking Transparency framework?** No

**Rationale:** PostHog is configured as first-party analytics with `captureAppLifecycleEvents: false` and `enableSessionReplay: false`. No IDFA is collected. No advertising SDK is present. The app does not track users across other companies' apps or websites.

**App Store "tracking" declaration:** Select **"No, we do not collect data used to track"**

---

## Data Types Collected

### 1. Identifiers

**Do you or your third-party partners collect identifiers?** Yes

| Detail | Answer |
|--------|--------|
| Data type | Device ID or similar (anonymous random ID) |
| Linked to user identity? | No |
| Used for tracking? | No |
| Purpose | Analytics, App Functionality |
| Who collects? | Developer (via PostHog, Sentry, RevenueCat) |

**Note:** The "identifier" is a randomly generated anonymous ID, not a device hardware ID, Apple ID, or email.

### 2. Diagnostics

**Do you collect crash data or performance data?** Yes

| Detail | Answer |
|--------|--------|
| Data type | Crash Data |
| Linked to user identity? | No |
| Used for tracking? | No |
| Purpose | App Functionality (crash recovery) |
| Who collects? | Developer (via Sentry) |

### 3. Purchases

**Do you collect purchase history?** Yes

| Detail | Answer |
|--------|--------|
| Data type | Purchase History |
| Linked to user identity? | No |
| Used for tracking? | No |
| Purpose | App Functionality (subscription access) |
| Who collects? | Developer (via RevenueCat) |

**Note:** RevenueCat only receives transaction status and anonymous user ID. No payment method or billing details are collected by the app.

### 4. Usage Data

**Do you collect product interaction data?** Yes

| Detail | Answer |
|--------|--------|
| Data type | Product Interaction (lesson events, feature usage) |
| Linked to user identity? | No |
| Used for tracking? | No |
| Purpose | Analytics |
| Who collects? | Developer (via PostHog, consent-gated) |

---

## Data Types NOT Collected

Check "No" for all of the following:

- [ ] Contact Info (name, email, phone, address)
- [ ] Health & Fitness
- [ ] Financial Info (beyond purchase history above)
- [ ] Location (precise or coarse)
- [ ] Sensitive Info
- [ ] Contacts (address book)
- [ ] User Content (photos, videos, emails)
- [ ] Browsing History
- [ ] Search History
- [ ] Surroundings (environment scanning)
- [ ] Body (body measurements)
- [ ] Other Data

---

## Privacy Nutrition Label Summary

Based on the answers above, the App Store privacy nutrition label should show:

### Data Used to Track You
**None** -- the app does not track users.

### Data Linked to You
**None** -- all identifiers are anonymous and cannot be tied to a real identity.

### Data Not Linked to You
- **Identifiers** -- Anonymous ID for analytics and subscription management
- **Diagnostics** -- Crash logs for stability
- **Purchases** -- Subscription status
- **Usage Data** -- Lesson and feature interaction events (consent-gated)

---

## SDK-Specific Details

### PostHog (Analytics)

- **SDK:** `posthog-react-native` v4.39.0
- **Config:** `captureAppLifecycleEvents: false`, `enableSessionReplay: false`, `preloadFeatureFlags: false`, `personProfiles: 'identified_only'`
- **Consent:** Opt-in only. Analytics only initialize if user grants consent.
- **IDFA:** Not collected. No ATT prompt needed.
- **Server:** `us.i.posthog.com` (US region, first-party hosting)

### Sentry (Crash Reporting)

- **SDK:** `@sentry/react-native` v7.11.0
- **Config:** `tracesSampleRate: 0` (no performance tracing), `enabled: !__DEV__` (production only)
- **Data:** Stack traces, device type, OS version, app version
- **Always on:** Crash reporting runs without explicit consent (legitimate interest)

### RevenueCat (Subscriptions)

- **SDK:** `react-native-purchases` v9.15.0
- **Data:** Anonymous app user ID, entitlement status, transaction IDs
- **No PII:** Does not receive name, email, or payment details
- **Offline:** SDK caches subscription status on-device for offline access

---

## Google Play Data Safety (Android)

For the Google Play Console data safety form, use equivalent declarations:

| Category | Collected | Shared | Purpose |
|----------|-----------|--------|---------|
| App activity (in-app actions) | Yes | No | Analytics |
| App info and performance (crash logs) | Yes | No | App stability |
| Financial info (purchase history) | Yes | No | Subscription management |
| Device or other IDs | Yes | No | Analytics, subscriptions |

**Data deletion:** Users can reset all local data via the Progress tab. Server-side data deletion available on request via privacy@tila.app.

---

*Reference this document when completing App Store Connect or Google Play Console submission forms.*
