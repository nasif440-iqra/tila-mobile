# Phase 5: Celebrations & Feedback - Research

**Researched:** 2026-03-28
**Domain:** React Native animations, haptics, tiered celebration UX, Islamic messaging
**Confidence:** HIGH

## Summary

Phase 5 completes the celebration system by adding two new celebration tiers (letter mastery and enhanced phase completion) and expanding Islamic encouragement throughout the copy pools. Phase 4 already delivered the micro tier (QuizOption sparkle + haptic) and small tier (LessonSummary WarmGlow + tiered haptics + QuizCelebration). The remaining work is: (1) a letter mastery celebration when entities reach "retained" state, (2) enhancing the phase-complete screen with milestone-tier visuals, and (3) auditing/expanding engagement.js copy with Islamic phrases.

A critical discovery: the mastery engine (`mergeQuizResultsIntoMastery`) exists but is **never called from the app's lesson flow**. The `useMastery` hook exists with `updateEntity/updateSkill/updateConfusion` functions but is never imported anywhere. The lesson flow saves quiz results via `useProgress.completeLesson` which writes to `lesson_attempts` and `question_attempts` tables, but does NOT update `mastery_entities` with SRS data. This means `deriveMasteryState` will never return "retained" for any entity because entity data is never written. This is a prerequisite blocker that Phase 5 must resolve before letter mastery celebrations can trigger.

**Primary recommendation:** Wire up mastery tracking in the lesson completion flow first (Wave 1), then build letter mastery and phase completion celebrations on top of the working mastery pipeline, and audit/expand Islamic copy pools as a parallel concern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Four tiers, each visually distinct: micro (correct answer sparkle -- already exists via QuizOption), small (lesson complete -- LessonSummary WarmGlow tiers from Phase 4), big (letter mastered), milestone (phase complete).
- D-02: Each tier escalates in visual intensity and haptic strength -- micro is subtle, milestone is the peak.
- D-03: Celebrations should be elegant but restrained -- consistent with the "quiet confidence" direction. No fireworks or over-the-top animations.
- D-04: When a letter reaches "retained" mastery state, it should get a special celebration -- noticeably more impactful than a correct answer but not as grand as a phase completion.
- D-05: The celebration should acknowledge the achievement with Islamic warmth -- something like "MashaAllah! You've mastered [letter name]."
- D-06: Phase completion (all lessons in a phase done) triggers the biggest celebration -- this should feel like a genuine achievement.
- D-07: The `app/phase-complete.tsx` screen already exists -- it should be elevated with the milestone tier animation.
- D-08: Replace all generic encouragement text with warm Islamic phrases across the app. Use Bismillah, MashaAllah, Alhamdulillah, SubhanAllah contextually appropriate.
- D-09: Existing engagement.js copy pools should be audited and expanded with Islamic phrases where they don't already have them.
- D-10: Use Phase 1's shared animation presets -- no new magic numbers.
- D-11: Haptics: micro=hapticTap, small=hapticSuccess, big=hapticMilestone, milestone=hapticMilestone (with visual escalation).

### Claude's Discretion
- Specific animation for letter mastery celebration (scale burst? WarmGlow pulse? gold shimmer?)
- Phase completion screen visual enhancement approach
- Whether to create a shared CelebrationOverlay component or handle per-context
- Which engagement.js copy pools need Islamic phrase additions
- How to detect and trigger letter mastery celebration in the quiz flow
- Whether to add a toast/banner system or use full-screen overlays
- How to wire up mastery tracking (prerequisite discovery)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CEL-01 | Tiered celebration system -- small wins get subtle warmth, big wins get genuine excitement | Four tiers mapped: micro (QuizOption, exists), small (LessonSummary, exists), big (LetterMasteryCelebration, new), milestone (phase-complete enhancement, new). Haptic mapping defined in D-11. |
| CEL-02 | Lesson completion celebration with animated visual effect (confetti, particles, or burst) | LessonSummary already has WarmGlow + tiered haptics from Phase 4. This requirement is substantially met. May need minor enhancements. |
| CEL-03 | Letter mastery celebration is a bigger deal than a single correct answer | Requires wiring mastery pipeline (currently broken), then building LetterMasteryCelebration component with WarmGlow + hapticMilestone + Islamic message. |
| CEL-04 | Phase completion gets a special milestone celebration | phase-complete.tsx exists with basic FadeIn stagger. Needs WarmGlow, hapticMilestone, and elevated visuals. |
| CEL-05 | Warm Islamic encouragement messages replace generic "Great job!" text | engagement.js audit: CORRECT_COPY, WRONG_ENCOURAGEMENT, STREAK_COPY, MID_CELEBRATE_COPY need Islamic phrases. CLOSING_QUOTES already has Islamic content. |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | 4.3.0 | All celebration animations | Already used throughout; springs/timing API covers all needs |
| expo-haptics | 55.0.10 | Haptic feedback tiers | Already installed and wrapped in src/design/haptics.ts |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| WarmGlow component | n/a | Ambient glow effect | Letter mastery and phase completion celebrations |
| expo-audio | installed | Completion SFX | Already used in LessonSummary; can add mastery SFX |

