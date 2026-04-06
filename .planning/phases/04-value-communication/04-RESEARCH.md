# Phase 4: Value Communication - Research

**Researched:** 2026-04-01
**Domain:** React Native UI components, mastery engine data surfacing, SQLite queries
**Confidence:** HIGH

## Summary

This phase adds two UI features that make the mastery engine's intelligence visible to users: (1) post-lesson insight cards on the LessonSummary screen, and (2) two new sections on the Progress tab ("Letters You Mix Up" and "Coming Up for Review"). All the engine data needed already exists -- `getTopConfusions()`, `planReviewSession()`, `getDueEntityKeys()`, and per-entity `correct/attempts/nextReview` fields are fully functional. The work is purely UI composition plus one small data computation (accuracy trend from `question_attempts` table).

The LessonSummary component currently receives `mastery` indirectly through the lesson screen's `progress` state. Post-lesson insights need access to confusion data, next-review dates, and per-letter accuracy from the just-completed session vs previous sessions. The Progress tab already has full mastery data via `useProgress()`.

**Primary recommendation:** Build thin, presentational components that consume existing engine selectors. The only new data logic needed is an accuracy trend query against `question_attempts` to compare current vs previous session accuracy per letter.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Add "Your Lesson Insights" section to LessonSummary, below existing accuracy/score display
- D-02: Show insights on ALL lessons, not just free tier 1-7
- D-03: Three insight types (confusion detection, next review timing, accuracy trend), shown conditionally
- D-04: If no interesting data exists, show nothing -- no filler messages
- D-05: Insights appear as subtle card/section, not modal or separate screen
- D-06: "Letters You Mix Up" section on progress tab from getTopConfusions(), top 3-5 pairs
- D-07: "Coming Up for Review" section with nextReview dates grouped by day (Today/Tomorrow/This week)
- D-08: Both new sections appear ABOVE the existing Letter Mastery Grid
- D-09: Hide sections when no data exists; show "No reviews due -- keep learning!" for empty review schedule
- D-10: Caring teacher tone throughout
- D-11: Patient teacher framing, not metrics dashboard
- D-12: Specific copy phrases defined (see CONTEXT.md)
- D-13: Progress tab sections visible to ALL users including free tier
- D-14: usePremiumReviewRights already filters reviews for free users -- no additional gating needed

### Claude's Discretion
- Visual design of the insight card in LessonSummary
- Layout of the new progress tab sections
- How to compute accuracy trend (compare current session accuracy to last session on same letters)
- Whether to animate insight card appearance
- Test approach

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONV-03 | Value communication woven into lessons 1-7 (mastery insights shown after lessons) | Post-lesson insight card on LessonSummary; engine selectors `getTopConfusions()` and entity `nextReview` fields provide all data; accuracy trend needs new query |
| CONV-05 | Mastery engine insights visible to users (confusion tracking, accuracy trends, review scheduling) | Progress tab sections using existing `useProgress()` mastery data; `getTopConfusions()` and `getDueEntityKeys()` already available |
</phase_requirements>

## Standard Stack

No new packages needed. This phase uses only existing dependencies:

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native | 0.83.2 | UI components (View, Text, ScrollView) | Locked stack |
| react-native-reanimated | 4.2.1 | Entrance animations for insight cards | Already used throughout; FadeIn pattern established |
| expo-sqlite | 55.0.11 | Query question_attempts for accuracy trend | Already used for all data access |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-svg | (bundled) | Optional icons for insight cards | Only if visual accents needed |

**No `npm install` needed.** This phase is purely UI composition with existing libraries.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    insights/
      LessonInsights.tsx        # Post-lesson insight card (D-01 through D-05)
      ConfusionPairsSection.tsx  # "Letters You Mix Up" for progress tab (D-06)
      ReviewScheduleSection.tsx  # "Coming Up for Review" for progress tab (D-07)
    progress/
      (existing files unchanged)
  engine/
    insights.ts                 # Pure logic: accuracy trend computation, insight message generation
