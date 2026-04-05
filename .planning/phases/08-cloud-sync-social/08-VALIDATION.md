---
phase: 08
slug: cloud-sync-social
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && npm run typecheck` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run typecheck`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | RET-02 | unit | `npm test` | ❌ W0 | pending |
| 08-01-02 | 01 | 1 | RET-03 | unit | `npm test` | ❌ W0 | pending |
| 08-02-01 | 02 | 1 | RET-03 | unit | `npm test` | ❌ W0 | pending |
| 08-02-02 | 02 | 1 | RET-04, RET-06 | unit | `npm test` | ❌ W0 | pending |
| 08-03-01 | 03 | 2 | RET-05 | unit | `npm test` | ❌ W0 | pending |
| 08-03-02 | 03 | 2 | RET-08 | unit | `npm test` | ❌ W0 | pending |
| 08-04-01 | 04 | 2 | RET-10 | unit | `npm test` | ❌ W0 | pending |
| 08-04-02 | 04 | 2 | RET-09 | integration | `npm test` | ❌ W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for Supabase auth service (mock client)
- [ ] Test stubs for sync service (local vs remote reconciliation)
- [ ] Test stubs for friend/social service
- [ ] Shared fixtures for mock Supabase responses

*Existing Vitest infrastructure covers test runner — only domain-specific stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google Sign-In flow | RET-03 | Requires native Google SDK + real device | Sign in with Google on iOS/Android device |
| Apple Sign-In flow | RET-03 | Requires Apple entitlement + real device | Sign in with Apple on iOS device |
| Cross-device sync | RET-04 | Requires two devices with same account | Complete lesson on device A, verify progress on device B |
| Offline-to-online sync | RET-06 | Requires network toggling on real device | Complete lesson offline, reconnect, verify sync |
| Dark mode appearance | RET-10 | Visual verification | Toggle system dark mode, verify all screens render correctly |
| Privacy manifest | RET-07 | App Store submission validation | Verify privacy manifest accepted during TestFlight upload |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
