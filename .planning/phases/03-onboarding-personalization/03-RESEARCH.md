# Phase 3: Onboarding & Personalization - Research

**Researched:** 2026-04-01
**Domain:** React Native onboarding UX, SQLite migrations, component composition
**Confidence:** HIGH

## Summary

This phase adds three features: (1) a combined name + motivation onboarding step, (2) personalized home screen greeting, and (3) a wird explanation tooltip. All three are well-scoped UI + data layer changes with minimal risk. The existing codebase provides strong patterns to follow -- the onboarding flow has a clean draft state pattern, the DB migration system uses PRAGMA checks, and the profile save pipeline already handles motivation.

The key insight is that no new libraries or architectural changes are needed. Every requirement can be met by extending existing patterns: adding a step component, extending the OnboardingDraft type, adding a DB migration for the `name` column, and modifying the home screen greeting renderer.

**Primary recommendation:** Follow existing onboarding step patterns exactly (StartingPoint.tsx as template), reuse `wird_intro_seen` flag for the tooltip, and keep the DB migration minimal (single `name` column addition).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Combined name input (optional) + motivation picker (5 options) in ONE new onboarding step
- D-02: Step placed after LetterQuiz (step 8), before Finish (step 9). Current Finish moves from step 8 to step 9. TOTAL_STEPS becomes 10.
- D-03: Name is optional, motivation picker should have default or skip option
- D-04: DB migration adds `name` column to `user_profile` table. `motivation` column already exists.
- D-05: Follow existing draft state pattern -- add `userName` and `motivation` to OnboardingDraft, save via updateProfile() in handleFinish
- D-06: Greeting WITH name: "ASSALAMU ALAIKUM, [NAME]" + motivation subtitle
- D-07: Greeting WITHOUT name: "ASSALAMU ALAIKUM" + motivation subtitle
- D-08: Greeting WITHOUT motivation: "ASSALAMU ALAIKUM" + current dynamic subtitle
- D-09: Motivation-to-subtitle mapping (5 values, exact strings provided)
- D-10: Location: `app/(tabs)/index.tsx` lines 473-478
- D-11: Auto tooltip on first streak badge appearance on home screen
- D-12: Tap to dismiss, one-time, tracked via flag in user_profile
- D-13: Tooltip content: "In Islamic tradition, a wird is a daily practice -- a small, consistent effort. Your learning wird builds day by day."
- D-14: Visual style: warm cream background, dark green text, subtle shadow, positioned near AnimatedStreakBadge

### Claude's Discretion
- Exact tooltip visual design (card shape, arrow, animation)
- Name + motivation step UI layout (cards, form, split-screen)
- DB migration version number
- Test approach

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONV-01 | Optional name input added to onboarding flow, stored in user profile | OnboardingDraft pattern documented, DB migration pattern established, StartingPoint.tsx provides template for data-collecting steps |
| CONV-02 | Wird concept explained on first encounter via one-time tooltip/explanation | `wird_intro_seen` flag already exists in schema and ProgressState; AnimatedStreakBadge component identified as tooltip anchor |
| CONV-04 | Home screen greeting personalized with user name and motivation | `onboardingMotivation` already loaded in ProgressState; greeting section at lines 471-478 identified; `getGreetingSubtitle` function ready to extend |
</phase_requirements>

## Standard Stack

No new packages needed. All requirements are met with the existing stack.

### Core (Existing -- No Changes)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-sqlite | 55.0.11 | User profile storage (name, motivation, flags) | Already used for all persistence |
| react-native-reanimated | 4.2.1 | Step transitions, tooltip entrance animation | Already used in onboarding and home |
| React Native TextInput | 0.83.2 | Name input field | Built-in, no extra dependency needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Native TextInput | react-native-paper or custom | Over-engineering for a single optional field |
| Manual tooltip | react-native-tooltip, @gorhom/portal | Adds dependency for a one-time tooltip; inline View is simpler |

