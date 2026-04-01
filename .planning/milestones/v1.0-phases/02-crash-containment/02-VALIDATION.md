---
phase: 02
slug: crash-containment
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-01
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/audio-safety.test.ts src/__tests__/promise-safety.test.ts src/__tests__/screen-boundary.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command (3 test files)
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | CONT-01 | unit+source | `npx vitest run src/__tests__/audio-safety.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | CONT-02 | source | `npx vitest run src/__tests__/promise-safety.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | CONT-03 | source | `npx vitest run src/__tests__/screen-boundary.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | CONT-03 | behavioral | `npx vitest run src/__tests__/screen-boundary.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/audio-safety.test.ts` — verify try/catch wraps playVoice and playSFX, _playing not set on failure
- [ ] `src/__tests__/promise-safety.test.ts` — verify no bare .then(setState) in home/review, guarded async pattern present
- [ ] `src/__tests__/screen-boundary.test.ts` — verify ErrorBoundary wraps lesson+home, Sentry.captureException in onError, behavioral render test for fallback

*All three are Wave 0 — created by plan tasks alongside the fixes.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Go Home" navigates to home tab | CONT-03 | Navigation requires running app | Trigger error in lesson screen, tap "Go Home", verify home tab loads |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-01
