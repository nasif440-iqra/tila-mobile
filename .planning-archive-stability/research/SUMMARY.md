# Project Research Summary

**Project:** Tila — Hardening for App Store Submission
**Domain:** React Native / Expo mobile app production hardening
**Researched:** 2026-03-31
**Confidence:** HIGH

## Executive Summary

Tila is a production-ready learning app that needs targeted hardening before App Store submission — not a rewrite. The research confirms the existing architecture (SQLite + hooks + pure-JS engine) is sound and should not be touched. What is missing is a defensive shell: error boundaries, promise rejection handling, DB initialization recovery, and fixes for a handful of known bugs that will trigger reviewer rejection. The entire hardening effort requires adding only 2 new packages (`react-error-boundary`, `@vitest/coverage-v8`) and fixing patterns in existing code.

The biggest risk is not technical complexity — it is the number of independent failure modes that are currently unhandled. Any one of them (DB hang on launch, RevenueCat crash when unconfigured, missing restore-purchases button, no privacy policy) is sufficient for Apple to reject. The research identified 6 critical pitfalls and 9 moderate ones. The critical ones must all be resolved before submission; they cannot be triaged or deferred.

The recommended approach is bottom-up through the stack: fix DB initialization first (the foundation everything else sits on), then close the known bugs in the quiz/streak/routing layer, then add the error boundary containment shell, then harden monetization and data safety, then close the quality gate with types and tests, and finally prepare App Store assets as the last gate before submission. This order ensures each phase builds on a stable foundation and avoids rework.

## Key Findings

### Recommended Stack

The stack is locked. This milestone is additive-only: no library swaps, no ORM, no state management framework, no E2E test infrastructure. Research strongly validates the current architecture and recommends against any changes that increase blast radius.

Two packages are warranted: `react-error-boundary` (v6.1.1, Brian Vaughn / React team, React 19 compatible) for per-screen error containment, and `@vitest/coverage-v8` (matching the existing Vitest 4.1.2) for coverage reports. Everything else — DB migration safety, audio error handling, RevenueCat offline fallback, type improvements — is pattern fixes in existing code.

**Core technologies:**
- `react-error-boundary` v6.1.1: per-screen crash containment — de-facto community standard, works with React 19, hook API included
- `@vitest/coverage-v8`: coverage reporting — matches existing Vitest version, V8 provider faster than Istanbul, zero config beyond adding the package
- `expo-sqlite` (existing): migration safety via transaction wrapping + PRAGMA table_info checks — no ORM needed, pattern fix only
- `expo-audio` (existing): audio reliability via try/catch wrappers — silent failure is correct strategy, never surface audio errors to user
- `react-native-purchases` 9.15.0 (existing): RevenueCat offline handling via built-in SDK cache + init guard pattern

### Expected Features

All table-stakes features are non-negotiable for App Store submission. Missing any one of them risks rejection.

**Must have (table stakes — submission blockers):**
- Error boundaries at screen level — unhandled render errors currently take down the entire app
- Database initialization error handling — current code can hang forever on DB failure, no recovery path
- Graceful audio failure handling — unhandled promise rejections from expo-audio cause production crashes
- Silent migration error handling — current bare `catch {}` can corrupt DB state without Sentry ever knowing
- Quiz hook state reset between lessons — known bug where questions from lesson A leak into lesson B
- Streak counter race condition fix — rapid taps corrupt wird streak data
- Midnight boundary routing fix — session spanning midnight creates navigation loop
- RevenueCat graceful degradation — SDK failure must default to free tier, not crash
- Restore Purchases button accessible outside paywall — Apple Guideline 3.1.1, required independent of paywall flow
- Privacy policy URL — required in App Store Connect and in-app; Tila collects PostHog + Sentry data
- App Store metadata completeness — screenshots, description, 1024x1024 icon from actual production build
- Crash-free launch sequence — font loading to splash to DB init timing must be bulletproof

