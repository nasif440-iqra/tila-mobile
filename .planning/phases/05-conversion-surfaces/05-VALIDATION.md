---
phase: 5
slug: conversion-surfaces
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
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
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run validate`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | CONV-06 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | CONV-07 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | CONV-07 | unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/upgrade-card.test.ts` — test UpgradeCard renders with gold accent, scholarship link
- [ ] `src/__tests__/trial-badge.test.ts` — test TrialBadge displays countdown
- [ ] `src/__tests__/lesson7-celebration.test.ts` — test celebration → offer transition

*Existing test infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Gold accent card visual quality | CONV-06 | Visual rendering requires device | View lesson 7 summary, verify gold border/shadow/Lora heading |
| Celebration → pause → offer timing | CONV-07 | Animation timing requires device | Complete lesson 7 as free user, verify confetti then pause then card |
| Trial badge on home screen | CONV-07 | Layout requires device | Sign up for trial, verify "X days left" badge near header |
| Scholarship mailto opens correctly | CONV-07 | Email client integration | Tap scholarship link, verify email opens with correct subject |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
