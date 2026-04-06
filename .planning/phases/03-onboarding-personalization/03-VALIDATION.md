---
phase: 3
slug: onboarding-personalization
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-06
---

# Phase 3 — Validation Strategy (Sacred Moments)

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test && npm run validate`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-00 | 01 | 1 | ALL | scaffold | `npm test -- --run src/__tests__/phrase-reveal.test.ts src/__tests__/bismillah-sacred.test.ts src/__tests__/onboarding-atmosphere.test.ts src/__tests__/tilawat-reveal.test.ts src/__tests__/hadith-reveal.test.ts src/__tests__/finish-settle.test.ts` | Creates W0 | pending |
| 03-01-01 | 01 | 1 | SACR-01 | unit (source scan) | `npm test -- --run src/__tests__/phrase-reveal.test.ts && npx tsc --noEmit` | W0 task | pending |
| 03-01-02 | 01 | 1 | SACR-03 | unit (source scan) | `npm test -- --run src/__tests__/onboarding-atmosphere.test.ts && npx tsc --noEmit` | W0 task | pending |
| 03-01-03 | 01 | 1 | SACR-06 | unit (source scan) | `npm test -- --run src/__tests__/finish-settle.test.ts && npx tsc --noEmit` | W0 task | pending |
| 03-02-01 | 02 | 2 | SACR-02 | unit (source scan) | `npm test -- --run src/__tests__/bismillah-sacred.test.ts && npx tsc --noEmit` | W0 task | pending |
| 03-02-02 | 02 | 2 | SACR-04 | unit (source scan) | `npm test -- --run src/__tests__/tilawat-reveal.test.ts && npx tsc --noEmit` | W0 task | pending |
| 03-02-03 | 02 | 2 | SACR-05 | unit (source scan) | `npm test -- --run src/__tests__/hadith-reveal.test.ts && npx tsc --noEmit` | W0 task | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

All 6 test files created by Plan 01, Task 0 (Wave 0 scaffold):

- [ ] `src/__tests__/phrase-reveal.test.ts` -- covers SACR-01 (PhraseReveal component structure, types, reduce motion, skip behavior)
- [ ] `src/__tests__/bismillah-sacred.test.ts` -- covers SACR-02 (Bismillah micro-lesson structure, 4 words, CTA, no auto-advance)
- [ ] `src/__tests__/onboarding-atmosphere.test.ts` -- covers SACR-03 (AtmosphereBackground integration, no standalone FloatingLettersLayer)
- [ ] `src/__tests__/tilawat-reveal.test.ts` -- covers SACR-04 (Tilawat PhraseReveal, ShimmerWord removed)
- [ ] `src/__tests__/hadith-reveal.test.ts` -- covers SACR-05 (Hadith PhraseReveal, preserves ArchOutline + WarmGlow)
- [ ] `src/__tests__/finish-settle.test.ts` -- covers SACR-06 (Finish gentle settle, no bouncy spring)

Note: Existing `src/__tests__/bismillah.test.ts` has only `.todo` tests describing the old pattern. It will be superseded by `bismillah-sacred.test.ts`.

*All tests use source-scan pattern (fs.readFileSync + expect(source).toContain) matching existing project conventions.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PhraseReveal word-by-word timing feels natural | SACR-01 | Animation timing perception requires human judgment | Run onboarding, observe Bismillah word reveal cadence (should feel like calligraphy) |
| Bismillah micro-lesson teaches effectively | SACR-02 | Teaching moment requires human evaluation | Complete Bismillah step, verify 4 units with meaning feel like learning |
| Atmosphere warmth across onboarding | SACR-03 | Visual warmth is subjective | Walk through full onboarding, verify consistent ambient background |
| Finish checkmark settle feels earned | SACR-06 | Animation emotion requires human judgment | Complete onboarding, observe checkmark -- should feel quiet and grounding |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify with test file + tsc
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (6 test files in Task 0)
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution
