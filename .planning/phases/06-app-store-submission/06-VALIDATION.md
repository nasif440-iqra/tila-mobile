---
phase: 6
slug: app-store-submission
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && npm run validate` |
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
| 06-01-01 | 01 | 1 | CONV-09 | structural | `npm run validate` | ✅ existing | ⬜ pending |
| 06-01-02 | 01 | 1 | CONV-08 | manual | device test | N/A | ⬜ pending |

---

## Wave 0 Requirements

*Existing test infrastructure covers all needs. No new test files required — this phase is primarily operational.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Support contact link works | CONV-09 | Opens email client | Tap "Contact Support" on Progress tab, verify mailto opens |
| Privacy policy URL is live | CONV-08 | External hosting | Open privacy policy URL in browser, verify content loads |
| Production build runs on device | CONV-08 | Device testing | Install production build, complete full lesson flow |
| Screenshots captured correctly | CONV-08 | Visual asset creation | Review screenshots match required sizes and content |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or manual verification documented
- [ ] Feedback latency < 10s for automated checks
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
