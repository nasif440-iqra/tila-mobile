---
phase: 2
slug: onboarding-wow-factor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 2 — Validation Strategy

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
- **After every plan wave:** Run `npm run validate` (lint + typecheck)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| TBD | TBD | TBD | ONB-01 | visual | Manual review | pending |
| TBD | TBD | TBD | ONB-02 | visual+haptic | Manual on device | pending |
| TBD | TBD | TBD | ONB-03 | typecheck | `npm run validate` | pending |
| TBD | TBD | TBD | ONB-04 | visual | Manual review | pending |
| TBD | TBD | TBD | MIND-01 | visual+behavior | Manual on device | pending |
| TBD | TBD | TBD | MIND-02 | visual | Manual timing check | pending |

---

## Wave 0 Requirements

- [ ] TypeScript compilation passes with new BismillahMoment and BrandedLogo components
- [ ] All existing onboarding tests still pass after step index changes

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Onboarding feels special and warm | ONB-01 | Subjective visual quality | Walk through full 9-step onboarding on device |
| First letter moment feels sacred | ONB-02 | Emotional/experiential quality | Watch LetterReveal step, verify stillness beat + glow + haptic |
| Step transitions are smooth | ONB-03, ONB-04 | Animation smoothness on device | Navigate all steps, verify staggered entrances |
| Bismillah appears during onboarding | MIND-01 | Behavioral flow | Verify step 4 shows Bismillah calligraphy |
| Bismillah is 2-3 seconds | MIND-02 | Timing verification | Time the Bismillah moment with stopwatch |
| Bismillah before first session lesson | MIND-01 | Session-level behavior | Force-kill app, reopen, start lesson, verify Bismillah overlay |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