## Architecture Patterns

### New Onboarding Step Component

Follow the exact pattern from `StartingPoint.tsx`:

```typescript
// src/components/onboarding/steps/NameMotivation.tsx
// Pattern: receive onNext prop, render with OnboardingStepLayout, call onNext() to advance
export function NameMotivation({
  userName,
  motivation,
  onChangeName,
  onSelectMotivation,
  onNext,
}: {
  userName: string;
  motivation: string | null;
  onChangeName: (value: string) => void;
  onSelectMotivation: (value: string) => void;
  onNext: () => void;
}) {
  // Use OnboardingStepLayout variant="card"
  // TextInput for name (optional)
  // OptionCard list for motivation (reuse pattern from StartingPoint.tsx)
  // Continue button always enabled (name is optional, motivation can default)
}
```

### OnboardingFlow Integration Points

1. **TOTAL_STEPS**: 9 -> 10
2. **STEP constant**: Add `NAME_MOTIVATION: 8`, shift `FINISH: 8` -> `FINISH: 9`
3. **STEP_NAMES**: Add `'name_motivation'` at index 8, `'finish'` moves to index 9
4. **Draft state**: Extend with `userName: string` and `motivation: string | null`
5. **handleFinish**: Add `name: draft.userName` and `motivation: draft.motivation` to `updateProfile()` call
6. **Render**: Add step rendering between LETTER_QUIZ and FINISH

### Draft State Extension

```typescript
// src/types/onboarding.ts
export interface OnboardingDraft {
  startingPoint: 'new' | 'some_arabic' | 'rusty' | 'can_read' | null;
  userName: string;
  motivation: 'read_quran' | 'pray_confidently' | 'connect_heritage' | 'teach_children' | 'personal_growth' | null;
}
```

Initial draft state: `{ startingPoint: null, userName: '', motivation: null }`

### DB Migration Pattern (v6)

```typescript
// In src/db/client.ts, inside runMigrations()
if (currentVersion < 6) {
  const profileInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(user_profile)"
  );
  const hasName = profileInfo.some((col) => col.name === "name");
  if (!hasName) {
    await db.execAsync(
      "ALTER TABLE user_profile ADD COLUMN name TEXT;"
    );
  }
  await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (6)");
}
```

Also update `SCHEMA_VERSION` from 5 to 6 in `schema.ts` and add `name TEXT` column to `CREATE_TABLES`.

### Home Screen Greeting Modification

Current flow: `getGreetingSubtitle()` returns a dynamic string based on lesson count.

New flow:
1. Read `progress.onboardingMotivation` and a new `progress.userName` (requires adding to ProgressState)
2. If motivation exists, use motivation-to-subtitle mapping instead of `getGreetingSubtitle()`
3. If name exists, append to "ASSALAMU ALAIKUM"
4. Fall back gracefully at each level

```typescript
const MOTIVATION_SUBTITLES: Record<string, string> = {
  read_quran: "Reading toward the Quran",
  pray_confidently: "Building toward confident salah",
  connect_heritage: "Connecting to your heritage",
  teach_children: "Learning to teach your children",
  personal_growth: "Growing in your faith",
};

// In HomeScreen:
const userName = progress.userName ?? null;
const motivation = progress.onboardingMotivation ?? null;

const greetingLine1 = userName
  ? `ASSALAMU ALAIKUM, ${userName.toUpperCase()}`
  : "ASSALAMU ALAIKUM";

const greetingLine2 = motivation && MOTIVATION_SUBTITLES[motivation]
  ? MOTIVATION_SUBTITLES[motivation]
  : getGreetingSubtitle(lessonsCompleted, learnedLetterIds.length);
```

### Wird Tooltip Pattern

The `wird_intro_seen` flag already exists in the schema and is loaded via `progress.wirdIntroSeen`. The full wird-intro screen (`app/wird-intro.tsx`) sets this flag. The tooltip should reuse this same flag:

