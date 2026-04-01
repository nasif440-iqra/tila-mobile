---
phase: 04
slug: type-test-cleanup
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-01
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run typecheck && npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck` (type changes) or `npm test` (test changes)
- **After every plan wave:** Run `npm run typecheck && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | QUAL-01 | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | QUAL-01 | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 1 | QUAL-02 | unit | `npm test` | ✅ | ⬜ pending |
| 04-02-02 | 02 | 1 | QUAL-03 | coverage | `npm run coverage` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `npm run coverage` script added to package.json (created by plan 04-02 task 2)
- [ ] `@vitest/coverage-v8` installed (created by plan 04-02 task 2)

*Existing test infrastructure covers QUAL-01 and QUAL-02 requirements.*

---

## Manual-Only Verifications

*None — all phase behaviors have automated verification (typecheck + test suite + coverage report).*

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-01
