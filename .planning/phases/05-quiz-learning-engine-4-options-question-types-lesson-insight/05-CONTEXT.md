# Phase 5: Quiz & Learning Engine - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Three engine changes: always show 4 quiz options (not 2-3), add reverse letter identification questions, and replace spaced-repetition scheduling language in lesson insights with mastery celebration + confusion pair awareness.

</domain>

<decisions>
## Implementation Decisions

### Quiz option count
- **D-01:** All question generators must produce exactly 4 options (1 correct + 3 distractors). Currently most use `slice(0, 2)` for 3 total — change to `slice(0, 3)`.
- **D-02:** When fewer than 3 valid distractors exist (e.g., early lessons with only 2 letters taught), pad with letters from adjacent lessons or the full alphabet to reach 4 options.

### Question type balance
- **D-03:** Keep 50/50 split between rule-based ("Which has 1 dot below?") and name-based ("Which is Ba?") questions in recognition mode.
- **D-04:** Add a third question type: "reverse identification" — show an Arabic letter prominently at the top, ask "What is this letter?" with 4 name options (text, not Arabic). This is distinct from name-based which shows Arabic options.
- **D-05:** The three types should be roughly equal: 33% rule, 33% name, 33% reverse identification.

### Lesson insights
- **D-06:** Remove all spaced-repetition scheduling language ("Review BA on Tuesday"). Users find this confusing and random.
- **D-07:** Lead with mastery celebration: "You mastered Alif!", "Ba is getting stronger", "3 letters now retained" — progress-focused, encouraging.
- **D-08:** Follow with confusion pairs if any exist: "You sometimes confuse Ba and Ta — keep practicing!" — actionable awareness, not punitive.
- **D-09:** If no confusion pairs and lesson went well, show a simple encouraging message. No empty or technical-looking insights.

### Claude's Discretion
- Exact distractor padding logic when pool is small
- How reverse identification integrates into the question generation pipeline
- Insight message copy (within the celebration + confusion framework)
- Whether reverse identification should also appear in review mode

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above.

### Relevant source files
- `src/engine/questions/recognition.ts` — Rule-based and name-based question generators
- `src/engine/questions/shared.ts` — Distractor selection helpers (getRuleDistractors)
- `src/engine/questions/sound.ts` — Sound question generators (also need 4 options)
- `src/engine/questions/harakat.ts` — Harakat question generators (also need 4 options)
- `src/engine/questions/connectedForms.ts` — Connected forms generators (also need 4 options)
- `src/engine/questions/connectedReading.ts` — Connected reading (also need 4 options)
- `src/engine/questions/review.ts` — Review mode generators
- `src/engine/insights.ts` — Lesson insight generation
- `src/components/LessonSummary.tsx` — Where insights are displayed
- `src/types/question.ts` — Question type definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `shared.ts::getRuleDistractors()` — Already filters by visual rules, just needs larger output
- `shared.ts::makeOpts()` — Creates option arrays, needs to accept 4 items
- `insights.ts` — Has `extractLessonInsights()` which already reads mastery and confusion data

### Established Patterns
- All question generators follow: build target → get distractors → shuffle → return Question[]
- Distractor selection uses `shuffle(pool).slice(0, N)` pattern consistently
- Question types defined in `src/types/question.ts` as string union

### Integration Points
- `src/engine/questions/index.ts` dispatches by `lesson.lessonMode`
- `LessonSummary.tsx` renders insights from `extractLessonInsights()`
- Question type affects the UI in `QuizQuestion.tsx` (prompt display)

</code_context>

<specifics>
## Specific Ideas

- Reverse identification should feel like "I see this letter, I know what it is" — the most natural real-world skill
- Insights should feel celebratory first, constructive second — never clinical or robotic

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-quiz-learning-engine*
*Context gathered: 2026-04-06*
