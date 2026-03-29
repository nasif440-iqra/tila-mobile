---
phase: 5
slug: celebrations-feedback
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run validate` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run validate`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 01-T1 | 05-01 | 1 | CEL-05 | unit+source-audit | `npm test -- --run src/__tests__/islamic-copy.test.ts src/__tests__/mastery-pipeline.test.ts` | pending |
| 01-T2 | 05-01 | 1 | CEL-01 | typecheck | `npm run typecheck` | pending |
| 02-T1 | 05-02 | 2 | CEL-03 | typecheck | `npm run typecheck` | pending |
| 02-T2 | 05-02 | 2 | CEL-01, CEL-03 | typecheck | `npm run typecheck` | pending |
| 03-T1 | 05-03 | 2 | CEL-04 | typecheck | `npm run typecheck` | pending |
| 03-T2 | 05-03 | 2 | CEL-01, CEL-02, CEL-04 | source-audit | `npm test -- --run src/__tests__/phase-complete-celebration.test.ts src/__tests__/celebration-tiers.test.ts` | pending |

---

## Sampling Gap Documentation

Wave 2 tasks 02-T1, 02-T2, and 03-T1 use `npm run typecheck` only (no behavioral tests). This is a known trade-off of the Wave 0 pattern:
- Plan 01 T1 creates test stubs in Wave 1
- Plans 02/03 implement components in Wave 2 with typecheck verification
- Plan 03 T2 runs retroactive source-audit tests that cover the behavioral gap

This pattern ensures all behavioral assertions run AFTER components exist, avoiding false negatives.

---

## Wave 0 Requirements

- [ ] `src/__tests__/islamic-copy.test.ts` — source-audit tests for CEL-05 (Islamic phrases in engagement.js)
- [ ] `src/__tests__/mastery-pipeline.test.ts` — source-audit tests for mastery wiring
- [ ] `src/__tests__/phase-complete-celebration.test.ts` — source-audit tests for CEL-04
- [ ] `src/__tests__/celebration-tiers.test.ts` — source-audit tests for CEL-01

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Letter mastery celebration visual quality | CEL-03 | Subjective visual/haptic | Master a letter on device, verify WarmGlow + scale + haptic |
| Phase completion milestone celebration | CEL-04 | Subjective visual | Complete all phase lessons, verify milestone screen |
| Tiered celebrations feel proportional | CEL-01 | Experiential comparison | Trigger all 4 tiers, compare escalation |
| Islamic phrases feel natural | CEL-05 | Subjective copy quality | Play through lessons, verify phrases aren't forced |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity documented (Wave 2 typecheck gap with retroactive coverage)
- [ ] Wave 0 covers all test files
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
