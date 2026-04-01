# Tila — Stability & App Store Readiness

## What This Is

Tila is a mobile app that teaches converts and new Muslims to read the Quran, starting from the Arabic alphabet. Built with Expo 55 / React Native 0.83, it uses mastery-based learning with spaced repetition, offline-first SQLite storage, and a freemium model (RevenueCat). The UI overhaul milestone is ~90% complete. This milestone hardens the codebase for App Store submission.

## Core Value

The app must never crash, hang, or lose user progress. Every session — from first launch to lesson 50 — must feel solid and trustworthy.

## Requirements

### Validated

- ✓ Mastery-based learning system with SRS — existing
- ✓ 28 Arabic letter curriculum across 4 phases — existing
- ✓ Offline-first SQLite storage — existing
- ✓ UI overhaul (design system, transitions, celebrations) — existing
- ✓ RevenueCat monetization (6 free lessons, trial, subscription) — existing
- ✓ PostHog analytics + Sentry crash reporting — existing
- ✓ Onboarding flow with wird streak tracking — existing

### Active

- [ ] DB init timeout + recovery UI (not hanging forever)
- [ ] Quiz hook ref reset on lesson transition
- [ ] Streak race condition fix under rapid taps
- [ ] Home screen midnight routing guard
- [ ] Migration error discrimination (align with later migration patterns)
- [ ] Audio playback try/catch on play() calls
- [ ] Unhandled promise rejection audit
- [ ] Selective screen-level error boundaries (not blanket-wrapping)
- [ ] Offline entitlement behavior + restore purchases surface
- [ ] Critical `any` type removal in hook interfaces
- [ ] Regression tests for fixed flows
- [ ] Launch ops: privacy policy, App Store metadata, iPad QA, production build

### Out of Scope

- Dark mode activation — tokens exist but cosmetic, not stability
- New features or curriculum content — stability only
- Cloud sync / backend — future milestone
- Push notifications — future milestone
- UI redesign — completed in previous milestone
- Full .js → .ts engine migration — minimize blast radius
- ATT prompt — PostHog does first-party analytics, declare "No tracking"
- RevenueCat init rewrite — already degrades gracefully when unconfigured
- Mastery engine getLetter import — already imports correctly (stale finding)

## Context

- App is a layered Expo app with file-based routing, custom hooks, and local SQLite — not a messy prototype
- RevenueCat already degrades when unconfigured (skips setup). Real gap is edge-case UX, not total absence
- Sentry error boundary already wraps root. Question is targeted screen-level isolation
- Vitest suite exists with tests for mastery, quiz, schema, home streak, error boundaries. Gap is specific untested risky flows
- Subscription/offline handling partly implemented (loading, unknown, refresh catch). Gap is entitlement edge cases
- Home screen is a large file with route decisions tied to date state — likely hotspot
- App Store review requires reliability — crashes or hangs during review = rejection

## Constraints

- **Stack**: Expo SDK 55, React Native 0.83, New Architecture — no framework changes
- **No business logic changes**: Engine algorithms stay the same, we're fixing bugs not redesigning
- **Offline-first**: All fixes must work without network connectivity
- **Performance**: No regressions on mid-range Android (60fps animations must hold)
- **Backwards compatible**: Existing user data (SQLite) must not be corrupted by fixes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Narrow scope to repo-backed items only | Proposal review scored 6/10 — dropped stale/overstated items | ✓ Good |
| Fix bugs in existing .js engine files, don't migrate to .ts | Minimize blast radius, stability milestone not refactor | — Pending |
| Selective screen boundaries, not blanket wrapping | Root Sentry boundary already exists — add only where expensive async/monetization lives | — Pending |
| App Store compliance as separate launch checklist | Operational tasks, not engineering project — don't mix with code hardening | — Pending |
| Build on existing RevenueCat handling | Init already degrades gracefully — focus on edge-case UX, not rewrite | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-31 after initialization*
