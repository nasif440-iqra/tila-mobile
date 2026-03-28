---
phase: 1
slug: design-foundation-transitions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run validate` (lint + typecheck)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | DES-01 | typecheck | `npm run typecheck` | N/A | pending |
| TBD | TBD | TBD | DES-02 | visual | Manual review | N/A | pending |
| TBD | TBD | TBD | DES-03 | unit | `npm test` | pending | pending |
| TBD | TBD | TBD | DES-04 | unit | `npm test` | pending | pending |
| TBD | TBD | TBD | TRANS-01 | visual | Manual review | N/A | pending |
| TBD | TBD | TBD | TRANS-02 | visual | Manual review | N/A | pending |
| TBD | TBD | TBD | TRANS-03 | visual | Manual review | N/A | pending |
| TBD | TBD | TBD | STATE-04 | visual | Manual review | N/A | pending |

*Status: pending — will be updated after plans are created*

---

## Wave 0 Requirements

- [ ] Animation presets module exports validated via unit test
- [ ] Haptic presets module exports validated via unit test
- [ ] TypeScript compilation passes with new modules

*Existing Vitest infrastructure covers unit testing needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Screen transitions feel smooth | TRANS-01, TRANS-02, STATE-04 | Visual/feel quality cannot be automated | Navigate all screen transitions on device, verify 3 types used consistently |
| Haptic feedback appropriate | DES-04 | Physical sensation requires device | Tap all interactive elements, verify haptic feedback matches 3-tier system |
| Components look premium | DES-02 | Visual quality is subjective | Review all base components across screens for polished appearance |
| Animation timings consistent | DES-03 | Timing consistency is experiential | Run app and verify animations feel coherent across all screens |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
