---
phase: 2
slug: repo-cleanup-design-consistency
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
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
| 02-01-01 | 01 | 1 | STAB-05 | structural | `npm run validate` | ✅ existing | ⬜ pending |
| 02-01-02 | 01 | 1 | STAB-03 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | STAB-06 | unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/revenuecat-init.test.ts` — test that RevenueCat init failure defaults to free tier
- [ ] `src/__tests__/crescent-icon.test.ts` — test that CrescentIcon renders without crashing

*Existing test infrastructure covers STAB-04 (audio-safety.test.ts) and STAB-05 (validate script).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CrescentIcon visual appearance | STAB-06 | SVG rendering requires device | View AnimatedStreakBadge and phase-complete screen, verify crescent matches BrandedLogo style |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
