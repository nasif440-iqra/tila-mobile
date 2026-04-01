---
phase: 03-home-screen
verified: 2026-03-28T20:15:00Z
status: human_needed
score: 8/9 must-haves verified
human_verification:
  - test: "Run app and observe staggered entrance on home screen"
    expected: "Header 'tila' text appears first (0ms), hero card slides up at 80ms, journey section fades at 160ms, nodes stagger in sequentially with 50ms gaps"
    why_human: "Animation timing and sequencing requires visual inspection on device/simulator"
  - test: "Observe WarmGlow breathing behind hero letter circle"
    expected: "A soft warm pulsing glow behind the Arabic letter circle in the hero card, size 160, barely perceptible (pulseMin 0.06, pulseMax 0.18)"
    why_human: "Visual quality and subtlety of glow effect requires human judgment"
  - test: "Observe AnimatedStreakBadge (requires streak > 0)"
    expected: "Pill badge with crescent + count + 'Wird' label, with a barely perceptible breathing glow behind it"
    why_human: "Requires device state with streak > 0; glow subtlety requires human judgment"
  - test: "Observe JourneyNode states across the journey path"
    expected: "Complete nodes: dimmed green circle with gold checkmark. Current node: larger with subtle pulsing accent ring + 'Up next' card. Locked nodes: clearly dimmed (0.4 opacity) with letter preview or lock icon"
    why_human: "Visual state distinctions and glow pulse quality require human judgment"
  - test: "Tap a complete or current node"
    expected: "Spring scale feedback (slight shrink + bounce) with haptic tap"
    why_human: "Haptic feedback and spring feel require physical device"
  - test: "Overall impression of home screen"
    expected: "Warm, inviting, 'quiet confidence' — polished but not flashy. Feels like opening a beautiful book."
    why_human: "Subjective design quality assessment per HOME-01 goal"
---

# Phase 3: Home Screen Verification Report

**Phase Goal:** The home screen feels like opening a beautiful book — inviting, clear, and encouraging
**Verified:** 2026-03-28T20:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | AnimatedStreakBadge renders streak count and Wird label when count > 0 | VERIFIED | `src/components/home/AnimatedStreakBadge.tsx` lines 67-69 render count + "Wird"; `index.tsx` line 118 gates on `currentWird > 0` |
| 2 | AnimatedStreakBadge has breathing WarmGlow behind it | VERIFIED | Lines 57-63 of `AnimatedStreakBadge.tsx`: `WarmGlow animated={true} size={60} pulseMin={0.04} pulseMax={0.12}` |
| 3 | JourneyNode renders 3 distinct visual states (complete, current, locked) | VERIFIED | `JourneyNode.tsx` lines 153-219: separate render paths for all three states with correct colors/sizes |
| 4 | Complete node shows checkmark, current node shows dot + glow, locked node shows letter or lock | VERIFIED | CheckIcon in complete state; dot + 52px glowRing (withRepeat 0.08-0.15) in current state; ArabicText or LockIcon in locked state |
| 5 | Test stubs exist for HOME-02, HOME-03, HOME-04 | VERIFIED | All three test files confirmed: `home-hero.test.ts` (6 todos), `home-journey.test.ts` (7 todos), `home-streak.test.ts` (3 todos) |
| 6 | Home screen feels warm with staggered entrance animations | HUMAN NEEDED | Code is correct (timing 0/80/160/200ms, staggered nodes via staggers.fast.delay) — visual quality requires device verification |
| 7 | Hero card is most visually prominent with WarmGlow behind letter circle | VERIFIED | `HeroCard.tsx` lines 119-125: `WarmGlow size={160} pulseMin={0.06} pulseMax={0.18}` behind letter circle; FadeIn+translateY entrance at enterDelay |
| 8 | Journey path uses JourneyNode with staggered entrance | VERIFIED | `LessonGrid.tsx` line 13 imports JourneyNode; line 100 passes `enterDelay={enterDelay + 200 + i * staggers.fast.delay}` |
| 9 | Streak badge in header is AnimatedStreakBadge (not inline StreakBadge) | VERIFIED | `index.tsx` line 27 imports AnimatedStreakBadge; line 118 uses it; no `function StreakBadge` found in index.tsx |

