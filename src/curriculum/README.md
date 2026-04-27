# src/curriculum/

Home of the A0 vertical slice — lesson data, runtime, and UI for the first shipped lesson.

## Directory layout

- `runtime/` — `LessonRunner` and its cursor logic. Now typed to `LessonData` (no longer generic).
- `lessons/` — lesson data files (`lesson-01.ts`, …) and the registry (`index.ts`).
- `types.ts` — `LessonData` contract defining all seven exercise types.
- `ui/` — rendering components for teaching blocks, Tap, Hear, chrome, and completion.
- `reference/` — hidden reference lesson used for development and smoke testing. Not shown to production users. Gated by `EXPO_PUBLIC_DEV_REFERENCE_LESSON=true`.
- `README.md` — this file.

## Runtime contract

`LessonRunner` takes a `LessonData` directly:

- `lesson: LessonData` — fully typed lesson (exercises, metadata)
- `onComplete: () => void` — called after the last block is advanced past
- `masteryRecorder` — `noopMasteryRecorder` for now; real impl planned later

The runtime knows the `LessonData` shape. Screen-type generics are gone.

## Status

The A0 vertical slice is live:

- `types.ts` defines the `LessonData` contract (all seven exercise types).
- `runtime/LessonRunner.tsx` consumes `LessonData` directly — no longer generic.
- `lessons/lesson-01.ts` + `lessons/index.ts` carry Lesson 1 + registry.
- `ui/` renders teaching blocks, Tap, Hear, chrome, and completion.
- `app/lesson/[id].tsx` hosts the route; `app/(tabs)/index.tsx` exposes the CTA.

See `docs/superpowers/specs/2026-04-22-a0-lesson-1-vertical-slice-design.md` for the full A0 design.

## Adding a lesson

1. Author the human spec at `curriculum/phase-N/<nn>-<slug>.md`.
2. Hand-compile a sibling TS file at `src/curriculum/lessons/lesson-<nn>.ts`
   that exports a `LessonData` matching the frontmatter and exercises.
3. Register it in `src/curriculum/lessons/index.ts`.
4. Add a shape test at `src/__tests__/curriculum/lesson-<nn>-shape.test.ts`.
5. Expose a CTA on the home screen (current home card pattern).

## Running the reference lesson locally

```bash
EXPO_PUBLIC_DEV_REFERENCE_LESSON=true npx expo start -c
# Navigate to /sandbox-lesson (direct URL; not linked from home).
```

The reference lesson exercises:

- `LessonRunner` advancing through 3 screens
- Design system `Button` component rendering
- `useHabit.recordPractice()` writing to the habit table on completion
- Navigation back to home on completion

It intentionally ignores answer correctness — it exists to smoke-test the runtime, not to be a graded lesson.

## What still NOT to do

- Don't bypass the env flag on `app/sandbox-lesson`.
- Don't write a generalized markdown parser until at least Lesson 2–3 have shipped
  — the contract may still shift. Manual hand-compile is correct for now.
- Don't wake the quarantined mastery engine. `noopMasteryRecorder` stays until
  a real impl is planned.

## Why this shape?

Before the reset, Tila had two competing curriculum runtimes (v1 and v2) with opinionated screen types embedded in their engines. When the founder decided to redesign pedagogy, those opinions became sunk cost. The current runtime is deliberately minimal so that the next curriculum can commit to its own screen shape without working around ours.

See `.planning/RESET-DECISION-MEMO.md` for the full rationale.