```

### Pattern 1: Insight Data Computation (Pure Engine Layer)
**What:** A pure TypeScript module that takes mastery data + quiz results and produces structured insight objects. No React dependencies.
**When to use:** Always -- keeps business logic testable outside React.
**Example:**
```typescript
// src/engine/insights.ts
import { getTopConfusions } from './selectors';
import { parseEntityKey } from './mastery.js';
import { getLetter } from '../data/letters.js';

interface LessonInsight {
  type: 'confusion' | 'review' | 'trend';
  message: string;
  letterPair?: { letter1: string; name1: string; letter2: string; name2: string };
  letterName?: string;
  reviewDate?: string;
  trend?: { from: number; to: number };
}

export function generateLessonInsights(
  mastery: { entities: Record<string, any>; confusions: Record<string, any> },
  lessonLetterIds: number[],
  currentSessionAccuracy: Map<number, { correct: number; total: number }>,
  previousAccuracy: Map<number, number>, // letterId -> previous accuracy (0-1)
): LessonInsight[] {
  const insights: LessonInsight[] = [];
  // ... compute confusion, review, trend insights
  return insights;
}
```

### Pattern 2: Conditional Card Rendering (D-04)
**What:** Components that return `null` when no data exists, following the existing pattern in `MasteryBreakdown`.
**When to use:** All insight sections -- never show empty/filler UI.
**Example:**
```typescript
// Pattern already established in LessonSummary.tsx line 229:
// if (strong.length === 0 && needsPractice.length === 0) return null;
function LessonInsights({ insights }: { insights: LessonInsight[] }) {
  if (insights.length === 0) return null;
  return (/* insight card JSX */);
}
```

### Pattern 3: Progress Tab Section Components
**What:** Self-contained sections that receive mastery data via props, matching existing section patterns (StatsRow, PhasePanel, LetterMasteryGrid).
**When to use:** The two new progress tab sections.
**Example:** Follow the existing pattern where `progress.tsx` computes derived data with `useMemo` then passes it to child components.

### Anti-Patterns to Avoid
- **Data fetching in components:** Do NOT add DB queries inside the insight components. All data should flow through `useProgress()` hook or be passed as props from the lesson screen.
- **Hardcoded letter names:** Always use `getLetter(id).name` and `getLetter(id).letter` -- never hardcode Arabic characters in UI logic.
- **Modal or separate screen for insights:** D-05 explicitly says inline card, not modal.
- **Showing empty state for insights:** D-04 says show nothing when no data exists. Do NOT add placeholder text.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confusion pair extraction | Custom SQL query for confusions | `getTopConfusions(mastery.confusions, N)` | Already returns sorted `[{ key, count, lastSeen }]`; just parse the key for letter IDs |
| Review schedule | Custom review date logic | `getDueEntityKeys(entities, today)` + entity `nextReview` fields | SRS scheduling already computed by engine |
| Letter name lookup | Inline mapping of IDs to names | `getLetter(id)` from `src/data/letters.js` | Returns `{ letter, name, ... }` with connected forms |
| Day grouping for reviews | Custom date math | Simple string comparison against `today`, `tomorrow`, `thisWeekEnd` | Dates are YYYY-MM-DD strings, lexicographic comparison works |
| Mastery state derivation | Custom state logic | `deriveMasteryState(entity, today)` | Already handles all threshold/interval logic |

**Key insight:** The mastery engine is fully built. This phase is 100% UI surfacing. The only new computation needed is per-letter accuracy trend (current session vs previous), which requires a simple SQLite query against `question_attempts`.

## Common Pitfalls

### Pitfall 1: Accuracy Trend Data Not Available in Memory
**What goes wrong:** The `EntityState` stores cumulative `correct/attempts` but NOT per-session accuracy history. You cannot compute "60% -> 85%" from the entity alone.
**Why it happens:** Entity state is a running total, not a time series.
**How to avoid:** Query `question_attempts` table grouped by `target_entity` for the current lesson attempt vs the previous one. The schema has `attempt_id` (FK to `lesson_attempts`) and `target_entity` fields, plus `correct` boolean. Group by `attempt_id` to get per-session accuracy for each entity.
**Warning signs:** If you see code computing trend from `entity.correct / entity.attempts`, that's the cumulative average, not a session-over-session trend.

### Pitfall 2: Confusion Key Parsing
**What goes wrong:** Confusion keys have format `"recognition:2->3"` or `"sound:7->8"` or `"harakat:ba-fatha->ba-kasra"`. Parsing must handle all three prefixes.
**Why it happens:** Different lesson modes produce different confusion key formats.
**How to avoid:** Use a parsing function that splits on `":"` then `"->"`. For letter confusions, extract numeric IDs. For harakat confusions, use combo IDs. The `planReviewSession` in selectors.js already does this (lines 193-211) -- reuse that pattern.
**Warning signs:** If insights show undefined letter names, the confusion key parsing is wrong.

### Pitfall 3: LessonSummary Props Don't Include Full Mastery
**What goes wrong:** LessonSummary receives `lesson`, `results`, `passed`, `accuracy`, etc. but does NOT currently receive the full mastery object or confusion data.
**Why it happens:** The component was designed before insights were planned.
**How to avoid:** Either (a) pass additional mastery data as new props from `lesson/[id].tsx`, or (b) compute insights in `lesson/[id].tsx` and pass the pre-computed insight array. Option (b) is cleaner -- keeps LessonSummary presentational.
**Warning signs:** If you try to access `mastery.confusions` inside LessonSummary without threading it through, you'll get undefined.

### Pitfall 4: Empty State for New Users
**What goes wrong:** On lesson 1, there are zero confusions, zero previous sessions, and no review dates. All three insight types will be empty.
**Why it happens:** The user hasn't generated any mastery data yet.
**How to avoid:** D-04 handles this: show nothing. All insight components must return null when their data is empty. The progress tab sections (D-09) similarly hide when empty.
**Warning signs:** "undefined" text appearing on lesson 1 summary.

### Pitfall 5: Date Display for Review Schedule
**What goes wrong:** Showing ISO dates like "2026-04-05" instead of human-readable "Tuesday" or "Tomorrow".
**Why it happens:** Entity `nextReview` stores YYYY-MM-DD strings.
**How to avoid:** Compute relative day labels: compare `nextReview` against `today` string. If equal -> "Today". If tomorrow -> "Tomorrow". Otherwise -> day name (Mon/Tue/etc) or "This week". Use `new Date(nextReview).toLocaleDateString('en-US', { weekday: 'long' })` for day names.
**Warning signs:** Raw date strings in the UI.

## Code Examples

### Example 1: Computing Post-Lesson Insights
```typescript
// src/engine/insights.ts
import { getTopConfusions } from './selectors';
import { parseEntityKey } from './mastery.js';
import { getLetter } from '../data/letters.js';