**Score:** 8/9 truths verified automatically (1 requires human visual confirmation)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/home/AnimatedStreakBadge.tsx` | Animated streak badge with breathing glow | VERIFIED | Exists, 103 lines, exports `AnimatedStreakBadge` + `AnimatedStreakBadgeProps`, imports WarmGlow, uses springs.bouncy + durations.normal |
| `src/components/home/JourneyNode.tsx` | Journey node with 3 visual states and press feedback | VERIFIED | Exists, 384 lines, exports `JourneyNode` + `JourneyNodeProps`, has CheckIcon/LockIcon helpers, AnimatedPressable, withRepeat glow |
| `src/components/home/HeroCard.tsx` | Polished hero card with WarmGlow and entrance animation | VERIFIED | Exists, 194 lines, contains WarmGlow size=160, FadeIn+translateY via durations.slow + easings.contentReveal, springs.gentle circle scale |
| `src/components/home/LessonGrid.tsx` | Journey path using extracted JourneyNode with stagger | VERIFIED | Exists, 134 lines, imports JourneyNode, uses staggers.fast.delay, enterDelay prop wired |
| `app/(tabs)/index.tsx` | Home screen with AnimatedStreakBadge and staggered sections | VERIFIED | Exists, 179 lines, imports AnimatedStreakBadge, passes enterDelay={80} to HeroCard and enterDelay={160} to LessonGrid |
| `src/__tests__/home-hero.test.ts` | Test stubs for HOME-02 | VERIFIED | Exists, 10 lines, 6 it.todo stubs covering HeroCard scenarios |
| `src/__tests__/home-journey.test.ts` | Test stubs for HOME-03 | VERIFIED | Exists, 12 lines, 7 it.todo stubs covering JourneyNode states |
| `src/__tests__/home-streak.test.ts` | Test stubs for HOME-04 | VERIFIED | Exists, 8 lines, 3 it.todo stubs covering AnimatedStreakBadge |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/(tabs)/index.tsx` | `src/components/home/AnimatedStreakBadge.tsx` | import AnimatedStreakBadge | WIRED | Line 27 imports; line 118 renders with count + enterDelay={200} |
| `src/components/home/LessonGrid.tsx` | `src/components/home/JourneyNode.tsx` | import JourneyNode | WIRED | Line 13 imports; lines 95-103 render JourneyNode in map |
| `src/components/home/HeroCard.tsx` | `src/components/onboarding/WarmGlow.tsx` | import WarmGlow | WIRED | Line 14 imports; lines 119-125 render inside letterCircleWrapper |
| `src/components/home/AnimatedStreakBadge.tsx` | `src/components/onboarding/WarmGlow.tsx` | import WarmGlow | WIRED | Line 10 imports; lines 57-63 render with animated=true |
| `src/components/home/JourneyNode.tsx` | `src/design/animations.ts` | import springs, pressScale | WIRED | Line 24 imports springs, staggers, easings, pressScale; used at lines 100, 111, 115 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `app/(tabs)/index.tsx` | `currentWird` | `useHabit()` → `habit.currentWird` | Yes — SQLite query `SELECT current_wird FROM habit` (engine/habit.ts line 8-13) | FLOWING |
| `app/(tabs)/index.tsx` | `completedLessonIds` | `useProgress()` → `loadProgress(db)` | Yes — `loadProgress` queries SQLite DB | FLOWING |
| `app/(tabs)/index.tsx` | `nextLesson` | `getCurrentLesson(completedLessonIds)` | Yes — derived from real `completedLessonIds` via engine selector | FLOWING |
| `src/components/home/HeroCard.tsx` | `lesson`, `completedLessonIds` | Props from index.tsx (real data) | Yes — all props flow from DB-backed hooks | FLOWING |
| `src/components/home/LessonGrid.tsx` | `nextLessonId`, `completedLessonIds` | Props from index.tsx (real data) | Yes — all props flow from DB-backed hooks | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED for animations/visual components — requires running app on device. Structural checks confirm all animation hooks (useSharedValue, withTiming, withSpring, withRepeat) are called with real values from design system presets. No hardcoded empty returns.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| HOME-01 | 03-02-PLAN | Home screen feels inviting and encouraging, not like a utility screen | HUMAN NEEDED | All structural code complete: staggered entrances (0/80/160/200ms), breathing glows on hero + streak, JourneyNode visual hierarchy. Visual quality requires device confirmation. |
| HOME-02 | 03-01-PLAN, 03-02-PLAN | Hero lesson card is visually prominent with clear call to action | VERIFIED (code) + HUMAN NEEDED (visual) | HeroCard.tsx: WarmGlow size=160, FadeIn+translateY entrance, CTA button renders "Start Lesson"/"Continue Lesson"/"Review Lesson" based on state |
| HOME-03 | 03-01-PLAN, 03-02-PLAN | Journey path clearly shows progress with beautiful visual states | VERIFIED (code) + HUMAN NEEDED (visual) | JourneyNode with complete/current/locked states wired into LessonGrid with stagger |
| HOME-04 | 03-01-PLAN, 03-02-PLAN | Streak counter is visually engaging (not just a number) | VERIFIED (code) + HUMAN NEEDED (visual) | AnimatedStreakBadge: pill with crescent + count + "Wird", WarmGlow breathing behind, milestone pulse animation |

