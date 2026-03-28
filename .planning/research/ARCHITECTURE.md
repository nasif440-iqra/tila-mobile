# Architecture Patterns

**Domain:** Mobile app UI overhaul (React Native / Expo)
**Researched:** 2026-03-28

## Recommended Architecture

The UI overhaul should be structured as a **progressive layering system** that adds visual quality without touching existing business logic. The key insight from the codebase is that Tila already has clean separation between engine (pure JS), hooks (bridge), and UI (screens + components). The overhaul operates exclusively within the UI layer and the design system that feeds it.

### Architecture Diagram

```
                     UNTOUCHED (engine, hooks, db, data)
  ┌────────────────────────────────────────────────────────────────┐
  │  src/engine/  ←  src/hooks/  ←  src/db/  ←  src/data/         │
  └─────────────────────────┬──────────────────────────────────────┘
                            │ (data flows up via hooks, unchanged)
                            │
  ┌─────────────────────────▼──────────────────────────────────────┐
  │                    UI OVERHAUL SCOPE                            │
  │                                                                │
  │  ┌─── Layer 1: Design Foundation ───────────────────────────┐  │
  │  │  src/design/tokens.ts      — Color, type, spacing tokens │  │
  │  │  src/design/theme.ts       — ThemeContext, useColors()    │  │
  │  │  src/design/animations.ts  — Animation presets (NEW)      │  │
  │  └──────────────────────────┬───────────────────────────────┘  │
  │                             │                                  │
  │  ┌─── Layer 2: Primitive Components ────────────────────────┐  │
  │  │  src/design/components/   — Button, Card, QuizOption,    │  │
  │  │                             ArabicText, HearButton       │  │
  │  │  + NEW primitives:          Badge, ProgressRing,         │  │
  │  │                             SectionHeader, Divider       │  │
  │  └──────────────────────────┬───────────────────────────────┘  │
  │                             │                                  │
  │  ┌─── Layer 3: Feature Components ─────────────────────────┐   │
  │  │  src/components/          — Onboarding, Quiz, Home,      │  │
  │  │                             Progress, Exercises, Lesson* │  │
  │  │  (consume design system, never define own tokens)        │  │
  │  └──────────────────────────┬───────────────────────────────┘  │
  │                             │                                  │
  │  ┌─── Layer 4: Screens ─────────────────────────────────────┐  │
  │  │  app/                     — Thin orchestrators that       │  │
  │  │                             compose feature components    │  │
  │  │  (transition configs, navigation animation setup)        │  │
  │  └──────────────────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Overhaul Role |
|-----------|---------------|-------------------|---------------|
| `src/design/tokens.ts` | Color, typography, spacing, shadow, radius, border-width definitions | Nothing (leaf) | Foundation layer: all visual decisions originate here |
| `src/design/theme.ts` | ThemeContext, `useColors()`, `useTheme()` | tokens.ts | Delivery mechanism: how tokens reach components |
| `src/design/animations.ts` (NEW) | Animation timing presets, spring configs, easing curves | tokens.ts (for durations mapped to semantic intent) | Single source of truth for all motion constants |
| `src/design/components/` | Primitive UI atoms (Button, Card, etc.) | tokens.ts, theme.ts | Must embody the design system; all new primitives live here |
| `src/components/` | Feature-specific composites (LessonQuiz, OnboardingFlow, etc.) | design system, hooks, engine selectors | Apply design system to domain-specific layouts |
| `app/` | Screen orchestrators, navigation config | components, hooks | Configure transitions, compose feature components |

---

## Patterns to Follow

### Pattern 1: Token-First Styling (Already Established, Enforce Strictly)

**What:** Every visual value (color, spacing, radius, border-width, shadow, font) must come from `tokens.ts`. No inline magic numbers.

**When:** Always. This is the non-negotiable foundation.

**Why it matters for overhaul:** The existing codebase has ~20 instances of raw numbers that bypass tokens (documented in Phase 1 spec). Each one is a visual inconsistency. Token-first means you change `tokens.ts` and the entire app updates.

**Example (current, already good):**
```typescript
// Button.tsx — uses tokens correctly
const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
  },
});
```

### Pattern 2: Animation Presets via Shared Constants

**What:** All animation timing, spring configs, and easing parameters defined in a central location. Components never hardcode animation values.

**When:** Any component that animates.

**Why:** The existing codebase has animation constants scattered across files. The onboarding `animations.ts` file is a start, but the pattern needs to extend app-wide. Reanimated 4.2 (already installed) supports CSS-style animations alongside worklets, but the worklet-based API with shared constants is the right approach for this app because animations are interaction-driven (press feedback, state transitions), not declarative CSS loops.

**What to create:** `src/design/animations.ts`
```typescript
// Spring configs — named by feel, not by numbers
export const springs = {
  /** Snappy press feedback (buttons, options) */
  press: { stiffness: 400, damping: 25 },
  /** Bouncy entrance (cards, modals) */
  bouncy: { stiffness: 300, damping: 18 },
  /** Gentle settle (layout shifts, reordering) */
  gentle: { stiffness: 200, damping: 20 },
  /** Quick snap (toggles, switches) */
  snap: { stiffness: 500, damping: 30 },
} as const;

