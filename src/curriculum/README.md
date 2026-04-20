# src/curriculum/

Scaffolding for future lesson work. Populated when the new curriculum blueprint lands.

## Directory layout

- `runtime/` — shape-neutral `LessonRunner` and its cursor logic. Deliberately opinionless about screen shapes. Do not add screen-type definitions here.
- `reference/` — hidden reference lesson used for development and smoke testing. Not shown to production users. Gated by `EXPO_PUBLIC_DEV_REFERENCE_LESSON=true`.
- `README.md` — this file.

## Runtime contract

`LessonRunner<T>` takes:

- `screens: T[]` — caller-defined screen type
- `onComplete: () => void` — called after the last screen is advanced past
- `renderScreen: (screen, { advance, index, total }) => ReactNode` — caller decides how to render

The runtime does not know what a screen is. The new curriculum defines its own screen types.

## When the blueprint arrives

1. Create `src/curriculum/lessons/` for lesson data.
2. Create `src/curriculum/types.ts` defining the new curriculum's `Screen` union (or richer shape — whatever the blueprint needs).
3. Update `app/(tabs)/index.tsx` to render the new lesson grid.
4. Create `app/lesson/[id].tsx` (or whatever the new route shape is) that invokes `LessonRunner` with the new types.
5. Wire new analytics events, progress writes, and paywall gating (these were quarantined during the reset — see `.planning/RESET-DECISION-MEMO.md` §2 for what survived).

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

## What NOT to do in here

- Do not add opinionated screen-type definitions to `runtime/`. Keep it neutral.
- Do not write production lesson data until the blueprint is approved.
- Do not bypass the env flag on the sandbox route.
- Do not import `RefScreen` from `reference/` anywhere outside `reference/` and `app/sandbox-lesson.tsx`. It is not a shared contract.

## Why this shape?

Before the reset, Tila had two competing curriculum runtimes (v1 and v2) with opinionated screen types embedded in their engines. When the founder decided to redesign pedagogy, those opinions became sunk cost. The current runtime is deliberately minimal so that the next curriculum can commit to its own screen shape without working around ours.

See `.planning/RESET-DECISION-MEMO.md` for the full rationale.
