---
phase: 02
slug: quiz-experience
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | QUIZ-01, QUIZ-05 | — | N/A | unit | `npx vitest run src/__tests__/quiz-letterhero.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | QUIZ-02 | — | N/A | unit | `npx vitest run src/__tests__/quiz-correct-feedback.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | QUIZ-03, QUIZ-04 | — | N/A | unit | `npx vitest run src/__tests__/quiz-wrong-feedback.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/quiz-letterhero.test.ts` — LetterHero breathing, sizing, WarmGlow integration
- [ ] `src/__tests__/quiz-correct-feedback.test.ts` — Gold ripple, +1 removal, simultaneous dim
- [ ] `src/__tests__/quiz-wrong-feedback.test.ts` — Wrong answer panel color swap, shake removal, haptic swap

*Existing Vitest infrastructure covers framework needs. Only test files need creation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Breathing animation visually smooth on Android | QUIZ-01 | Visual quality requires device | Run quiz, observe LetterHero breathing for 30s on Android |
| Gold ripple timing feels natural | QUIZ-02 | Subjective animation quality | Tap correct answer, verify ripple feels warm not jarring |
| Wrong answer panel tone feels encouraging | QUIZ-04 | Emotional register is subjective | Tap wrong answer, read encouragement text in context |
| Arabic at 52px reads as primary content | QUIZ-05 | Visual weight is subjective | View quiz options, confirm Arabic dominates over English |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
