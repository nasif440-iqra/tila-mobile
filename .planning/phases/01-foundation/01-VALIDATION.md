---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | FOUN-01 | unit | `npm test -- typography` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | FOUN-02 | unit | `npm test -- atmosphere` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | FOUN-03 | unit | `npm test -- animations` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | FOUN-04 | unit+manual | `npm test -- reduceMotion` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | FOUN-05 | manual | N/A (runtime bug, needs device test) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Typography token tests — verify lineHeight ratios match UI-SPEC values
- [ ] Animation token tests — verify breathing/drift/settle tiers exist with correct values
- [ ] AtmosphereBackground preset tests — verify all 6 presets render without error

*Existing test infrastructure covers framework setup. Wave 0 adds phase-specific test stubs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Arabic diacritics not clipped | FOUN-01 | Visual rendering on real device | Render Bismillah with full tashkeel at display, quizHero, large, body sizes on iOS and Android. Verify no diacritic is cut off. |
| Ambient gradient visual consistency | FOUN-02 | Visual consistency across screens | Navigate Home → Quiz → Onboarding → Loading. No raw cream/white background visible on any screen. |
| Reduce Motion respects device setting | FOUN-04 | OS accessibility setting required | Enable Reduce Motion in device settings. Verify: no breathing/drift animations, entrances use opacity fades only. |
| FloatingLettersLayer 15-min stability | FOUN-05 | Long-running runtime test | Leave FloatingLettersLayer visible on Android for 15+ minutes. Verify no freeze, no visual glitch. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