- If `wirdIntroSeen` is false AND `currentWird > 0` (streak badge visible), show tooltip
- On tap dismiss, call `updateProfile({ wirdIntroSeen: true })`
- This ensures users who already saw the full wird-intro screen don't see the tooltip again

The tooltip should be a simple absolutely-positioned View near the AnimatedStreakBadge, with a FadeIn entrance animation and tap-to-dismiss.

### Anti-Patterns to Avoid
- **Don't create a separate wird_explanation_seen flag** -- reuse the existing `wird_intro_seen` which already tracks wird concept awareness
- **Don't make name required** -- the onboarding must work with empty name (D-03)
- **Don't change the motivation column or its CHECK constraint** -- it already exists with the correct values
- **Don't modify LetterQuiz or earlier steps** -- only add the new step and update constants

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tooltip positioning | Custom measurement/portal system | Absolute-positioned View near badge | One-time tooltip doesn't justify a positioning library |
| Form validation | Custom validation framework | Simple string length check | Name is optional, motivation has fixed options |
| Text capitalization | Manual string transforms | CSS/style textTransform or `.toUpperCase()` | Built-in and consistent |

## Common Pitfalls

### Pitfall 1: STEP Index Shift Breaking Analytics
**What goes wrong:** Inserting a new step at index 8 shifts FINISH from 8 to 9. Any hardcoded step index references in analytics or conditions break.
**Why it happens:** The codebase already has a TODO comment about this (line 66 of OnboardingFlow.tsx).
**How to avoid:** Use STEP.* constants everywhere, never raw numbers. The existing code already uses STEP constants for all conditions. Verify `showProgressBar` condition still works after the shift.
**Warning signs:** Analytics events showing wrong step names.

### Pitfall 2: TextInput Keyboard Covering Content
**What goes wrong:** On Android, the keyboard pushes or covers the motivation picker below the name input.
**Why it happens:** ScrollView + keyboard interaction in React Native is notoriously tricky.
**How to avoid:** The step already renders inside a ScrollView (OnboardingFlow wraps all steps in ScrollView). Ensure `keyboardShouldPersistTaps="handled"` and consider `KeyboardAvoidingView` if needed. Test on both platforms.
**Warning signs:** Content hidden behind keyboard on Android.

### Pitfall 3: Empty Name Stored as Empty String vs Null
**What goes wrong:** An empty TextInput stores `""` instead of `null`, causing the greeting to show "ASSALAMU ALAIKUM, " (with trailing comma-space).
**Why it happens:** TextInput value is always a string, never null.
**How to avoid:** In `handleFinish`, convert empty string to null: `name: draft.userName.trim() || null`. In the greeting, check `userName` truthiness (empty string is falsy).
**Warning signs:** Greeting shows comma with no name after it.

### Pitfall 4: Migration Not Running for Fresh Installs
**What goes wrong:** Fresh installs use `CREATE_TABLES` which doesn't have the `name` column, and migration v6 doesn't run because schema version is stamped at 6.
**Why it happens:** `CREATE_TABLES` is the source of truth for fresh installs; migrations only run for existing databases.
**How to avoid:** Add `name TEXT` to the `CREATE_TABLES` string in `schema.ts` AND add migration v6 in `client.ts`. Both must be updated.
**Warning signs:** Name not saved on fresh installs, works on upgrades.