export interface LessonInsight {
  type: 'confusion' | 'review' | 'trend';
  message: string;
}

/**
 * Generate caring-teacher-tone insights from post-lesson mastery state.
 * Returns empty array if no interesting data exists (D-04).
 */
export function generatePostLessonInsights(
  mastery: { entities: Record<string, any>; confusions: Record<string, any> },
  lessonLetterIds: number[],
): LessonInsight[] {
  const insights: LessonInsight[] = [];
  const lessonEntityKeys = new Set(lessonLetterIds.map(id => `letter:${id}`));

  // 1. Confusion detection (D-03.1)
  const topConfusions = getTopConfusions(mastery.confusions, 10);
  for (const c of topConfusions) {
    // Parse "recognition:2->3" format
    const parts = c.key.split('->');
    if (parts.length !== 2) continue;
    const prefix = parts[0].split(':')[0];
    const leftRaw = parts[0].includes(':') ? parts[0].split(':').slice(1).join(':') : parts[0];
    const rightRaw = parts[1];

    if (prefix === 'harakat') continue; // Skip combos for now

    const leftId = parseInt(leftRaw, 10);
    const rightId = parseInt(rightRaw, 10);
    if (isNaN(leftId) || isNaN(rightId)) continue;

    // Only show if involves a letter from this lesson
    if (!lessonLetterIds.includes(leftId) && !lessonLetterIds.includes(rightId)) continue;

    const left = getLetter(leftId);
    const right = getLetter(rightId);
    if (!left || !right) continue;

    insights.push({
      type: 'confusion',
      message: `Tila noticed you mixed up ${left.name} and ${right.name} — we'll practice these together`,
    });
    break; // Show at most one confusion insight
  }

  // 2. Next review timing (D-03.2)
  for (const letterId of lessonLetterIds) {
    const entity = mastery.entities[`letter:${letterId}`];
    if (!entity?.nextReview) continue;
    const letter = getLetter(letterId);
    if (!letter) continue;

    const reviewDate = new Date(entity.nextReview);
    const dayName = reviewDate.toLocaleDateString('en-US', { weekday: 'long' });
    insights.push({
      type: 'review',
      message: `Review ${letter.name} on ${dayName}`,
    });
    break; // Show one review insight
  }

  return insights;
}
```

### Example 2: Querying Accuracy Trend from SQLite
```typescript
// Query to get per-entity accuracy for current vs previous lesson attempt
// This runs in the lesson screen, results passed as props to LessonSummary