### Not Needed
| Instead of | Why Not |
|------------|---------|
| Lottie | STATE.md flagged "limited runtime color theming." All celebration visuals achievable with Reanimated + WarmGlow. Avoids new dependency. |
| react-native-skia | Deferred to v2 per project decisions. |
| Confetti libraries (react-native-confetti-cannon, etc.) | D-03 says "elegant but restrained, no fireworks." WarmGlow + scale animations fit the "quiet confidence" direction. |

## Architecture Patterns

### Mastery Pipeline (Must Wire Up)

The critical missing piece. Current state:

```
Quiz completes -> handleQuizComplete() -> progress.completeLesson()
  -> saveCompletedLesson (lesson_attempts table)
  -> saveQuestionAttempts (question_attempts table)
  -> refresh() (reloads progress state)
  // MISSING: mastery entity/skill/confusion updates
```

Required pipeline:

```
Quiz completes -> handleQuizComplete()
  -> progress.completeLesson() (existing)
  -> mergeQuizResultsIntoMastery() (engine, exists but unused)
  -> save updated entities via useMastery (hook exists but unused)
  -> compare pre/post mastery states per entity
  -> if any entity reached "retained" -> trigger letter mastery celebration
  -> continue to summary screen
```

### Letter Mastery Detection Pattern

```typescript
// In lesson completion flow (app/lesson/[id].tsx or a new hook)
import { deriveMasteryState } from '../engine/mastery';

// Before merge
const preMasteryStates = new Map();
for (const [key, entity] of Object.entries(mastery.entities)) {
  preMasteryStates.set(key, deriveMasteryState(entity, today));
}

// After merge
const newMastery = mergeQuizResultsIntoMastery(mastery, quizResults, today);
const newlyMastered: string[] = [];
for (const [key, entity] of Object.entries(newMastery.entities)) {
  const oldState = preMasteryStates.get(key) ?? 'introduced';
  const newState = deriveMasteryState(entity, today);
  if (newState === 'retained' && oldState !== 'retained') {
    newlyMastered.push(key); // e.g., "letter:2"
  }
}
```

### Celebration Overlay Approach

**Recommendation: Per-context component, not a shared CelebrationOverlay.**

Reasoning:
- Letter mastery celebration appears in the quiz flow (between quiz end and summary)
- Phase completion celebration is a full-screen route
- These have different lifecycles, different data needs, different dismissal patterns
- A shared overlay adds abstraction without reducing code -- each celebration is ~40-60 lines

### Component Structure

```
src/components/celebrations/
  LetterMasteryCelebration.tsx  -- big tier, shown after quiz when letter hits retained
```

The phase-complete.tsx screen is enhanced in-place (it already exists as a route).

### Letter Mastery Celebration Design

**Recommendation: Full-screen overlay with WarmGlow + scale entrance + letter display.**

```
[Full-screen overlay, bg with 90% opacity]
  [WarmGlow size=180, animated, gold]
  [Arabic letter, large, gold accent color]
  [Letter name: "Ba"]
  ["MashaAllah! You've mastered Ba." in warm Islamic copy]
  [Tap to continue]
```

Animation: FadeIn overlay -> WarmGlow pulse starts -> letter scales from 0.8 to 1.0 with springs.bouncy -> text fades in staggered. hapticMilestone on mount. Duration ~2 seconds before tap-to-dismiss is active.

### Phase Complete Enhancement

