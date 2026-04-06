# Phase 4: Value Communication - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Surface the mastery engine's intelligence to users through post-lesson insights and progress tab enhancements. Users should understand that Tila tracks their confusions, schedules reviews at the right time, and measures their improvement — things no free YouTube video can do.

This phase does NOT touch the paywall flow, onboarding, or pricing. It makes the engine's value visible so users understand what they're paying for when the paywall arrives.

</domain>

<decisions>
## Implementation Decisions

### Post-Lesson Insights (CONV-03)
- **D-01:** Add a "Your Lesson Insights" section to the `LessonSummary` component, appearing below the existing accuracy/score display
- **D-02:** Show on ALL lessons (not just free tier 1-7). Insights are a feature, not a sales pitch.
- **D-03:** Three insight types, shown conditionally when data exists:
  1. **Confusion detection:** "Tila noticed you mixed up Ba and Ta — we'll practice these together" (when `getTopConfusions()` returns pairs involving letters from this lesson)
  2. **Next review timing:** "Review Ba on Tuesday" (from `nextReview` date on mastery entities updated this lesson)
  3. **Accuracy trend:** "You're getting stronger with Alif (60% → 85%)" (when accuracy improved since last session on any letter in this lesson)
- **D-04:** If no interesting data exists for the lesson (no confusions, no prior sessions to compare), show nothing — no filler messages
- **D-05:** Insights appear as a subtle card/section below the main summary, not a modal or separate screen

### Progress Tab Enhancements (CONV-05)
- **D-06:** Add a "Letters You Mix Up" section to the progress tab showing top confused letter pairs from `getTopConfusions()`. Show the top 3-5 pairs with confusion count.
- **D-07:** Add a "Coming Up for Review" section showing letters with `nextReview` dates in the near future. Group by day: "Today (3 letters)", "Tomorrow (2 letters)", "This week (5 letters)".
- **D-08:** Both new sections appear ABOVE the existing Letter Mastery Grid — confusion pairs and upcoming reviews are more actionable than the full grid.
- **D-09:** If no confusions exist yet (new user), hide the "Letters You Mix Up" section entirely. If no reviews are due, show "No reviews due — keep learning!"

### Tone and Messaging
- **D-10:** Use caring teacher tone throughout — both post-lesson insights and progress tab. "We'll practice these together" not "3x confusion count."
- **D-11:** Messaging should feel like a patient teacher who notices and cares, not a dashboard of metrics. The data is the same; the framing is what matters.
- **D-12:** Key phrases to use:
  - Confusion: "Tila noticed you mixed up [X] and [Y] — we'll practice these together"
  - Review: "Review [X] on [day]" or "Time to revisit [X]"
  - Improvement: "You're getting stronger with [X]" or "Great progress on [X]"
  - No data: silence (no filler)

### Free-Tier SRS Visibility
- **D-13:** The progress tab sections (confusion pairs, review schedule) are visible to ALL users including free tier. This is intentional — free users seeing their review schedule reinforces that SRS is working on their free letters.
- **D-14:** Verified in code: `usePremiumReviewRights()` already filters reviews to free letters for non-paying users. The progress tab just surfaces what the engine already computes.

### Claude's Discretion
- Visual design of the insight card in LessonSummary
- Layout of the new progress tab sections
- How to compute accuracy trend (compare current session accuracy to last session on same letters)
- Whether to animate insight card appearance
- Test approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Post-Lesson UI
- `app/lesson/[id].tsx` — Lesson completion flow, LessonSummary rendering (lines 329-351)
- `src/components/LessonQuiz.tsx` — Contains LessonSummary component definition

### Mastery Engine
- `src/engine/mastery.js` — Entity structure (lines 107-115), confusion tracking (lines 205-245), mastery states (lines 280-318), SRS intervals (line 332)
- `src/engine/selectors.js` — `getTopConfusions()` (line 140), `planReviewSession()` (lines 173-229), `getDueEntityKeys()`, `getEntitiesByMasteryState()`

### Progress Tab
- `app/(tabs)/progress.tsx` — Current progress screen layout
- `src/components/progress/LetterMasteryGrid.tsx` — Letter grid component
- `src/components/progress/LetterDetailSheet.tsx` — Letter detail popup

### Data Types
- `src/hooks/useProgress.ts` — ProgressState type with mastery data
- `src/data/letters.js` — ARABIC_LETTERS array for letter name lookups

### Design System
- `src/design/tokens.ts` — Colors, typography, spacing
- `src/design/theme.ts` — useColors() hook

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getTopConfusions(mastery.confusions, N)` — returns top N confused pairs, ready to use
- `planReviewSession(mastery, today)` — returns due/unstable/weak items with dates
- `getDueEntityKeys(mastery.entities, today)` — letters due for review today
- `LessonSummary` component already has sections for accuracy, score detail, mastery breakdown — new insights fit below
- `LetterMasteryGrid` and `LetterDetailSheet` already exist on progress tab

### Established Patterns
- Progress tab uses `useProgress()` hook which loads all mastery data
- Lesson screen already calls `planReviewSession` for review count (line 331-332)
- Caring teacher tone established in `WrongAnswerPanel` copy: "Every effort is rewarded — try again"

### Integration Points
- `LessonSummary` receives `mastery` and `completedLessonIds` — has access to all needed data
- Progress tab has `progress.mastery` with full entity and confusion data
- Letter names available via `ARABIC_LETTERS.find(l => l.id === id).name`

</code_context>

<specifics>
## Specific Ideas

- The expert reviewer said: "the mastery engine is legitimately sophisticated but almost entirely invisible to users." This phase makes it visible.
- The MASTER-PLAN.md SRS honesty section notes: free-tier users CAN experience SRS on their 7 free lessons. Showing the review schedule on the progress tab reinforces this.
- Confusion pair display should use Arabic letter names (not IDs) and show the actual letters in Amiri font for visual clarity.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-value-communication*
*Context gathered: 2026-04-02*
