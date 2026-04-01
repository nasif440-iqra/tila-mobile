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

- [ ] Database initialization never hangs — shows error screen on failure
- [ ] Quiz hook correctly resets between lesson transitions
- [ ] Streak counter is race-condition-proof under rapid taps
- [ ] Home screen routing is stable across midnight boundary
- [ ] RevenueCat fails gracefully when API keys are missing or SDK is unconfigured
- [ ] Mastery engine has correct imports and handles edge cases
- [ ] Database migrations distinguish real errors from "column already exists"
- [ ] Audio playback errors are caught and handled (no unhandled rejections)
- [ ] Type safety across hooks and engine — eliminate critical `any` types
- [ ] Error boundaries catch component-level crashes with recovery UI
- [ ] Subscription state handles offline gracefully
- [ ] Test coverage for critical paths (mastery, progress, habit, quiz flow)

### Out of Scope

- Dark mode activation — tokens exist but not this milestone's concern
- New features or curriculum content — stability only
- Cloud sync / backend — future milestone
- Push notifications — future milestone
- UI redesign — already done in previous milestone

## Context

- App has been through a UI overhaul milestone (~90% complete, 2 plans unexecuted)
- First Android build shipped; iOS pending Apple Developer enrollment
- Expert code review identified 8 areas of concern: fat screens, weak typing, duplicate state loading, half-built audio, prototype leakage, weak error handling, inconsistent theme, missing tooling
- Deep codebase audit (2026-03-31) found 5 critical bugs and ~10 secondary issues
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
| Full hardening scope (not just critical 5) | App Store review — need comprehensive reliability | — Pending |
| Fix bugs in existing .js engine files, don't migrate to .ts | Minimize blast radius, stability milestone not refactor | — Pending |
| Add error boundaries at screen level | Catch crashes per-screen, not whole app | — Pending |

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