**Should have (differentiators — submission quality):**
- EAS Update (OTA updates) — post-launch hotfix capability; critical for fixing production bugs without re-review
- CI/CD pipeline (GitHub Actions) — prevents regressions from shipping; currently all quality checks are manual
- Test coverage for critical paths — validates bug fixes, engine and hooks focus (skip component rendering tests)
- Type-safe quiz pipeline — eliminates 30+ `any` types that mask runtime errors in question generation
- Database transaction batching for quiz saves — atomic commit prevents partial saves if app is killed mid-quiz
- Structured Sentry breadcrumbs — attach lesson ID and progress state to crash reports for faster debugging

**Defer (post-launch):**
- CI/CD pipeline — set up immediately after launch for update workflow
- EAS Update OTA setup — critical for post-launch but does not block initial submission
- Full TypeScript migration of engine `.js` files — 3300 lines of working code; migration risk outweighs benefit now
- Dark mode activation — tokens exist but doubles QA surface for zero submission benefit
- E2E testing (Detox/Maestro) — high setup cost; targeted Vitest tests give 80% of the value
- Accessibility improvements — valuable for the community but not a submission requirement
- App Tracking Transparency (ATT) prompt — PostHog uses first-party analytics only; declare "No tracking" instead

### Architecture Approach

The hardening architecture works with the existing layered structure, not against it. The current root-level `Sentry.ErrorBoundary` in `_layout.tsx` is the correct last-resort fallback — the gap is that it is the only error boundary. Screen-level boundaries need to be added so a crash in one lesson does not take down the entire navigator. The build sequence is bottom-up: fix the foundation (DB, bugs, promise rejections) before adding the containment layer (error boundaries, RevenueCat guard), then close with data safety and quality tooling.

**Major components and their hardening responsibility:**
1. `DatabaseProvider` — add 10-second timeout, error state with retry button, splash screen hold until DB is ready
2. `react-error-boundary` (new) — per-screen boundaries on home, lesson, progress, and onboarding; each reports to Sentry with screen tag and offers "Go Home"
3. `src/audio/player.ts` — wrap every `play()` and `replace()` call in try/catch; audio failure must never propagate
4. `src/monetization/` — `isRevenueCatInitialized()` init guard; gate all `Purchases.*` calls; default to free tier on any failure; add standalone restore button
5. `src/db/client.ts` — transaction-wrap all migrations; replace bare `catch {}` with PRAGMA table_info pattern; log real errors to Sentry
6. `src/hooks/` — add `error` field to all hook return types; add explicit return type interfaces to eliminate `any` leakage
7. `src/engine/` — input validation at function entry points; return safe defaults instead of throwing on bad input

### Critical Pitfalls

1. **Database initialization hangs with no recovery path** — add 10-second timeout and `.catch()` in `DatabaseProvider`, show error screen with retry; current code can hang forever causing Apple Guideline 2.1 rejection
2. **Missing standalone Restore Purchases button** — `Purchases.restorePurchases()` must be accessible outside the paywall, not only inside it; Apple Guideline 3.1.1 is a guaranteed rejection reason
3. **No privacy policy** — zero references to privacy policy anywhere in the codebase; required in App Store Connect AND linkable from within the app; must cover PostHog, Sentry, and RevenueCat data
4. **Unhandled promise rejections crash production builds** — `initRevenueCat()` in `_layout.tsx` has no `.catch()`; audio `play()` calls discard promises; production Hermes treats these as crashes
5. **RevenueCat SDK crashes when unconfigured** — `SubscriptionProvider` calls `Purchases.getCustomerInfo()` even when SDK was never initialized; guard every `Purchases.*` call behind an `isRevenueCatInitialized()` check

## Implications for Roadmap

Based on combined research, the work falls into 4 natural phases with clear dependency ordering.