### Pitfall 5: Progress Bar Visibility Logic
**What goes wrong:** The new NAME_MOTIVATION step might not show the progress bar, or the progress bar ratio looks wrong.
**Why it happens:** `showProgressBar` has explicit exclusions for certain steps. TOTAL_STEPS affects the progress bar ratio.
**How to avoid:** The NAME_MOTIVATION step should show the progress bar (it's a data-collection step like StartingPoint). Update TOTAL_STEPS to 10 and verify `showProgressBar` doesn't accidentally exclude the new step index.
**Warning signs:** Progress bar missing or showing wrong progress on the new step.

### Pitfall 6: Tooltip Showing on Every Home Screen Visit
**What goes wrong:** The wird tooltip re-appears every time the user returns to the home screen.
**Why it happens:** Flag not persisted before tooltip dismissed, or state not refreshed after updateProfile.
**How to avoid:** Call `updateProfile({ wirdIntroSeen: true })` on dismiss, then refresh progress state. Use local state to immediately hide the tooltip without waiting for DB round-trip.
**Warning signs:** Users see the tooltip repeatedly.

## Code Examples

### Example 1: Existing Step Pattern (from StartingPoint.tsx)

```typescript
// All onboarding steps follow this contract:
// - Receive onNext callback
// - Use OnboardingStepLayout for consistent layout
// - Use FadeIn/FadeInDown animations for staggered content reveal
// - Button in footer via OnboardingStepLayout's footer prop

export function StepName({
  onNext,
  // ...data props
}: {
  onNext: () => void;
}) {
  const colors = useColors();
  return (
    <OnboardingStepLayout
      variant="card"
      fadeInDuration={STAGGER_DURATION}
      footer={<Button title="Continue" onPress={onNext} />}
    >
      {/* Content */}
    </OnboardingStepLayout>
  );
}
```

### Example 2: DB Migration Pattern (from client.ts v4)

```typescript
if (currentVersion < 4) {
  const profileInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(user_profile)"
  );
  const hasColumn = profileInfo.some((col) => col.name === "analytics_consent");
  if (!hasColumn) {
    await db.execAsync(
      "ALTER TABLE user_profile ADD COLUMN analytics_consent INTEGER CHECK (...);"
    );
  }
  await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (4)");
}
```

### Example 3: Draft State Pattern (from OnboardingFlow.tsx)

```typescript
const [draft, setDraft] = useState<OnboardingDraft>({ startingPoint: null });

// In step rendering:
<StartingPoint
  startingPoint={draft.startingPoint}
  onSelectStartingPoint={(value) =>
    setDraft((d) => ({ ...d, startingPoint: value }))
  }
  onNext={goNext}
/>

// In handleFinish:
await updateProfile({
  onboarded: true,
  startingPoint: draft.startingPoint,
  // ...
});
```

### Example 4: Profile Save Pipeline (from progress.ts)

```typescript
// UserProfileUpdate already supports motivation. Need to add name.
export interface UserProfileUpdate {
  // existing fields...
  motivation?: string | null;
  // add:
  name?: string | null;
}

// In saveUserProfile(), add:
if (profile.name !== undefined) {
  sets.push('name = ?');
  values.push(profile.name);
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts (inferred from package.json) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONV-01a | OnboardingDraft type includes userName and motivation | unit | `npx vitest run src/__tests__/onboarding-flow.test.ts -x` | Exists (needs update) |
| CONV-01b | TOTAL_STEPS equals 10, STEP has NAME_MOTIVATION entry | unit | `npx vitest run src/__tests__/onboarding-flow.test.ts -x` | Exists (needs update) |
| CONV-01c | handleFinish passes name and motivation to updateProfile | unit | `npx vitest run src/__tests__/onboarding-flow.test.ts -x` | Exists (needs update) |
| CONV-01d | Schema includes name column, migration v6 adds it | unit | `npx vitest run src/__tests__/schema-v6.test.ts -x` | Wave 0 |
| CONV-02a | Wird tooltip shows when wirdIntroSeen=false and currentWird>0 | unit | `npx vitest run src/__tests__/wird-tooltip.test.ts -x` | Wave 0 |
| CONV-02b | Wird tooltip sets wirdIntroSeen=true on dismiss | unit | `npx vitest run src/__tests__/wird-tooltip.test.ts -x` | Wave 0 |
| CONV-04a | Motivation-to-subtitle mapping covers all 5 values | unit | `npx vitest run src/__tests__/motivation-mapping.test.ts -x` | Exists (needs label update) |
| CONV-04b | Greeting shows name when available, omits when not | unit | `npx vitest run src/__tests__/home-greeting.test.ts -x` | Wave 0 |
| CONV-04c | Greeting falls back to dynamic subtitle when no motivation | unit | `npx vitest run src/__tests__/home-greeting.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run validate`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/schema-v6.test.ts` -- covers CONV-01d (migration adds name column)
- [ ] `src/__tests__/wird-tooltip.test.ts` -- covers CONV-02a, CONV-02b (tooltip show/dismiss logic)
- [ ] `src/__tests__/home-greeting.test.ts` -- covers CONV-04b, CONV-04c (personalized greeting logic)
- [ ] Update `src/__tests__/onboarding-flow.test.ts` -- update TOTAL_STEPS assertion to 10
- [ ] Update `src/__tests__/motivation-mapping.test.ts` -- update display labels to match D-09 subtitles

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full-screen wird intro as only explanation | Tooltip + full intro as dual paths | This phase | Users get contextual wird explanation at first streak badge |
| Generic "ASSALAMU ALAIKUM" greeting | Personalized with name + motivation | This phase | Warmer first impression, higher perceived value |

## Open Questions

1. **Keyboard handling on the name input step**
   - What we know: OnboardingFlow wraps content in ScrollView. Android keyboard behavior varies.
   - What's unclear: Whether the existing ScrollView setup handles keyboard appearance gracefully.
   - Recommendation: Test on Android during implementation. Add `keyboardShouldPersistTaps="handled"` to the ScrollView if not already present. Wrap in KeyboardAvoidingView if needed.

2. **Motivation display labels vs stored values**
   - What we know: CONTEXT.md D-09 provides subtitle strings. The existing `motivation-mapping.test.ts` has different display labels.
   - What's unclear: Whether the motivation picker should show the D-09 subtitle strings or different aspirational labels.
   - Recommendation: Use the D-09 subtitle strings as picker labels per the Specifics section ("Use the subtitle phrasing from D-09 as the option labels"). Update the test accordingly.

3. **Tooltip arrow/pointer design**
   - What we know: D-14 specifies warm cream background, dark green text, subtle shadow, positioned near badge.
   - What's unclear: Whether to include an arrow pointing to the badge.
   - Recommendation: Simple card below the badge area, no arrow. Arrows are fiddly in React Native and add complexity for a one-time tooltip. Claude's discretion per CONTEXT.md.

## Sources

### Primary (HIGH confidence)
- `src/components/onboarding/OnboardingFlow.tsx` -- onboarding flow architecture, step constants, draft state pattern
- `src/components/onboarding/steps/StartingPoint.tsx` -- data-collecting step template
- `src/db/schema.ts` -- user_profile table schema, existing columns including motivation
- `src/db/client.ts` -- migration pattern (PRAGMA table_info checks), version tracking
- `src/engine/progress.ts` -- ProgressState shape, loadProgress query, saveUserProfile pipeline
- `app/(tabs)/index.tsx` -- home screen greeting rendering, AnimatedStreakBadge usage
- `src/components/home/AnimatedStreakBadge.tsx` -- streak badge component structure
- `src/types/onboarding.ts` -- OnboardingDraft type definition

### Secondary (MEDIUM confidence)
- `app/wird-intro.tsx` -- existing wird intro flow, confirms `wirdIntroSeen` flag usage
- `app/post-lesson-onboard.tsx` -- wird intro trigger flow

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages, all existing patterns verified in codebase
- Architecture: HIGH -- every integration point inspected, patterns clear and consistent
- Pitfalls: HIGH -- identified from direct code inspection (keyboard, empty string, migration dual-path)

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable -- no dependency changes expected)