const rows = await db.getAllAsync<{
  target_entity: string;
  correct: number;
  total: number;
  attempt_id: number;
}>(`
  SELECT 
    qa.target_entity,
    SUM(qa.correct) as correct,
    COUNT(*) as total,
    qa.attempt_id
  FROM question_attempts qa
  JOIN lesson_attempts la ON qa.attempt_id = la.id
  WHERE qa.target_entity IN (${letterIds.map(id => `'letter:${id}'`).join(',')})
  GROUP BY qa.attempt_id, qa.target_entity
  ORDER BY la.attempted_at DESC
`);
// Then compare the latest two attempt_ids per entity for trend
```

### Example 3: Review Schedule Grouping for Progress Tab
```typescript
// Group entities by review date relative to today
function groupReviewsByDay(
  entities: Record<string, { nextReview: string | null }>,
  today: string
): { today: string[]; tomorrow: string[]; thisWeek: string[] } {
  const tomorrow = addDateDays(today, 1);
  const weekEnd = addDateDays(today, 7);
  const groups = { today: [] as string[], tomorrow: [] as string[], thisWeek: [] as string[] };

  for (const [key, entity] of Object.entries(entities)) {
    if (!entity.nextReview) continue;
    if (entity.nextReview <= today) groups.today.push(key);
    else if (entity.nextReview === tomorrow) groups.tomorrow.push(key);
    else if (entity.nextReview <= weekEnd) groups.thisWeek.push(key);
  }
  return groups;
}
```

## Integration Analysis

### LessonSummary Integration (CONV-03)
The LessonSummary component at `src/components/LessonSummary.tsx` currently receives these props:
```typescript
interface LessonSummaryProps {
  lesson: any;
  results: { correct: number; total: number; questions: any[] };
  passed: boolean;
  accuracy: number;
  threshold?: number | null;
  goalCompleted?: boolean;
  reviewItemCount?: number;
  onContinue: () => void;
  onRetry: () => void;
  onBack?: () => void;
  onReview?: () => void;
  showTrialCTA?: boolean;
  onStartTrial?: () => void;
  onScholarship?: () => void;
}
```

**New props needed:** Add `insights?: LessonInsight[]` (pre-computed in `lesson/[id].tsx`). This keeps LessonSummary presentational.

**Insertion point:** The insight card goes below the existing score/mastery sections, before the action buttons. In the passed state, this is after the MasteryBreakdown and before the "Next Lesson" preview / action buttons.

### Progress Tab Integration (CONV-05)
The progress screen at `app/(tabs)/progress.tsx` already has access to `mastery` via `useProgress()`. The two new sections insert between the `StatsRow` section and the `PhasePanel` section (or between phases and the letter grid -- D-08 says ABOVE the letter grid).

**Current layout order:**
1. Header + StatsRow (animated)
2. Phase Progress (animated)
3. Letter Mastery Grid (animated)
4. Restore/Privacy/Reset buttons

**New layout order:**
1. Header + StatsRow
2. **"Letters You Mix Up" section** (new, animated)
3. **"Coming Up for Review" section** (new, animated)
4. Phase Progress
5. Letter Mastery Grid
6. Restore/Privacy/Reset buttons

### Data Flow
```
lesson/[id].tsx (has progress.mastery after completeLesson)
  -> compute insights via engine/insights.ts
  -> pass insights[] to LessonSummary
  -> LessonInsights component renders card