// Duration presets — for withTiming-based animations
export const durations = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  dramatic: 700,
} as const;

// Stagger presets — for lists and sequential entrances
export const staggers = {
  fast: { base: 80, duration: 300 },
  normal: { base: 150, duration: 500 },
  dramatic: { base: 250, duration: 700 },
} as const;
```

**Current state:** Button and QuizOption both hardcode `{ stiffness: 400, damping: 25 }` — already the same values but duplicated. The onboarding animations.ts has stagger constants but only for onboarding. This pattern centralizes everything.

### Pattern 3: State-Driven Animation (Duolingo Pattern)

**What:** Components animate in response to state changes, not imperative calls. The component receives a state prop and decides how to animate.

**When:** Interactive elements with multiple visual states (quiz options, lesson nodes, celebration moments).

**Why:** This is exactly how Duolingo structures animation. Developers update state; the component decides what "correct", "wrong", "celebrating" looks like. Already partially implemented in `QuizOption` (state prop drives correct/wrong animations) — extend this pattern to all interactive elements.

**Example (already exists in QuizOption):**
```typescript
// QuizOption receives state, animates internally
type QuizOptionState = "default" | "correct" | "wrong" | "dimmed";

// useEffect watches state and triggers appropriate animation
useEffect(() => {
  if (state === "correct") {
    scale.value = withSequence(
      withTiming(1.04, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
  }
}, [state]);
```

**Extend to:** Lesson grid nodes (locked/available/current/completed states), hero card (idle/celebrating), streak badge (incrementing).

### Pattern 4: Layered Celebration System

**What:** Small wins get micro-feedback (haptic + subtle scale). Medium wins get visual celebration (confetti burst, glow pulse). Big wins get full-screen moments (dedicated celebration screen with Lottie or complex Reanimated sequence).

**When:** Lesson completion, streak milestones, phase completion, mastery level-ups.

**Why:** The app already has `QuizCelebration.tsx` and `phase-complete.tsx` screens, but celebration is inconsistent. A tiered system ensures the right emotional weight for each achievement without cheapening bigger moments.

**Tiers:**
| Tier | Trigger | Animation | Haptic |
|------|---------|-----------|--------|
| Micro | Correct answer, option tap | Scale pulse (1.04x), color transition | Light impact |
| Small | Quiz streak (3+ correct), lesson complete | Confetti burst, success glow | Success notification |
| Medium | Phase milestone, streak milestone | Dedicated overlay with particle effects | Medium impact |
| Large | Phase complete, first lesson ever | Full-screen celebration route | Heavy impact + success |

### Pattern 5: Screen Composition (Thin Orchestrator Pattern)

**What:** Screen files in `app/` stay thin. They compose feature components, configure navigation, and manage high-level state transitions. They never contain styling logic or animation definitions.

**When:** Always. Already the established pattern — reinforce during overhaul.

**Why:** The current `app/(tabs)/index.tsx` is a good example at ~130 lines: it loads data via hooks, handles navigation guards, and composes `HeroCard` + `LessonGrid`. Keep all screens this thin.

### Pattern 6: Progressive Enhancement Guard

**What:** Every visual change must be reversible by reverting a single file. Token changes revert via `tokens.ts`. Component changes revert via the component file. No change should have surprise cascading effects.

**When:** During the entire overhaul.

**Why:** This is a live app with real users. The existing Phase 1 spec demonstrates this discipline (token definitions stayed unchanged, only usage was fixed). Each subsequent phase should maintain this property.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Inline Style Overrides That Bypass Tokens

**What:** Components accepting `style` props and overriding token values inline.

**Why bad:** Every `style={{ marginTop: 20 }}` is a token bypass that creates inconsistency. During overhaul, these multiply quickly as "quick fixes."

**Instead:** If a component needs variant spacing, add a variant prop. If a layout needs different spacing, compose with a wrapper using token values. The current codebase has several inline style overrides in screens — clean these up, don't add more.

### Anti-Pattern 2: Animation Logic in Screen Files

**What:** Defining `useSharedValue`, `useAnimatedStyle`, and animation sequences directly in screen files.

**Why bad:** Screen files become animation code dumps. Animation logic is not reusable. Timing values scatter across the codebase.

**Instead:** Animation behavior belongs in components or custom hooks. Screens only pass state; components decide how to animate that state. The `app/lesson/[id].tsx` currently has stage transition logic that should live in a `useLessonTransition` hook or in the stage wrapper component.

### Anti-Pattern 3: Component-Level Theme Decisions

**What:** A component deciding which shade of a color to use based on its own logic rather than receiving a semantic token.

**Why bad:** Creates theme fragmentation. Dark mode becomes a nightmare — every component has its own color logic.

**Instead:** Use semantic tokens. The existing `tokens.ts` already does this well (`primarySoft`, `dangerLight`, `accentGlow` are semantic). Keep extending this pattern. Components should consume `colors.primarySoft`, never compute `opacity(colors.primary, 0.2)` inline.

### Anti-Pattern 4: Premature Lottie/Rive Integration

**What:** Adding Lottie or Rive animations before the animation architecture (presets, celebration tiers, spring configs) is established.

**Why bad:** Lottie files are opaque blobs. If you commit to Lottie early, you lose the ability to theme animations with your token system. Also, each Lottie file adds ~30-100KB to the bundle.

**Instead:** Build the celebration system first with Reanimated (already installed). The existing Reanimated 4.2 can handle confetti, particle effects, and complex sequences on the UI thread at 60fps. Only add Lottie later for character animations or extremely complex motion that would be impractical to code, if ever needed.

### Anti-Pattern 5: Shared Element Transitions

**What:** Letter cards morphing from grid to lesson view, hero card expanding into lesson screen.

**Why bad:** The Phase 4a spec explicitly defers these: "too complex for the payoff." React Native shared element transitions remain fragile across navigation boundaries, especially with Expo Router. They require layout measurement that conflicts with spring-based animations.

**Instead:** Use directional slide + fade transitions (already planned in Phase 4a). These create perceived connection between screens without the implementation complexity.

---

## Suggested Build Order

The existing 4-phase structure is well-designed. The build order below maps to the phases and explains architectural dependencies.

### Phase 1: Structural Consistency (Foundation)

**Dependencies:** None. This is the base layer.

**What:** Replace all raw magic numbers with token references. Standardize layout patterns (OnboardingStepLayout footer slot, consistent content widths). Create animation timing presets file.

**Architectural significance:** Establishes the discipline that every subsequent phase depends on. After Phase 1, a component's layout is predictable from its token usage alone. This is the "boring but critical" phase.

**Build from:** `src/design/animations.ts` (new) then screen-by-screen token cleanup starting with onboarding (highest-visibility surface).

### Phase 2: Design System Refinement (Tokens + Typography)

**Dependencies:** Phase 1 complete (all values use tokens, so token changes propagate cleanly).

**What:** Add brown color tokens, enforce typography role assignments (serif italic for titles, serif regular for headings, sans for body), add `xxxxl` spacing token.

**Architectural significance:** This is a pure token-layer change. Because Phase 1 ensured all components use tokens, the entire app updates by changing `tokens.ts`. No component files need to change for color/typography (they already reference token names); only color *assignments* in components change (e.g., `colors.text` to `colors.brown` for headings).

**Build from:** `tokens.ts` changes first, then sweep through components updating which semantic token they use.

### Phase 3: Visual Polish (Consistency Pass)

**Dependencies:** Phase 2 complete (design system is finalized, so polish pass won't need re-doing).

**What:** Add missing shadows, standardize border widths with new tokens, fix spacing inconsistencies, ensure every card-like surface follows the same visual rules.

**Architectural significance:** This phase introduces `borderWidths` tokens and extends `shadows` — additions to the token layer that Phase 2 intentionally deferred. After Phase 3, the design system is complete: any new component built using the tokens will automatically look premium.

**Build from:** Token additions first (`borderWidths`), then component sweep for shadow/border consistency.

### Phase 4: Motion + Delight (Animation + Celebration)

**Dependencies:** Phases 1-3 complete (animation layered on top of stable, polished visuals).

**What:** Screen transitions (lesson slide-up, exercise cross-fade, onboarding step flow), celebration system (tiered by achievement significance), micro-interactions (press feedback standardization).

**Architectural significance:** This is the most complex phase architecturally. It touches the `app/` layer (navigation animation config), the component layer (entering/exiting animations), and the design layer (animation presets). Already broken into sub-phases (4a: transitions, 4b: celebrations, 4c: loading states) — this decomposition is correct and should be maintained.

**Build from:** Animation presets (if not done in Phase 1) then navigation transitions (4a) then component-level animations (4b) then loading/empty states (4c).

### Cross-Phase Dependency Graph

```
Phase 1: Structure
  └── tokens used everywhere → Phase 2 can safely change token values
      └── Phase 2: Design System
          └── visual rules finalized → Phase 3 can polish without re-doing
              └── Phase 3: Polish
                  └── stable visual baseline → Phase 4 adds motion on top
                      └── Phase 4a: Transitions
                          └── Phase 4b: Celebrations
                              └── Phase 4c: Loading States
```

Each phase produces a complete, shippable state. You can stop after any phase and the app is improved.

---

## How to Layer Visual Improvements Without Breaking Existing Functionality

### Principle 1: The Engine Firewall

The `src/engine/`, `src/hooks/`, `src/db/`, and `src/data/` directories are a strict no-touch zone. The UI overhaul has zero reason to modify these. The current architecture already enforces this: hooks expose data, screens consume it. Verify this invariant by checking that no PR in the overhaul modifies files outside `src/design/`, `src/components/`, and `app/`.

### Principle 2: Token Changes Are Global by Design

When you change `spacing.xl` from 24 to 28 in `tokens.ts`, every component using that token updates. This is a feature during overhaul — it means you can globally adjust spacing with a single change. But it also means: **do not change token values mid-phase**. Set them at phase start and hold.

### Principle 3: Component Isolation Through Props

Each component receives data via props and styling via tokens. A component does not reach up to parent state or sideways to sibling components. This means you can overhaul `HeroCard` without touching `LessonGrid`, even though they appear on the same screen. The screen (`app/(tabs)/index.tsx`) composes them independently.

### Principle 4: Test the Boundaries, Not the Visuals

The existing unit tests cover engine logic (mastery, questions, selectors, outcomes). These should never break during UI overhaul — they test the layer below the one being modified. If a UI change breaks an engine test, something has gone wrong architecturally.

For the UI layer, validate via:
- `npm run typecheck` — ensures design token changes don't break type contracts
- `npm run lint` — catches import issues
- Manual testing on device — the only way to verify visual correctness
- Screenshot comparison (manual) — before/after for each screen per phase

### Principle 5: One Direction at a Time

Don't mix concerns across phases:
- Phase 1: spacing/layout only (no color changes)
- Phase 2: tokens only (no component structure changes)
- Phase 3: visual consistency only (no new animations)
- Phase 4: motion only (no design system changes)

This makes regressions traceable. If spacing breaks after Phase 3, you know Phase 3 introduced it (Phase 3 doesn't touch spacing).

---

## Scalability Considerations

| Concern | Current (10 screens) | At 30 screens | At 50+ screens |
|---------|---------------------|---------------|----------------|
| Token consistency | Manual discipline | Need lint rule enforcing token usage | Automated: ESLint plugin banning raw numbers in style objects |
| Animation performance | Fine — few animations | Monitor: Reanimated worklets stay on UI thread | Profile: ensure no JS-thread animation bottlenecks on mid-range Android |
| Component library growth | 5 primitives in design/ | ~10-15 primitives | Consider Storybook-like catalog for visual regression testing |
| Theme propagation | Context-based, works fine | Context re-render could become expensive | Consider `useMemo` on theme value or split into color/spacing contexts |
| Bundle size | Small, no heavy animation deps | Lottie files could balloon | Budget: cap animation assets at 500KB total |

The current architecture handles the 10-screen app well. The main scalability risk is animation performance on low-end Android when Phase 4 adds motion to many surfaces simultaneously. Mitigation: use `react-native-reanimated`'s `reduceMotion` API to respect system accessibility settings, and test on a mid-range Android device throughout Phase 4.

---

## Sources

- Codebase analysis: `src/design/tokens.ts`, `src/design/theme.ts`, `src/design/components/`, `src/components/onboarding/animations.ts`
- Existing phase specs: `docs/superpowers/specs/2026-03-27-ui-phase{1,2,3,4a}-*.md`
- [React Native Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- [Reanimated 4 overview — Callstack](https://www.callstack.com/podcasts/reanimated-4-is-the-future-of-smooth-react-native-animations)
- [Duolingo streak animation design](https://blog.duolingo.com/streak-milestone-design-animation/)
- [Duolingo LottieFiles case study](https://lottiefiles.com/case-studies/duolingo)
- [Micro-interactions in UX — IxDF](https://ixdf.org/literature/article/micro-interactions-ux)
- [React Native architecture 2025](https://globaldev.tech/blog/react-native-architecture)

---

*Architecture research: 2026-03-28*