### Phase 1: Critical Bug Fixes and Promise Audit
**Rationale:** These are crashes and data corruption bugs that will surface during Apple review. They must be fixed first because they affect the core quiz flow (the primary experience a reviewer sees) and because later phases build on a stable app.
**Delivers:** An app that does not crash during a standard reviewer walkthrough; clean Sentry with no unhandled rejections
**Addresses:** DB init hang, quiz hook state leak, streak race condition, midnight routing loop, migration silent errors, audio promise rejections, RevenueCat init crash
**Avoids:** Pitfalls 1, 4, 6, 7, 8, 9, 14 (the ones that cause hard crashes or data corruption)

### Phase 2: Error Containment and Monetization Safety
**Rationale:** Once known bugs are patched, add the defensive shell so unknown future bugs are contained. Monetization hardening belongs here because it sits at a critical user-facing junction (premium lesson gates) and must be bulletproof before the app is in review.
**Delivers:** Per-screen error boundaries with recovery UI; RevenueCat init guard; standalone Restore Purchases button; transaction-batched quiz saves
**Uses:** `react-error-boundary` (new package), existing RevenueCat SDK
**Implements:** Screen-level error boundary architecture, SubscriptionProvider init guard pattern, audio session configuration
**Avoids:** Pitfalls 2, 6, 10, 12 (restore purchases, SDK crash, root-only boundary, audio session conflicts)

### Phase 3: Quality Gate — Types and Tests
**Rationale:** Before committing to a production build, close the type safety and test coverage gaps. Type safety catches regressions introduced during this phase's own work. Tests validate the Phase 1 bug fixes and provide confidence they stay fixed.
**Delivers:** Hook return type interfaces (no critical `any`), Vitest tests for all Phase 1 fixes, coverage reporting with thresholds, Sentry breadcrumbs for lesson flow
**Uses:** `@vitest/coverage-v8` (new package), TypeScript 5.9 `satisfies` operator, existing Sentry SDK
**Avoids:** Pitfall 13 (`any` types masking runtime errors), regression risk from future changes

### Phase 4: App Store Submission Prep
**Rationale:** Non-code work that must be done last because it depends on the app being in its final state. Screenshots from a build that still has bugs are wasted effort.
**Delivers:** Privacy policy (hosted URL plus in-app link), App Store Connect metadata, production screenshots from real device, iPad compatibility verification, touch target audit (44x44pt minimum), EAS production build and TestFlight upload
**Avoids:** Pitfalls 3, 5, 11, 15 (privacy policy, iCloud backup, metadata mismatch, ATT declaration)

### Phase Ordering Rationale

- Phase 1 before Phase 2: Error boundaries containing unfixed bugs give false confidence. Fix the known bugs first, then contain residual unknowns.
- Phase 2 before Phase 3: Type annotations and tests should reflect the final corrected architecture, not interim broken states.
- Phase 3 before Phase 4: Screenshots and metadata should come from a build that passes all quality checks.
- Monetization hardening (restore button, RevenueCat guard) is in Phase 2 rather than Phase 4 because it is a code change that could introduce its own bugs — it needs the Phase 3 test safety net to validate it.

### Research Flags

Phases with standard patterns — no additional research needed:
- **Phase 1 (critical bugs):** All 5 specific bugs are understood from codebase audit. Fixes are straightforward.
- **Phase 2 (error boundaries):** `react-error-boundary` docs are comprehensive. Architecture patterns are documented in ARCHITECTURE.md.
- **Phase 3 (types + tests):** Standard TypeScript and Vitest patterns throughout.
- **Phase 4 (App Store prep):** Requirements are documented in PITFALLS.md and FEATURES.md. Content work (privacy policy, screenshots) is non-technical.

