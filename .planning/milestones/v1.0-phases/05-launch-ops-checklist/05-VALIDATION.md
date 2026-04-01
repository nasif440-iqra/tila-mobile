---
phase: 05
slug: launch-ops-checklist
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run coverage` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | LAUNCH-01 | file check | `grep -q "privacy" src/components/progress/ app/` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | LAUNCH-02 | doc check | `test -f .planning/phases/05-launch-ops-checklist/PRIVACY-QUESTIONNAIRE.md` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | LAUNCH-03 | config check | `grep -q "TARGETED_DEVICE_FAMILY.*1" ios/tila.xcodeproj/project.pbxproj` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | LAUNCH-04 | manual | Device verification (human) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers test framework. Phase 5 is primarily ops/documentation work:
- No new test files needed — verification is file existence and config checks
- Production build verification is inherently manual (physical device)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Privacy policy accessible at URL | LAUNCH-01 | Requires browser/HTTP check | Open GitHub Pages URL, verify policy renders |
| Production build on device | LAUNCH-04 | Physical device required | Install via TestFlight, run full reviewer flow |
| Screenshots captured | N/A | Visual output | Capture during reviewer run on device |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