All 4 requirement IDs declared in plan frontmatter are accounted for. No orphaned requirements — REQUIREMENTS.md maps HOME-01 through HOME-04 exclusively to Phase 3, and all 4 are addressed.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

No TODO/FIXME/placeholder comments found. No empty returns. No inline StreakBadge remaining in index.tsx. No CheckIcon or LockIcon remaining in LessonGrid.tsx. No direct expo-haptics imports in any modified component. All animation values reference design system presets (durations.slow, durations.normal, staggers.fast.delay, springs.gentle, springs.bouncy, springs.press, pressScale.subtle, easings.contentReveal).

### Human Verification Required

#### 1. Staggered Entrance Sequence

**Test:** Run `npm start`, open app on device/simulator, navigate to home screen (after onboarding). Observe the initial load animation.
**Expected:** "tila" header text fades in first (0ms), hero card fades in and slides up from below (80ms delay), journey path section header fades in (160ms delay), journey nodes stagger in one by one with ~50ms gaps.
**Why human:** Animation timing and visual sequencing cannot be verified without rendering on device.

#### 2. WarmGlow Quality Behind Hero Letter

**Test:** On the home screen, observe the letter circle within the hero card.
**Expected:** A soft warm amber glow breathing slowly behind the Arabic letter circle. The glow should be subtle — perceptible but not distracting. Pulses slowly (size 160, pulseMin 0.06, pulseMax 0.18).
**Why human:** Visual subtlety and quality of the glow effect requires human judgment.

#### 3. AnimatedStreakBadge (Requires Streak > 0)

**Test:** With a habit streak > 0, observe the streak badge in the top-right of the home screen header.
**Expected:** Pill badge showing crescent + number + "Wird" text, with a barely perceptible breathing glow behind it. Badge fades in at 200ms after screen load.
**Why human:** Requires device state with active streak; glow subtlety is subjective.

#### 4. JourneyNode Visual State Distinctions

**Test:** Scroll through the journey path on home screen. Observe the three node types.
**Expected:**
- Complete nodes: slightly dimmed (0.85 opacity) green circle with gold checkmark icon, "Completed" subtitle
- Current node: larger (44px vs 40px), primary-colored border, dot in center, subtle pulsing accent glow ring (3-second cycle), "Up next" label card
- Locked nodes: strongly dimmed (0.4 opacity), neutral border, Arabic letter preview or lock icon
**Why human:** Visual distinction quality, glow pulse subtlety, and readability at 0.4 opacity require human judgment.

#### 5. Press Feedback on Nodes

**Test:** Tap a complete or current journey node.
**Expected:** Node briefly scales down with a spring "press" feel, snaps back on release. Haptic tap fires simultaneously.
**Why human:** Spring animation feel and haptic require physical device.

#### 6. Overall Design Intent

**Test:** Use the home screen naturally — load the app, glance at the home screen, tap a lesson.
**Expected:** The screen should feel warm and inviting, like opening a beautifully made book. "Quiet confidence" — not flashy, but clearly premium. The Arabic letter in the hero card should feel special and draw the eye.
**Why human:** Subjective design quality assessment per HOME-01 and the phase goal.

### Gaps Summary

No code gaps found. All artifacts exist at full implementation depth. All key links are wired. Data flows from real SQLite sources. No anti-patterns detected.

The only outstanding items are human visual quality assessments — the code structure is fully correct but whether the resulting animations and visual hierarchy achieve the "beautiful book" feeling requires device confirmation. This is the expected state after the Plan 02 checkpoint task (Task 3) which was documented as pending human approval.

---

_Verified: 2026-03-28T20:15:00Z_
_Verifier: Claude (gsd-verifier)_