Brief investigations needed during implementation (not full research phases):
- **Phase 2:** Verify `withExclusiveTransactionAsync` API availability in expo-sqlite 55 before implementing migration transactions
- **Phase 3:** Determine test mocking strategy for expo-sqlite in Vitest; measure current coverage baseline before setting thresholds
- **Phase 4:** Confirm PostHog React Native SDK v4.39.0 IDFA collection config to finalize the ATT declaration decision

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations reference official Expo/React Native docs; only 2 new packages needed; existing stack analysis from direct codebase inspection |
| Features | HIGH | Table-stakes list derives from Apple's published guidelines (Guideline 2.1, 3.1.1, 5.1.1) confirmed by RevenueCat rejection docs; known bugs confirmed via codebase audit |
| Architecture | HIGH | Patterns sourced from official Expo and React docs; hardening architecture is additive to existing layered structure with no conflicts |
| Pitfalls | HIGH | Critical pitfalls confirmed against Apple's actual review guidelines and verified against specific files in the codebase (`src/db/provider.tsx`, `app/_layout.tsx`, `src/monetization/`) |

**Overall confidence:** HIGH

### Gaps to Address

- **Privacy policy content:** Needs to be written (not a code gap, but a legal/content gap). Must accurately describe PostHog, Sentry, and RevenueCat data collection. Requires a hosting URL before submission.
- **ATT decision:** Needs confirmation of whether PostHog React Native SDK collects IDFA or advertising identifiers. If yes, ATT prompt must be added. If no, App Store Connect privacy questionnaire must declare "no tracking." Check PostHog initialization config.
- **iCloud backup (Pitfall 5):** Low-risk given DB size, but monitor during TestFlight. If Apple flags it, set `isExcludedFromBackup` on the SQLite file — but this trades off user data safety (progress lost on device restore).
- **iPad compatibility:** Needs a physical iPad simulator run after all UI bug fixes are applied. The known Expo bug (issue #32344, `supportsTablet: false` sometimes ignored) means this cannot be assumed safe without testing.
- **expo-sqlite transaction API:** `withExclusiveTransactionAsync` availability in expo-sqlite 55 should be verified against official docs before implementing the migration transaction pattern.
- **Test mocking strategy:** How to mock expo-sqlite in Vitest for hook testing. May need a lightweight in-memory SQLite or mock provider. Measure current coverage baseline before setting thresholds.

## Sources

### Primary (HIGH confidence)
- [App Store Review Guidelines (2025)](https://nextnative.dev/blog/app-store-review-guidelines) — rejection reasons, Guidelines 2.1, 3.1.1, 5.1.1
- [Apple App Store Rejection Reasons 2025](https://twinr.dev/blogs/apple-app-store-rejection-reasons-2025/) — crash patterns, metadata requirements
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) — `withExclusiveTransactionAsync`, migration patterns
- [react-error-boundary npm](https://www.npmjs.com/package/react-error-boundary) — v6.1.1, React 19 compatibility
- [RevenueCat React Native Docs](https://www.revenuecat.com/docs/getting-started/installation/reactnative) — offline caching, restore purchases requirement
- [Expo Router Error Handling](https://docs.expo.dev/router/error-handling/) — screen-level boundary placement
- [Expo App Store Best Practices](https://docs.expo.dev/distribution/app-stores/) — metadata, privacy, iPad

### Secondary (MEDIUM confidence)
- [React Native Error Boundaries — Advanced Techniques](https://www.reactnative.university/blog/react-native-error-boundaries) — layered boundary strategy
- [Stop React Native Crashes: Production-Ready Error Handling](https://dzone.com/articles/react-native-error-handling-guide) — three-layer architecture
- [Expo OTA Update Best Practices](https://expo.dev/blog/5-ota-update-best-practices-every-mobile-team-should-know) — post-launch update strategy
- [RevenueCat: App Store Rejections](https://www.revenuecat.com/docs/test-and-launch/app-store-rejections) — subscription-specific rejection guidance

### Tertiary (internal — direct codebase evidence)
- `.planning-archive-ui-overhaul/codebase/CONCERNS.md` — deep codebase audit, 5 critical bugs identified
- Direct file audit: `src/db/client.ts`, `src/db/provider.tsx`, `src/hooks/useLessonQuiz.ts`, `src/monetization/revenuecat.ts`, `src/monetization/provider.tsx`, `app/_layout.tsx`

---
*Research completed: 2026-03-31*
*Ready for roadmap: yes*
