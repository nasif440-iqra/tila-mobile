# Roadmap: Tila — Revenue & Growth

## Overview

This milestone takes Tila from a hardened prototype to a revenue-generating App Store product. The work follows three blocks: stabilize the core user flows (lesson completion, audio, subscriptions), build the conversion surfaces that turn free users into paying users (paywall, personalization, value communication), then add the retention infrastructure that prevents churn (cloud sync, accounts, social features, dark mode).

Source: MASTER-PLAN.md (synthesized from two expert reviews + founder input)

## Milestones

- ✅ **v1.0 Stability & App Store Readiness** — Phases 1-5 (shipped 2026-04-01)
- 🚧 **v2.0 Revenue & Growth** — Phases 1-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Stability & App Store Readiness (Phases 1-5) — SHIPPED 2026-04-01</summary>

- [x] Phase 1: Correctness Blockers (3/3 plans) — completed 2026-04-01
- [x] Phase 2: Crash Containment (2/2 plans) — completed 2026-04-01
- [x] Phase 3: Monetization Hardening (2/2 plans) — completed 2026-04-01
- [x] Phase 4: Type & Test Cleanup (2/2 plans) — completed 2026-04-01
- [x] Phase 5: Launch Ops Checklist (3/3 plans) — completed 2026-04-01

</details>

### 🚧 v2.0 Revenue & Growth

- [ ] **Phase 1: Lesson Flow Hardening** — Fix atomic completion + mastery celebration stale state
- [ ] **Phase 2: Repo Cleanup & Design Consistency** — Remove scaffold, replace crescent emoji, guard remaining audio/RevenueCat calls
- [x] **Phase 3: Onboarding & Personalization** — Name input, wird explanation, personalized home screen (completed 2026-04-01)
- [x] **Phase 4: Value Communication** — Surface mastery engine, weave insights into lessons 1-7 (completed 2026-04-02)
- [ ] **Phase 5: Conversion Surfaces** — Redesign upgrade cards, complete paywall flow with scholarship program
- [ ] **Phase 6: App Store Submission** — Screenshots, metadata, privacy manifest, support contact, production build, submission
- [ ] **Phase 7: Engine TypeScript Migration** — Convert 18 .js files to .ts with proper type annotations
- [ ] **Phase 8: Cloud Sync & Social** — Shared state layer, user accounts, cloud sync, history, friend features, dark mode, integration tests

## Phase Details

### Phase 1: Lesson Flow Hardening
**Goal**: Lesson completion is atomic and mastery celebrations always display correctly
**Depends on**: Nothing (first phase)
**Requirements**: STAB-01, STAB-02
**Plans:** 1 plan
Plans:
- [x] 01-01-PLAN.md — Atomic completion transaction + fresh mastery celebration detection
**Success Criteria** (what must be TRUE):
  1. `completeLesson` wraps all DB writes in a single `withExclusiveTransactionAsync` call
  2. The completion transaction returns fresh mastery state that the UI uses directly for celebration display
  3. A simulated crash during completion leaves DB in a consistent pre-completion state (no partial writes)

### Phase 2: Repo Cleanup & Design Consistency
**Goal**: Remove all scaffold leftovers, guard remaining unsafe calls, achieve design consistency
**Depends on**: Nothing (independent of Phase 1)
**Requirements**: STAB-03, STAB-04, STAB-05, STAB-06
**Plans:** 2 plans
Plans:
- [x] 02-01-PLAN.md — Scaffold cleanup + RevenueCat init guard (STAB-03, STAB-04 pre-satisfied, STAB-05)
- [x] 02-02-PLAN.md — CrescentIcon SVG component + emoji replacement (STAB-06)
**Success Criteria** (what must be TRUE):
  1. SpaceMono-Regular.ttf, EditScreenInfo.tsx, useClientOnlyValue.ts, and constants/Colors.ts are deleted with no broken imports
  2. RevenueCat `Purchases.configure()` is wrapped in try/catch with free-tier fallback and Sentry logging
  3. All `player.play()` and `player.replace()` calls are wrapped in try/catch with Sentry reporting
  4. No unicode emoji (☽) appears in any component — replaced with SVG icon matching TilaLogoMark style

### Phase 3: Onboarding & Personalization
**Goal**: Users feel personally known — the app uses their name and understands their motivation
**Depends on**: Phase 1 or 2 (either)
**Requirements**: CONV-01, CONV-02, CONV-04
**Plans:** 2/2 plans complete
Plans:
- [x] 03-01-PLAN.md — Data layer + NameMotivation onboarding step (CONV-01)
- [x] 03-02-PLAN.md — Personalized home greeting + wird tooltip (CONV-02, CONV-04)
**Success Criteria** (what must be TRUE):
  1. Onboarding flow includes an optional name input step that stores the name in user profile
  2. First wird/streak badge appearance shows a one-time explanation of the wird concept
  3. Home screen greeting uses user name and motivation (falls back to generic if no name provided)

