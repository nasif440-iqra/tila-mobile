# Roadmap: Tila — Stability & App Store Readiness

## Overview

This milestone hardens Tila for App Store submission. The work moves bottom-up through the stack: fix known correctness bugs first (the crashes Apple reviewers will hit), then add a defensive containment shell for unknown failures, then harden the monetization flow that gates revenue, then close quality gaps and prepare submission assets. Phases 4 and 5 run in parallel since type/test cleanup and launch ops have no dependencies on each other.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Correctness Blockers** - Fix the 5 known bugs that crash or corrupt data, with regression tests
- [ ] **Phase 2: Crash Containment** - Add defensive shell so unknown failures are caught, not fatal
- [x] **Phase 3: Monetization Hardening** - Make subscription flow bulletproof for offline and edge cases (completed 2026-04-01)
- [ ] **Phase 4: Type & Test Cleanup** - Remove critical `any` types, add regression tests, establish coverage baseline
- [ ] **Phase 5: Launch Ops Checklist** - Privacy policy, App Store metadata, iPad QA, production build

## Phase Details

### Phase 1: Correctness Blockers
**Goal**: The app completes a full lesson flow without crashing, hanging, or corrupting data
**Depends on**: Nothing (first phase)
**Requirements**: CRIT-01, CRIT-02, CRIT-03, CRIT-04, CRIT-05, CRIT-06
**Success Criteria** (what must be TRUE):
  1. App launches to home screen within 15 seconds even when SQLite initialization fails, showing a retry option instead of hanging
  2. User can complete lesson 1 then immediately start lesson 2 without seeing questions from lesson 1
  3. User can rapidly tap the streak/practice button multiple times without the streak count becoming incorrect
  4. User who has the app open at 11:59 PM and continues using it past midnight does not get stuck in a navigation loop
  5. Each correctness fix has at least one regression test that fails without the fix and passes with it
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — DB init state machine + migration v2 fix (CRIT-01, CRIT-05, CRIT-06)
- [ ] 01-02-PLAN.md — Quiz state reset + midnight reroute fix (CRIT-02, CRIT-04, CRIT-06)
- [x] 01-03-PLAN.md — Habit race condition fix (CRIT-03, CRIT-06)

### Phase 2: Crash Containment
**Goal**: Unknown runtime failures are caught and contained per-screen instead of taking down the entire app
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):
  1. Audio playback failure (e.g., missing file, interrupted session) does not crash the app or show an error to the user
  2. A thrown error in the lesson screen shows a recovery UI ("Go Home" button) instead of a white screen or app crash
  3. No unhandled promise rejections appear in Sentry from fire-and-forget async calls (RevenueCat init, audio play, analytics)
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Audio try/catch wrappers + unhandled promise audit (CONT-01, CONT-02)
- [ ] 02-02-PLAN.md — Screen-level error boundaries with ScreenErrorFallback (CONT-03)

### Phase 3: Monetization Hardening
**Goal**: Subscription and purchase flows work correctly offline and surface restore/failure states clearly
**Depends on**: Phase 2
**Requirements**: MON-01, MON-02, MON-03
**Success Criteria** (what must be TRUE):
  1. User in airplane mode with an active subscription can still access premium lessons (cached entitlement honored)
  2. User can find and tap "Restore Purchases" from settings or account area without needing to hit the paywall first
  3. Failed purchase or restore attempt fires an analytics event and shows the user a clear error message (not silent failure)
**Plans**: TBD

Plans:
- [x] 03-01: TBD

### Phase 4: Type & Test Cleanup
**Goal**: Critical type holes are closed and regression tests validate all prior fixes
**Depends on**: Phase 3
**Requirements**: QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. `npm run typecheck` passes with no `any` types in the return interfaces of useLessonQuiz, useProgress, or useMastery hooks
  2. `npm test` runs a regression suite covering DB init, migration handling, streak logic, quiz transitions, and monetization edge cases — all green
  3. `npm test -- --coverage` produces a coverage report with a recorded baseline percentage
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Remove any types from useLessonQuiz + type JS generator boundary (QUAL-01)
- [x] 04-02-PLAN.md — Verify regression test suite + install coverage tooling with baseline (QUAL-02, QUAL-03)

### Phase 5: Launch Ops Checklist
**Goal**: All non-code App Store submission requirements are met and a production build is verified on device
**Depends on**: Phase 3
**Requirements**: LAUNCH-01, LAUNCH-02, LAUNCH-03, LAUNCH-04
**Success Criteria** (what must be TRUE):
  1. Privacy policy is accessible via a URL from within the app and the URL is ready to paste into App Store Connect
  2. App Store Connect privacy questionnaire answers are documented, reflecting actual PostHog/Sentry/RevenueCat data collection
  3. Running `expo prebuild` and inspecting the generated iOS config confirms `supportsTablet: false` is present (iPad letterbox mode)
  4. A production EAS build installs and launches correctly on a physical device
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — Privacy policy + in-app link + privacy questionnaire (LAUNCH-01, LAUNCH-02)
- [ ] 05-02-PLAN.md — iPad prebuild verification + App Store metadata (LAUNCH-03)
- [ ] 05-03-PLAN.md — Production EAS build + device verification reviewer run (LAUNCH-04)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> then 4 and 5 in parallel.
Phases 4 and 5 have no dependency on each other — both depend on Phase 3.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Correctness Blockers | 1/3 | In progress | - |
| 2. Crash Containment | 1/2 | In progress | - |
| 3. Monetization Hardening | 1/1 | Complete   | 2026-04-01 |
| 4. Type & Test Cleanup | 1/2 | In Progress|  |
| 5. Launch Ops Checklist | 0/3 | Not started | - |
