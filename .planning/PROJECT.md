# Tila — From Working App to Revenue

## What This Is

Tila is a mobile app that teaches converts and new Muslims to read the Quran, starting from the Arabic alphabet. Built with Expo 55 / React Native 0.83, it uses mastery-based learning with spaced repetition, offline-first SQLite storage, and a freemium model (RevenueCat). The v1.0 stability milestone is complete. The next milestone takes Tila from a hardened prototype to a revenue-generating product in the App Store with accounts, cloud sync, and social features.

## Core Value

A personal, trustworthy Quran reading teacher that remembers what you forget and never loses your progress.

## Requirements

### Validated

- ✓ Mastery-based learning system with SRS — existing
- ✓ 28 Arabic letter curriculum across 4 phases (106 lessons) — existing
- ✓ Offline-first SQLite storage — existing
- ✓ UI overhaul (design system, transitions, celebrations) — UI milestone
- ✓ RevenueCat monetization integration — existing
- ✓ PostHog analytics + Sentry crash reporting — v1.0
- ✓ Onboarding flow with wird streak tracking — existing
- ✓ DB init timeout + recovery UI — v1.0
- ✓ Audio and async calls fully guarded with try/catch — v1.0
- ✓ Screen-level error boundaries with recovery — v1.0
- ✓ Offline entitlements + restore purchases surface — v1.0
- ✓ Critical `any` type removal in hook interfaces — v1.0
- ✓ Regression test suite + coverage baseline — v1.0
- ✓ Privacy policy, App Store metadata, iPad QA — v1.0

### Active

See MASTER-PLAN.md for full scope. Next milestone covers:
- [x] Lesson completion atomicity (transaction-wrapped writes) — Phase 1
- [x] Mastery celebration stale state fix — Phase 1
- [x] Scaffold cleanup and design consistency — Phase 2
- [x] Onboarding personalization (name + motivation + wird tooltip) — Phase 3
- [x] Value communication (post-lesson insights, progress tab mastery data) — Phase 4
- [x] Paywall UX, conversion surfaces (upgrade cards, lesson 7 flow, scholarship) — Phase 5
- [ ] App Store submission (screenshots, metadata, privacy manifest)
- [ ] TypeScript migration of engine layer
- [ ] Cloud sync with accounts, history, social features
- [ ] Shared state layer designed for sync
- [ ] Dark mode activation

### Out of Scope

- E2E testing (Detox/Maestro) — separate milestone
- Push notifications — after cloud sync + accounts
- CI/CD pipeline — valuable but not blocking submission
- Internationalization — future consideration
- iPad / tablet layout — future consideration
- Web app — React/Vite webapp being sunset, mobile-only
- Content expansion — 106 lessons exist, this is infrastructure work

## Context

Shipped v1.0 Stability & App Store Readiness (5 phases, 12 plans, 19 requirements).
- App is crash-resilient: error boundaries, audio guards, DB timeout recovery
- Monetization layer hardened: offline entitlements, restore purchases, failure analytics
- Coverage baseline: 29.66% statements (54 test files)
- Apple Developer Program enrolled, iOS bundle ID: com.tilaapp.tila
- RevenueCat App Store Connect subscription config has unresolved issues (founder workstream)
- Two expert reviews received (April 2026) — synthesized into MASTER-PLAN.md

## Constraints

- **Stack**: Expo SDK 55, React Native 0.83, New Architecture — no framework changes
- **No learning algorithm changes**: Engine algorithms stay the same
- **Offline-first**: All features must work without network. Cloud sync is additive, not a replacement for local-first
- **Performance**: No regressions on mid-range Android (60fps animations must hold)
- **Backwards compatible**: Existing user data (SQLite) must not be corrupted

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Narrow v1.0 scope to repo-backed items only | Proposal review scored 6/10 — dropped stale/overstated items | ✓ Good |
| Fix bugs in existing .js engine files, don't migrate to .ts | Minimize blast radius for stability milestone | ✓ Good — deferred to v2.0 |
| Selective screen boundaries, not blanket wrapping | Root Sentry boundary already exists — add only where expensive async/monetization lives | ✓ Good |
| Paywall at lesson 7 (Ba/Ta/Tha family summary) | Real milestone for converts. Free tier includes SRS review on free letters forever | ✓ Confirmed |
| Cloud sync required, not optional | Progress loss on reinstall is catastrophic for a learning app. Includes accounts + social | ✓ Confirmed |
| State layer + cloud sync planned together | Designing state layer without anticipating sync means designing it twice | ✓ Confirmed |
| $8.99/mo + $49.99/yr, annual-first | Trial-led education apps convert 15-25%. No lifetime at launch | ✓ Confirmed |
| Supabase for backend (likely) | Auth, Postgres, realtime, row-level security out of the box | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-04-01 after Phase 2 (Repo Cleanup & Design Consistency) completion*