The existing `phase-complete.tsx` uses FadeIn/FadeInDown stagger. Enhancement approach:

1. Add WarmGlow behind the Arabic centerpiece (Alhamdulillah text)
2. Add hapticMilestone on mount
3. Increase stagger delays slightly for more dramatic pacing
4. Add subtle scale entrance to the Arabic text (springs.gentle)
5. Keep existing structure -- no redesign needed, just elevation

### Islamic Copy Pool Audit

Current state of engagement.js pools:

| Pool | Has Islamic Content | Needs Work |
|------|-------------------|------------|
| CORRECT_COPY.recognition | No -- generic ("That's right", "You got it") | Add MashaAllah variants |
| CORRECT_COPY.sound | No -- generic ("Good ear", "Right match") | Add Islamic warmth |
| CORRECT_COPY.harakat | No -- generic ("You read that") | Add Islamic warmth |
| WRONG_ENCOURAGEMENT | No -- generic but respectful | Add gentle encouragement with Islamic framing |
| STREAK_COPY | No -- generic ("Building momentum") | Light Islamic additions |
| MID_CELEBRATE_COPY | No -- generic ("Steady progress") | Add Islamic warmth |
| COMPLETION_HEADLINES | No -- generic ("Flawless.", "Well done.") | Add Islamic celebration words |
| COMPLETION_SUBLINES | Partially -- "You've taken the first step in reading Quran" | Expand Islamic references |
| CLOSING_QUOTES | Yes -- all Islamic/hadith content | Already done, no changes needed |
| CONTINUATION_COPY | No -- generic | Light additions |
| UNLOCK_COPY | No -- generic | Light additions |

**Approach for D-08/D-09:** Do NOT replace all copy. Mix Islamic phrases into existing pools so they rotate naturally. Example: add "MashaAllah -- you got it." alongside "That's right." This keeps variety and prevents Islamic phrases from feeling forced by overuse.

**New copy pool needed:** LETTER_MASTERY_COPY for the letter mastery celebration messages.

```javascript
export const LETTER_MASTERY_COPY = [
  "MashaAllah! You've truly learned {letter}.",
  "Alhamdulillah -- {letter} is now part of your reading.",
  "MashaAllah -- you've mastered {letter}.",
  "SubhanAllah, look how far you've come with {letter}.",
  "{letter} is yours now. MashaAllah.",
];
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Haptic feedback | Custom vibration patterns | expo-haptics preset tiers (hapticTap/Success/Milestone) | Already standardized in haptics.ts |
| Ambient glow | RadialGradient or shadow tricks | WarmGlow component | Already built, tested, parameterized |
| Animation timing | Raw ms values | springs/durations/easings from animations.ts | D-10 requirement |
| Confetti/particles | Custom particle system | WarmGlow + scale animations | D-03: elegant/restrained, no fireworks |
| Mastery state derivation | Ad-hoc accuracy checks | deriveMasteryState() from mastery.js | Already handles all edge cases (min attempts, accuracy threshold, SRS interval) |
| Copy rotation | Math.random inline | pickCopy() from engagement.js | Already handles random selection |

## Common Pitfalls

### Pitfall 1: Mastery Pipeline Not Wired
**What goes wrong:** Letter mastery celebrations never trigger because mastery_entities table is never updated after quizzes.
**Why it happens:** The engine (`mergeQuizResultsIntoMastery`) was built but never integrated into the lesson completion flow. `useMastery` hook exists but is unused.
**How to avoid:** Wire up mastery tracking FIRST (Wave 1) before building any celebrations that depend on mastery state.
**Warning signs:** `deriveMasteryState` always returns "introduced" for all entities.

### Pitfall 2: "Retained" State Is Hard to Reach
**What goes wrong:** Letter mastery celebration is built but never seen in testing because reaching "retained" requires streak >= 3 AND intervalDays > 7 (effectively streak 4 with current SRS intervals).
**Why it happens:** The mastery engine has intentionally high bars to prevent cramming.
**How to avoid:** Build celebrations against the correct threshold. For testing, either: (a) use a test helper that creates a mock entity at retained state, or (b) temporarily lower thresholds. NOTE: In real use, "retained" takes multiple sessions across multiple days -- celebrations must work for this rare, genuine achievement.
**Warning signs:** Celebration code exists but 0% test coverage of the actual trigger path.

### Pitfall 3: Over-celebration
**What goes wrong:** Celebrations feel spammy because they trigger too frequently or are too visually intense.
**Why it happens:** Letter mastery can theoretically trigger for multiple letters in one lesson.
**How to avoid:** If multiple letters reach retained in one session, show ONE celebration with all mastered letters listed. Never stack overlays. Keep big-tier celebration to ~2s max with tap-to-dismiss.
**Warning signs:** User frustration with repeated interruptions.

### Pitfall 4: Islamic Phrase Overuse
**What goes wrong:** "MashaAllah" on every correct answer makes it feel mechanical, not meaningful.
**Why it happens:** Adding Islamic phrases to every copy pool without proportion.
**How to avoid:** Islamic phrases should be ~30-40% of CORRECT_COPY pools (rotated naturally), but 100% of LETTER_MASTERY_COPY and CLOSING_QUOTES. Reserve the strongest Islamic praise for the biggest moments.
**Warning signs:** Every interaction says "MashaAllah" -- dilutes meaning.

### Pitfall 5: Phase Completion Detection Race
**What goes wrong:** Phase completion celebration doesn't trigger because the check in `handleContinue` reads stale completedLessonIds.
**Why it happens:** The existing code in `lesson/[id].tsx` compares `preCompletedRef.current` vs `progress.completedLessonIds` after `refresh()`. This pattern works but is timing-sensitive.
**How to avoid:** The existing detection pattern is correct (lines 145-155 of lesson/[id].tsx). Don't change it -- just ensure the phase-complete route receives enhanced visuals.
**Warning signs:** Phase completion navigation works but celebrations don't appear.

## Code Examples

### Mastery State Detection After Quiz

```typescript
// Source: mastery.js deriveMasteryState + mergeQuizResultsIntoMastery
import { mergeQuizResultsIntoMastery, deriveMasteryState } from '../engine/mastery';
import { normalizeEntityKey } from '../engine/mastery';

