# Requirements: Tila — Revenue & Growth

**Defined:** 2026-04-01
**Core Value:** A personal, trustworthy Quran reading teacher that remembers what you forget and never loses your progress
**Source:** MASTER-PLAN.md (synthesized from two expert reviews + founder input)

## v2 Requirements

### Block 1: Make It Not Crash

- [x] **STAB-01**: Lesson completion writes are atomic — wrapped in a single DB transaction that returns fresh post-write state
- [x] **STAB-02**: Mastery celebration uses fresh data from the completion transaction, not a stale hook closure
- [x] **STAB-03**: RevenueCat initialization wrapped in try/catch — defaults to free tier on failure, logs to Sentry
- [x] **STAB-04**: All audio calls (playSFX, playVoice) wrapped in try/catch — failures reported to Sentry, never crash the app
- [x] **STAB-05**: Expo scaffold leftovers removed (SpaceMono-Regular.ttf, EditScreenInfo.tsx, useClientOnlyValue.ts, constants/Colors.ts)
- [x] **STAB-06**: Crescent emoji (☽) replaced with SVG icon matching TilaLogoMark style in ReviewCard and ReturnWelcomeScreen

### Block 2: Make It Convert

- [x] **CONV-01**: Optional name input added to onboarding flow, stored in user profile
- [x] **CONV-02**: Wird concept explained on first encounter via one-time tooltip/explanation
- [x] **CONV-03**: Value communication woven into lessons 1–7 (mastery insights shown after lessons)
- [x] **CONV-04**: Home screen greeting personalized with user name and motivation
- [x] **CONV-05**: Mastery engine insights visible to users (confusion tracking, accuracy trends, review scheduling)
- [x] **CONV-06**: Upgrade/upsell cards redesigned to match design system (premium feel matching onboarding quality)
- [x] **CONV-07**: Complete paywall flow — lesson 7 trigger, annual-first pricing, scholarship program, post-expiry review access
- [ ] **CONV-08**: App Store submission complete — screenshots, metadata, privacy manifest, review notes, production build on device
- [ ] **CONV-09**: Support contact visible in app settings (required for early adopter data-loss mitigation)

### Block 3: Make It Retain

- [ ] **RET-01**: All 18 engine .js files migrated to TypeScript with proper type annotations
- [ ] **RET-02**: Shared state layer for progress, habit, and subscription — screens subscribe to canonical state, designed to anticipate cloud sync
- [x] **RET-03**: Cloud sync with user accounts (email/social auth), anonymous-to-authenticated upgrade path
- [ ] **RET-04**: Learning history synced to cloud (completion, accuracy trends over time)
- [ ] **RET-05**: Social features — friend connections, streaks, phase milestones (supportive tone, not competitive)
- [ ] **RET-06**: Offline-first guarantee maintained — local SQLite source of truth, cloud syncs when connected
- [ ] **RET-07**: Privacy manifest updated for auth + cloud sync data collection
- [ ] **RET-08**: Adaptive return welcome screen based on absence length (1 day vs 7 days vs 14+ days)
- [x] **RET-09**: High-value integration tests for critical flows (onboarding, lesson completion, premium locking, restore purchases)
- [ ] **RET-10**: Dark mode activated using existing tokens, system preference detection

## Deferred

- **DEFER-01**: E2E testing (Detox/Maestro) — separate milestone
- **DEFER-02**: Push notifications — after cloud sync + accounts
- **DEFER-03**: CI/CD pipeline (GitHub Actions) — not blocking submission
- **DEFER-04**: Internationalization
- **DEFER-05**: iPad / tablet layout

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STAB-01 | Phase 1 | Not started |
| STAB-02 | Phase 1 | Not started |
| STAB-03 | Phase 2 | Not started |
| STAB-04 | Phase 2 | Not started |
| STAB-05 | Phase 2 | Not started |
| STAB-06 | Phase 2 | Not started |
| CONV-01 | Phase 3 | Not started |
| CONV-02 | Phase 3 | Not started |
| CONV-03 | Phase 4 | Not started |
| CONV-04 | Phase 3 | Not started |
| CONV-05 | Phase 4 | Not started |
| CONV-06 | Phase 5 | Not started |
| CONV-07 | Phase 5 | Not started |
| CONV-08 | Phase 6 | Not started |
| CONV-09 | Phase 6 | Not started |
| RET-01 | Phase 7 | Not started |
| RET-02 | Phase 8 | Not started |
| RET-03 | Phase 8 | Not started |
| RET-04 | Phase 8 | Not started |
| RET-05 | Phase 8 | Not started |
| RET-06 | Phase 8 | Not started |
| RET-07 | Phase 8 | Not started |
| RET-08 | Phase 8 | Not started |
| RET-09 | Phase 8 | Not started |
| RET-10 | Phase 8 | Not started |

**Coverage:**
- v2 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-01*
*Source: MASTER-PLAN.md*