progress.tsx (has progress.mastery via useProgress())
  -> compute confusion pairs via getTopConfusions()
  -> compute review groups via entity nextReview fields
  -> ConfusionPairsSection renders pairs
  -> ReviewScheduleSection renders grouped schedule
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONV-03 | generatePostLessonInsights returns correct insights | unit | `npx vitest run src/__tests__/lesson-insights.test.ts -x` | Wave 0 |
| CONV-03 | generatePostLessonInsights returns [] for empty mastery | unit | `npx vitest run src/__tests__/lesson-insights.test.ts -x` | Wave 0 |
| CONV-03 | Confusion insight message uses caring tone with letter names | unit | `npx vitest run src/__tests__/lesson-insights.test.ts -x` | Wave 0 |
| CONV-05 | groupReviewsByDay correctly buckets today/tomorrow/this week | unit | `npx vitest run src/__tests__/review-schedule.test.ts -x` | Wave 0 |
| CONV-05 | getTopConfusions returns parsed confusion pairs with letter data | unit | `npx vitest run src/__tests__/confusion-pairs.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run validate`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/lesson-insights.test.ts` -- covers CONV-03 insight generation logic
- [ ] `src/__tests__/review-schedule.test.ts` -- covers CONV-05 review grouping logic
- [ ] No new test fixtures needed -- existing mastery data structures work

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mastery data invisible to user | Surface via insights + progress sections | This phase | Users understand engine value before paywall |
| LessonSummary shows only score | LessonSummary shows score + confusion/review/trend insights | This phase | Each lesson reinforces "Tila knows you" |
| Progress tab shows grid only | Progress tab shows actionable confusions + review schedule above grid | This phase | Users see their learning gaps and upcoming reviews |

## Open Questions

1. **Accuracy trend: current session vs which previous session?**
   - What we know: `question_attempts` stores per-question results with `attempt_id` FK to `lesson_attempts`. We can group by attempt to get per-session accuracy per entity.
   - What's unclear: Should we compare against (a) the most recent previous session that included this letter, or (b) the cumulative accuracy before this session? Option (a) is more dramatic but may not exist for first encounters. Option (b) always exists after the first session.
   - Recommendation: Compare against the cumulative accuracy before this session (option b). It always exists after attempt 2+. Formula: previous = `(entity.correct - sessionCorrect) / (entity.attempts - sessionTotal)`. This avoids a DB query -- compute purely from the current entity state and the session results. Falls back to showing nothing on first encounter (D-04).

2. **How many insights to show at most?**
   - What we know: D-03 defines three types. D-04 says conditional display.
   - What's unclear: If all three types have data, show all three? Or cap at 2 to keep it concise?
   - Recommendation: Show at most one per type, max 3 total. The caring teacher tone works best when it's focused, not overwhelming.

## Sources

### Primary (HIGH confidence)
- `src/engine/selectors.js` -- `getTopConfusions()`, `getDueEntityKeys()`, `planReviewSession()` verified line by line
- `src/engine/mastery.js` -- Entity structure, confusion key format, SRS intervals verified
- `src/components/LessonSummary.tsx` -- Current props interface, component structure, insertion points
- `app/(tabs)/progress.tsx` -- Current layout, data flow via `useProgress()`
- `src/hooks/useProgress.ts` -- ProgressState shape, completeLesson return value
- `src/db/schema.ts` -- `question_attempts` table schema for accuracy trend queries
- `src/engine/progress.ts` -- EntityState, ConfusionState interfaces
- `src/data/letters.js` -- `getLetter(id)` returns `{ letter, name, ... }`

### Secondary (MEDIUM confidence)
- Accuracy trend computation approach (option b: cumulative minus session) -- logic is sound but untested

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages, all existing
- Architecture: HIGH -- clear integration points identified, data flow mapped
- Pitfalls: HIGH -- verified against actual code, not assumptions

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable -- no moving targets)