### Phase 4: Value Communication
**Goal**: Users understand what makes Tila worth paying for before hitting the paywall
**Depends on**: Phase 3
**Requirements**: CONV-03, CONV-05
**Plans:** 2/2 plans complete
Plans:
- [x] 04-01-PLAN.md — Engine insights module: post-lesson insight generation, review grouping, confusion pair parsing (CONV-03, CONV-05)
- [x] 04-02-PLAN.md — UI integration: LessonInsights card, ConfusionPairs + ReviewSchedule progress sections (CONV-03, CONV-05)
**Success Criteria** (what must be TRUE):
  1. Post-lesson insights appear during lessons 1-7 showing mastery engine intelligence (confusion detection, review scheduling)
  2. Progress screen shows mastery data: confused letter pairs, accuracy trends, upcoming review schedule
  3. Free-tier SRS reviews are functional and visible (verified: usePremiumReviewRights includes lessons ≤ FREE_LESSON_CUTOFF)

### Phase 5: Conversion Surfaces
**Goal**: Upgrade cards and paywall flow match the app's premium design quality and drive conversion
**Depends on**: Phase 4 (value communication must exist before paywall is polished)
**Requirements**: CONV-06, CONV-07
**Success Criteria** (what must be TRUE):
  1. Upgrade card, trial badge, and expired card use the design system (tokens, fonts, colors, shadows) — visually match onboarding quality
  2. Paywall triggers after completing lesson 7 and when free user taps lesson 8+
  3. Annual plan ($49.99/yr) is preselected and visually primary; monthly ($8.99/mo) is secondary
  4. Scholarship option is prominently displayed with clear language and links to request form
  5. Post-expiry: users can still review premium letters learned during trial/subscription

### Phase 6: App Store Submission
**Goal**: App is submitted to both App Store and Google Play with all required assets and metadata
**Depends on**: Phase 5 + RevenueCat/App Store Connect subscription config resolved
**Requirements**: CONV-08, CONV-09
**Success Criteria** (what must be TRUE):
  1. Screenshots captured for required sizes (6.7" + 5.5" iOS, Play Store feature graphic)
  2. App Store metadata complete (title, subtitle, description, keywords, category, age rating)
  3. Privacy manifest declares PostHog analytics + Sentry crash reporting data collection
  4. Support contact (email/link) visible in app settings
  5. Production EAS build installs and completes full lesson flow on real device
  6. App submitted to Apple App Store and Google Play Store

### Phase 7: Engine TypeScript Migration
**Goal**: All engine files are typed, eliminating `any` leakage from the core learning algorithm
**Depends on**: Phase 2 (clean repo first)
**Requirements**: RET-01
**Success Criteria** (what must be TRUE):
  1. All 18 .js files in src/engine/ converted to .ts with explicit type annotations
  2. `npm run typecheck` passes with zero errors
  3. No `any` type in any engine file's exported function signatures
  4. All existing tests still pass after migration

### Phase 8: Cloud Sync & Social
**Goal**: Users have accounts, progress syncs to cloud, friends can see each other's progress, dark mode works
**Depends on**: Phase 7 (typed engine) + Phase 6 (app in store)
**Requirements**: RET-02, RET-03, RET-04, RET-05, RET-06, RET-07, RET-08, RET-09, RET-10
**Success Criteria** (what must be TRUE):
  1. Shared state provider exists — screens subscribe to canonical progress/habit/subscription state
  2. User can create account (email or social auth) and sign in across devices
  3. Anonymous users can upgrade to authenticated without losing local progress
  4. Progress syncs to cloud when connected; app works identically offline
  5. Users can add friends and see their streaks and phase milestones
  6. Privacy manifest updated for auth + cloud sync data collection
  7. Return welcome screen adapts to absence length (1 day / 3-7 days / 14+ days)
  8. Integration tests cover: onboarding, lesson completion, premium locking, restore purchases
  9. Dark mode activates from existing tokens with system preference detection
**Note**: This is the largest phase. Needs its own detailed design/planning session before execution. State layer and cloud sync must be designed as one architectural unit.

## Execution Order

Phases 1 and 2 are independent — can run in parallel.
Phase 3 requires either Phase 1 or Phase 2 complete.
Phases 3 → 4 → 5 → 6 are sequential (each builds on the previous).
Phase 7 can start after Phase 2 (independent of conversion work).
Phase 8 starts after Phase 7 and Phase 6 are both complete.

```
Phase 1 (lesson flow) ──┐
                         ├──→ Phase 3 → Phase 4 → Phase 5 → Phase 6 ──┐
Phase 2 (cleanup) ───────┘                                              ├──→ Phase 8 (cloud sync)
                         └──→ Phase 7 (TS migration) ──────────────────┘
```

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Lesson Flow Hardening | 0/1 | Not started | - |
| 2. Repo Cleanup & Design Consistency | 0/2 | Planned | - |
| 3. Onboarding & Personalization | 2/2 | Complete   | 2026-04-01 |
| 4. Value Communication | 2/2 | Complete   | 2026-04-02 |
| 5. Conversion Surfaces | 0/TBD | Not started | - |
| 6. App Store Submission | 0/TBD | Not started | - |
| 7. Engine TypeScript Migration | 0/TBD | Not started | - |
| 8. Cloud Sync & Social | 0/TBD | Not started | - |
