---
phase: 03
slug: monetization-hardening
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-01
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/monetization-loading.test.ts src/__tests__/paywall-failure.test.ts src/__tests__/restore-purchases.test.ts` |
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
| 03-01-01 | 01 | 1 | MON-01 | source | `npx vitest run src/__tests__/monetization-loading.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | MON-03 | source | `npx vitest run src/__tests__/paywall-failure.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | MON-02 | source | `npx vitest run src/__tests__/restore-purchases.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | MON-02 | source | `npx vitest run src/__tests__/restore-purchases.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/monetization-loading.test.ts` — verify useCanAccessLesson returns true during loading
- [ ] `src/__tests__/paywall-failure.test.ts` — verify ERROR fires purchase_failed, NOT_PRESENTED fires analytics, ERROR shows Alert
- [ ] `src/__tests__/restore-purchases.test.ts` — verify restore button exists, calls restorePurchases, tracks success/failure

*All three are Wave 0 — created by plan tasks alongside the fixes.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Airplane-mode subscription access | MON-01 (D-02) | Requires physical device with Expo build | 1. Build with EAS, 2. Launch online + sync subscription, 3. Enable airplane mode, 4. Relaunch app, 5. Verify premium lessons accessible |
| Restore button discoverable on Progress tab | MON-02 | UX layout verification | Open Progress tab, scroll to bottom, verify "Restore Purchases" button visible |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-01
