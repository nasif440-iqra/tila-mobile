# Phase 3: Onboarding & Personalization - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a combined name + motivation step to onboarding, personalize the home screen greeting with name and motivation-specific messaging, and explain the wird concept on first streak badge appearance.

</domain>

<decisions>
## Implementation Decisions

### Combined Name + Motivation Step (CONV-01)
- **D-01:** Add ONE new onboarding step that combines name input (optional text field) and motivation picker (4 options from existing schema: read_quran, pray_confidently, connect_heritage, teach_children, personal_growth)
- **D-02:** Place this step BEFORE Finish — after the learning preview steps (LetterReveal, LetterAudio, LetterQuiz), before the completion step. Current step 8 (Finish) becomes step 9.
- **D-03:** Name input is OPTIONAL — user can skip without entering a name. Motivation picker should have a default or "skip" option.
- **D-04:** Requires a DB migration to add `name` column to `user_profile` table. The `motivation` column already exists in the schema.
- **D-05:** Follow the existing draft state pattern — add `userName` and `motivation` to `OnboardingDraft`, save via `updateProfile()` in handleFinish.

### Home Screen Greeting (CONV-04)
- **D-06:** Greeting format WITH name: "ASSALAMU ALAIKUM, [NAME]" on first line, motivation subtitle on second line
- **D-07:** Greeting format WITHOUT name (skipped): "ASSALAMU ALAIKUM" on first line, motivation subtitle on second line
- **D-08:** Greeting format WITHOUT motivation (edge case): "ASSALAMU ALAIKUM" with current dynamic subtitle ("5 letters down", "Begin your journey", etc.)
- **D-09:** Motivation-to-subtitle mapping:
  - read_quran → "Reading toward the Quran"
  - pray_confidently → "Building toward confident salah"
  - connect_heritage → "Connecting to your heritage"
  - teach_children → "Learning to teach your children"
  - personal_growth → "Growing in your faith"
- **D-10:** Location: `app/(tabs)/index.tsx` lines 473-478 (current hardcoded greeting)

### Wird Explanation (CONV-02)
- **D-11:** Auto tooltip that appears the FIRST TIME the streak badge is shown on the home screen
- **D-12:** Dismisses on tap. One-time only — tracked via a new flag in `user_profile` (e.g., `wird_explanation_seen`)
- **D-13:** Tooltip content: "In Islamic tradition, a wird is a daily practice — a small, consistent effort. Your learning wird builds day by day."
- **D-14:** Visual style: small card/tooltip positioned near the AnimatedStreakBadge, matching the app's design system (warm cream background, dark green text, subtle shadow)

### Claude's Discretion
- Exact visual design of the tooltip (card shape, arrow, animation)
- Whether the name + motivation step uses cards, a form layout, or a split-screen design
- DB migration version number
- Test approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Onboarding Flow
- `app/onboarding.tsx` — Onboarding screen entry point
- `src/components/onboarding/OnboardingFlow.tsx` — Flow orchestrator with draft state pattern (lines 56, 101-106)
- `src/components/onboarding/steps/` — All 9 existing step components (pattern to follow)
- `src/components/onboarding/steps/StartingPoint.tsx` — Example of a data-collecting step with radio cards

### User Profile & DB
- `src/db/schema.ts` — user_profile table definition (lines 10-24, includes motivation column)
- `src/engine/progress.ts` — `saveUserProfile()` function (lines 303-355), `loadProgress()` 
- `src/types/onboarding.ts` — OnboardingDraft type definition

### Home Screen
- `app/(tabs)/index.tsx` — Greeting at lines 473-478, `getGreetingSubtitle` at lines 133-138
- `src/components/home/AnimatedStreakBadge.tsx` — Streak badge component (wird explanation target)

### Design System
- `src/design/tokens.ts` — Colors, typography, spacing
- `src/design/theme.ts` — useColors() hook

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OnboardingDraft` type and draft state pattern — extend with `userName` and `motivation` fields
- `StartingPoint.tsx` — radio card pattern reusable for motivation picker
- `AnimatedStreakBadge.tsx` — target for wird tooltip attachment
- `user_profile` table already has `motivation` column — no migration needed for that field

### Established Patterns
- Onboarding steps follow a consistent pattern: receive `onNext` prop, render content, call `onNext()` to advance
- Profile flags stored as integers in `user_profile` (e.g., `wird_intro_seen`, `post_lesson_onboard_seen`)
- DB migrations use PRAGMA table_info checks for column existence

### Integration Points
- `handleFinish()` in OnboardingFlow.tsx calls `updateProfile()` — add name + motivation to this call
- `loadProgress()` returns profile data including motivation — home screen can read from here
- `TOTAL_STEPS` constant needs updating from 9 to 10

</code_context>

<specifics>
## Specific Ideas

- The reviewer noted the onboarding tone is "exactly right" — the new name step should match this warm, sacred tone. Not "What's your name?" but something like "What should we call you?" with a note that it's optional.
- The motivation options should feel aspirational, not clinical. Use the subtitle phrasing from D-09 as the option labels.
- The wird tooltip should feel like a gentle teaching moment, not an interruption.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-onboarding-personalization*
*Context gathered: 2026-04-01*
