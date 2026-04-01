---
phase: 3
slug: onboarding-personalization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 3 — Validation Strategy

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
| 03-01-01 | 01 | 1 | CONV-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CONV-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | CONV-04 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | CONV-02 | unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/onboarding-name-motivation.test.ts` — test name+motivation step rendering and draft state
- [ ] `src/__tests__/home-greeting.test.ts` — test personalized greeting with/without name and motivation
- [ ] `src/__tests__/wird-tooltip.test.ts` — test tooltip appearance and dismissal logic

*Existing test infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Name input keyboard handling | CONV-01 | Keyboard behavior varies by device | Enter name on Android + iOS, verify keyboard doesn't cover input |
| Wird tooltip visual appearance | CONV-02 | Visual rendering requires device | Launch app with fresh profile, verify tooltip appears on streak badge |
| Greeting visual layout | CONV-04 | Typography + layout on device | Check greeting with long name, short name, no name on real device |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
