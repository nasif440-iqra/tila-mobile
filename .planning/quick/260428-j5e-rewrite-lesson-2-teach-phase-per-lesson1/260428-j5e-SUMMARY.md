---
quick_id: 260428-j5e
description: Rewrite Lesson 2 Teach phase per lesson1spec.txt
date: 2026-04-28
status: complete
commits:
  - 05a1abd
  - 6e3b922
  - dfd7404
  - 6a35b33
---

# Quick Task 260428-j5e — Summary

## Goal

Rewrite Lesson 2's Teach phase to move the first reading win (`بَ = ba`) from Screen 2.4 to Screen 2.1, and demote Alif to a single light symbol-only screen. The old phase over-taught Alif before the learner ever read a syllable.

## What changed

| File | Change |
|---|---|
| `src/curriculum/lessons/lesson-02.ts` | Replaced 4 teach screens. New order: `teach-first-ba` (autoPlay) → `teach-fatha-mark` → `teach-letter-vs-syllable` → `teach-meet-alif-light`. Warm-recall, practice, mastery untouched. |
| `src/__tests__/curriculum/lesson-02-shape.test.ts` | Renamed Screen 2.4 assertion to `teach-letter-vs-syllable`. Added 5 round-6 assertions: teach-screen order, removed-ID absence, autoPlay-on-teach-first-ba, no-autoPlay-on-teach-meet-alif-light, no Alif-as-sound copy. |
| `curriculum/phase-1/02-alif-ba-fatha.md` | Replaced Part 2 — Teach section. Updated Goal bullet ordering and pedagogy rationale to reflect first-reading-win pivot. |

## Commits

- `05a1abd` feat(curriculum): L2 round-6 — first-reading-win teach pivot (lesson-02.ts)
- `6e3b922` test(curriculum): L2 shape tests for round-6 first-reading-win pivot
- `dfd7404` docs(curriculum): L2 markdown spec aligned with round-6 teach pivot
- `6a35b33` chore: merge quick task worktree (260428-j5e L2 teach rewrite)

## Tests

- `npm test -- lesson-02-shape` → 38/38 pass (33 prior + 5 new)
- `npm test` (full) → 401 pass, 20 todo, 3 skipped, 0 fail. No regressions in any other suite.

## Acceptance criteria (from lesson1spec.txt)

| Criterion | Status |
|---|---|
| Lesson 2 still has 16 screens | ✓ (asserted in shape test) |
| First Teach screen is بَ with autoplay ba audio | ✓ |
| Alif has only one teach screen | ✓ |
| No copy teaches Alif as "a" sound or vowel | ✓ (asserted) |
| Practice and mastery answer pools unchanged | ✓ |
| Last two scored items are Read with `countsAsDecoding=true` | ✓ |
| Tests pass | ✓ |

## Notes

- Audio assets (`audio/letter/ba_fatha_sound.mp3`, `audio/letter/alif_name.mp3`) already routed in `src/audio/player.ts` — no new audio entries required.
- Out-of-scope guards held: LessonRunner, exercise renderers, audio/player, completion screen, LessonChrome, progress-store all untouched.
