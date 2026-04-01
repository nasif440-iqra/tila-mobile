# Phase 5: Launch Ops Checklist - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 05-launch-ops-checklist
**Areas discussed:** Privacy policy, Data collection, App Store metadata, Build verification

---

## Privacy Policy

| Option | Description | Selected |
|--------|-------------|----------|
| I have one hosted | Already have a URL | |
| Need to create one | Generate covering PostHog, Sentry, RevenueCat | ✓ |
| Have draft, needs URL | Policy text exists but not hosted | |

**User's choice:** Need to create one
**Notes:** No existing privacy policy anywhere in the app

### Hosting

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Pages | Free, version-controlled, easy to update | ✓ |
| Existing website | Host on owned domain | |
| You decide | Claude picks simplest option | |

**User's choice:** GitHub Pages

### In-App Link Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Progress tab settings | Near Restore Purchases | |
| Onboarding + settings | Show during onboarding AND settings | |
| You decide | Claude places where best for review | ✓ |

**User's choice:** You decide (Claude's discretion)

---

## Data Collection

### PostHog IDFA

| Option | Description | Selected |
|--------|-------------|----------|
| No IDFA collection | Anonymous session IDs only | |
| Not sure | Need to verify SDK config | ✓ |
| Yes, collects IDFA | Configured for advertising identifiers | |

**User's choice:** Not sure — researcher will verify
**Notes:** Determines ATT prompt requirement

### Sentry Classification

| Option | Description | Selected |
|--------|-------------|----------|
| Crash data only | Declare under "Data Used to Track You: No" | |
| You decide | Claude determines from Sentry config | ✓ |

**User's choice:** You decide (Claude's discretion)

---

## App Store Metadata

### Readiness

| Option | Description | Selected |
|--------|-------------|----------|
| Not yet | Need to prepare all metadata | ✓ |
| Screenshots ready | Have screenshots, need copy | |
| Everything ready | All prepared externally | |
| Out of scope | Handle manually outside milestone | |

**User's choice:** Not yet — prepare as part of phase

### Category

| Option | Description | Selected |
|--------|-------------|----------|
| Education | Natural fit for Quranic Arabic learning | ✓ |
| Reference | Some Arabic/Quran apps use this | |
| You decide | Competitor analysis based | |

**User's choice:** Education

### Screenshot Devices

| Option | Description | Selected |
|--------|-------------|----------|
| iPhone only | 6.7" + 6.1", no iPad needed | ✓ |
| iPhone + Android | Both stores simultaneously | |
| You decide | Minimum viable set | |

**User's choice:** iPhone only

### Tagline

| Option | Description | Selected |
|--------|-------------|----------|
| I'll provide one | Has tagline ready | |
| Generate options | Claude generates 3-4 options | ✓ |
| You decide | Claude picks for ASO | |

**User's choice:** Generate options for user to pick

---

## Build Verification

### Devices Available

| Option | Description | Selected |
|--------|-------------|----------|
| Android only | iOS on simulator/TestFlight | |
| iOS only | iPhone available for testing | ✓ |
| Both iOS + Android | Can test on both | |
| Neither yet | No device testing setup | |

**User's choice:** iOS only

### Test Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Full flow | Fresh install → onboarding → lesson 1 → subscription → offline | ✓ |
| Launch + lesson | Minimal smoke test | |
| You decide | Claude defines minimum checklist | |

**User's choice:** Full flow (reviewer run from CLAUDE.md)

### Apple Developer Account

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, enrolled | Active membership, can submit | ✓ |
| Pending enrollment | Applied, waiting approval | |
| Not yet | Haven't enrolled | |

**User's choice:** Yes, enrolled

---

## Claude's Discretion

- In-app privacy policy link placement
- Sentry privacy nutrition label classification

## Deferred Ideas

None — discussion stayed within phase scope