function detectNewlyMasteredLetters(
  preMastery: Record<string, any>,
  quizResults: any[],
  today: string
): string[] {
  // Snapshot pre-states
  const preStates = new Map<string, string>();
  for (const [key, entity] of Object.entries(preMastery.entities)) {
    preStates.set(key, deriveMasteryState(entity, today));
  }

  // Merge results
  const postMastery = mergeQuizResultsIntoMastery(preMastery, quizResults, today);

  // Compare
  const newlyMastered: string[] = [];
  for (const [key, entity] of Object.entries(postMastery.entities)) {
    const oldState = preStates.get(key) ?? 'introduced';
    const newState = deriveMasteryState(entity as any, today);
    if (newState === 'retained' && oldState !== 'retained') {
      newlyMastered.push(key);
    }
  }

  return newlyMastered;
}
```

### Letter Mastery Celebration Component Pattern

```typescript
// Based on existing QuizCelebration.tsx + WarmGlow patterns
import { WarmGlow } from '../onboarding/WarmGlow';
import { hapticMilestone } from '../../design/haptics';
import { springs } from '../../design/animations';

// Component receives: masteredLetters: Array<{letter: string, name: string}>
// Shows: WarmGlow(size=180) + Arabic letter + "MashaAllah..." message
// Haptic: hapticMilestone() on mount
// Animation: FadeIn + scale 0.9->1.0 via springs.bouncy
// Dismiss: tap anywhere after 500ms delay
```

### Phase Complete Enhancement Pattern

```typescript
// Enhance existing phase-complete.tsx
// Add WarmGlow behind Arabic centerpiece:
<View style={{ alignItems: 'center', justifyContent: 'center' }}>
  <WarmGlow size={200} animated color="rgba(196,164,100,0.25)" pulseMin={0.06} pulseMax={0.18} />
  <ArabicText ...>{"\u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647"}</ArabicText>
</View>

