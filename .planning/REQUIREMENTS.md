# Requirements: Tila — Stability & App Store Readiness

**Defined:** 2026-04-01
**Core Value:** The app must never crash, hang, or lose user progress

## v1 Requirements

### Correctness Blockers

- [x] **CRIT-01**: DB initialization has timeout + recovery UI instead of hanging forever when SQLite fails
- [ ] **CRIT-02**: Quiz hook (useLessonQuiz) correctly resets question generation ref when lesson changes
- [ ] **CRIT-03**: Streak updates (useHabit) are race-condition-proof under rapid repeated recordPractice calls
- [ ] **CRIT-04**: Home screen routing handles midnight date boundary without looping between routes
- [x] **CRIT-05**: Migration error handling distinguishes "column already exists" from real failures (align with later migration patterns)
- [x] **CRIT-06**: Regression tests added for each correctness fix before moving on

### Crash Containment

- [x] **CONT-01**: Audio playback calls wrapped in try/catch — play() failures don't crash the app
- [x] **CONT-02**: Unhandled promise rejection audit — all fire-and-forget async calls have catch paths
- [x] **CONT-03**: Selective screen-level error boundaries on screens with expensive async setup or monetization (not blanket-wrapping everything)

### Monetization Hardening

- [x] **MON-01**: Offline entitlement behavior defined — app handles subscription state when network is unavailable
- [x] **MON-02**: Restore purchases surface clearly reachable outside the paywall flow
- [x] **MON-03**: Restore/purchase failure states instrumented with analytics events

### Type & Test Cleanup

- [x] **QUAL-01**: Critical `any` types removed from lesson/progress/mastery-adjacent hook interfaces (useLessonQuiz, useProgress, useMastery)
- [x] **QUAL-02**: Regression tests for fixed flows: DB init, migration handling, streak logic, quiz transitions, monetization edge cases
- [x] **QUAL-03**: Coverage measurement enabled (@vitest/coverage-v8) with baseline established

### Launch Ops Checklist

- [x] **LAUNCH-01**: Privacy policy URL surfaced in-app and ready for App Store Connect
- [x] **LAUNCH-02**: App Store Connect privacy questionnaire answers prepared based on actual PostHog/Sentry data collection
- [x] **LAUNCH-03**: iPad letterbox QA pass (verify supportsTablet: false persists through expo prebuild)
- [x] **LAUNCH-04**: Production EAS build verified on physical device

## v2 Requirements

### Deferred

- **DEFER-01**: Dark mode activation (tokens exist, not this milestone)
- **DEFER-02**: EAS Update (OTA) for post-launch JS hotfixes
- **DEFER-03**: Full type migration of .js engine files to .ts
- **DEFER-04**: Global error boundary with Sentry user feedback dialog
- **DEFER-05**: Comprehensive coverage gates (>80% threshold enforcement)

## Out of Scope

| Feature | Reason |
|---------|--------|
| New curriculum content | Stability only — no feature additions |
| Cloud sync / backend | Future milestone |
| Push notifications | Future milestone |
| UI redesign | Completed in previous milestone |
| Dark mode | Tokens exist but activation is cosmetic, not stability |
| Full .js → .ts engine migration | Minimize blast radius — fix bugs, don't refactor |
| ATT prompt | PostHog does first-party analytics, likely no IDFA collection — verify and declare "No tracking" |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRIT-01 | Phase 1 | Complete |
| CRIT-02 | Phase 1 | Pending |
| CRIT-03 | Phase 1 | Pending |
| CRIT-04 | Phase 1 | Pending |
| CRIT-05 | Phase 1 | Complete |
| CRIT-06 | Phase 1 | Complete |
| CONT-01 | Phase 2 | Complete |
| CONT-02 | Phase 2 | Complete |
| CONT-03 | Phase 2 | Complete |
| MON-01 | Phase 3 | Complete |
| MON-02 | Phase 3 | Complete |
| MON-03 | Phase 3 | Complete |
| QUAL-01 | Phase 4 | Complete |
| QUAL-02 | Phase 4 | Complete |
| QUAL-03 | Phase 4 | Complete |
| LAUNCH-01 | Phase 5 | Complete |
| LAUNCH-02 | Phase 5 | Complete |
| LAUNCH-03 | Phase 5 | Complete |
| LAUNCH-04 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after initial definition*