// Add hapticMilestone in useEffect on mount
// Wrap arabicWrap in scale animation: springs.gentle from 0.92 -> 1.0
```

### Islamic Copy Addition Pattern

```javascript
// engagement.js -- add Islamic variants mixed into existing pools
export const CORRECT_COPY = {
  recognition: [
    "That's right.",
    "You got it.",
    "Correct.",
    "MashaAllah, that's right.",        // Islamic addition
    "Well spotted.",
    "Exactly right.",
    "MashaAllah -- you see it clearly.", // Islamic addition
    "Good eye.",
    "That's the one.",
    "Clear and correct.",
  ],
  // ... similar for sound and harakat
};
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CEL-01 | Tiered celebration system (4 tiers with escalating visuals/haptics) | unit (source audit) | `npm test -- --run src/__tests__/celebration-tiers.test.ts` | No -- Wave 0 |
| CEL-02 | Lesson completion celebration (already exists from Phase 4) | unit (source audit) | `npm test -- --run src/__tests__/lesson-summary.test.ts` | Yes -- existing |
| CEL-03 | Letter mastery celebration triggers on retained state | unit (engine + source audit) | `npm test -- --run src/__tests__/letter-mastery-celebration.test.ts` | No -- Wave 0 |
| CEL-04 | Phase completion milestone celebration | unit (source audit) | `npm test -- --run src/__tests__/phase-complete-celebration.test.ts` | No -- Wave 0 |
| CEL-05 | Islamic encouragement messages in copy pools | unit (content audit) | `npm test -- --run src/__tests__/islamic-copy.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/celebration-tiers.test.ts` -- covers CEL-01 (source audit: 4 tiers, haptic mapping)
- [ ] `src/__tests__/letter-mastery-celebration.test.ts` -- covers CEL-03 (source audit: LetterMasteryCelebration component)
- [ ] `src/__tests__/phase-complete-celebration.test.ts` -- covers CEL-04 (source audit: WarmGlow + haptic in phase-complete)
- [ ] `src/__tests__/islamic-copy.test.ts` -- covers CEL-05 (content: Islamic phrases present in pools)
- [ ] `src/__tests__/mastery-pipeline.test.ts` -- covers mastery wiring prerequisite (engine: mergeQuizResults integration)

## Open Questions

1. **Mastery pipeline: where to wire it**
   - What we know: `mergeQuizResultsIntoMastery` exists, `useMastery` hook exists, neither is called
   - What's unclear: Should mastery merge happen in `useProgress.completeLesson` (centralized) or in `handleQuizComplete` in `lesson/[id].tsx` (localized)?
   - Recommendation: Extend `useProgress.completeLesson` to also call mastery merge + save. This centralizes the pipeline and avoids duplicating logic across lesson screens. The quiz results are already available as `QuestionAttempt[]` -- they need mapping to the format `mergeQuizResultsIntoMastery` expects.

2. **Letter mastery celebration placement in lesson flow**
   - What we know: Quiz ends -> `handleQuizComplete` saves -> stage changes to "summary"
   - What's unclear: Should mastery celebration appear before summary, as a modal over summary, or as a separate intermediate stage?
   - Recommendation: Add a "mastery-celebration" intermediate stage between quiz and summary. If newly mastered letters exist, show LetterMasteryCelebration first (tap to dismiss), then transition to summary. If none, go directly to summary.

3. **Multiple letters mastered in one lesson**
   - What we know: A lesson can `teachIds` multiple letters, and review can touch more
   - What's unclear: How often does this realistically happen?
   - Recommendation: Build the celebration to accept an array but display one primary letter. If multiple, show "MashaAllah! You've mastered Ba and Ta." in a single celebration view.

## Sources

### Primary (HIGH confidence)
- Direct source code analysis: mastery.js, engagement.js, useLessonQuiz.ts, useProgress.ts, lesson/[id].tsx, phase-complete.tsx, LessonSummary.tsx, QuizCelebration.tsx, WarmGlow.tsx, QuizOption.tsx, haptics.ts, animations.ts
- CONTEXT.md decisions (user-locked)
- REQUIREMENTS.md traceability table

### Secondary (MEDIUM confidence)
- STATE.md: Lottie color theming limitation flag (verified by checking package.json -- Lottie not installed)
- Mastery engine test file (mastery.test.js) confirms deriveMasteryState behavior

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used, no new dependencies
- Architecture: HIGH - based on direct source code analysis of existing patterns
- Pitfalls: HIGH - mastery pipeline gap confirmed by code grep (0 callers of mergeQuizResultsIntoMastery in hooks/components)
- Islamic copy: MEDIUM - proportioning recommendation (30-40%) is a UX judgment, not verifiable without user testing

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- no external dependencies, all internal code)
