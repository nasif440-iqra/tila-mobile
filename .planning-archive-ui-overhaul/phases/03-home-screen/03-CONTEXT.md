# Phase 3: Home Screen - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Elevate the home screen from a functional lesson grid to a warm, inviting experience that feels like opening a beautiful book. The design should have quiet confidence — subtle beauty that rewards attention, not flashy or in-your-face. Everything should feel alive with gentle polish: micro-animations, breathing effects, smooth state transitions.

</domain>

<decisions>
## Implementation Decisions

### Design Philosophy
- **D-01:** Quiet confidence — subtly beautiful, not flashy. A "subtle flex" that it was carefully designed but doesn't scream for attention.
- **D-02:** Life in the polish — micro-animations, gentle breathing, smooth transitions. The screen should feel alive without being busy.
- **D-03:** Easy to look at — clean hierarchy, nothing overwhelming. Information is clear at a glance.

### Hero Lesson Card
- **D-04:** The hero card is the most prominent element — it should invite the user to start their next lesson with a clear, enticing CTA.
- **D-05:** Claude's discretion on specific visual treatment — elevated card with warm glow, gentle entrance animation, clear letter presentation.

### Journey Path / Lesson Grid
- **D-06:** Three distinct visual states (complete, current, locked) should be immediately distinguishable but harmonious — not jarring color changes.
- **D-07:** The current/next lesson should subtly draw the eye — gentle animation or glow that says "start here" without being aggressive.

### Streak Counter
- **D-08:** The streak (Wird) counter should feel alive — gentle animation or visual flair, not just a static number. Could pulse, breathe, or have a warm glow.

### Animation & Interaction
- **D-09:** Use Phase 1's shared animation presets — no new magic numbers.
- **D-10:** Haptics on interactive elements (lesson taps, CTA button) using Phase 1 haptic presets.
- **D-11:** Entrance animations should be subtle staggered fades — content appears naturally, not all at once and not dramatically.

### Claude's Discretion
- Specific visual treatment for hero card (shadows, gradients, glow effects)
- How to make the journey path feel more organic (serpentine refinements, connector line styling)
- Streak counter animation approach (pulse, glow, number animation)
- Whether to add subtle background elements (warm glow, decorative accents)
- Complete/current/locked state visual design (colors, opacity, icons)
- Scroll behavior and content density
- Whether the "tila" header needs enhancement

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Home Screen Code
- `app/(tabs)/index.tsx` — Home screen route (lesson grid, hero card)
- `src/components/home/HeroCard.tsx` — Current hero lesson card
- `src/components/home/LessonGrid.tsx` — Current journey path / lesson grid

### Design System (from Phase 1)
- `src/design/animations.ts` — Shared animation presets (springs, durations, staggers, easings)
- `src/design/haptics.ts` — Haptic feedback presets
- `src/design/tokens.ts` — Color tokens, typography, spacing
- `src/design/theme.ts` — Theme context with useColors()
- `src/design/components/Button.tsx` — Polished button component
- `src/design/components/Card.tsx` — Card with interactive mode

### Phase 2 Components (reusable)
- `src/components/onboarding/WarmGlow.tsx` — Animated warm glow effect (can be reused on home screen)

### Research
- `.planning/research/FEATURES.md` — Streak visualization, progress indicators
- `.planning/research/ARCHITECTURE.md` — Component patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **WarmGlow (Phase 2):** Animated pulsing warm glow — can add subtle warmth behind hero card or streak counter.
- **Card interactive mode (Phase 1):** Cards with press animation — hero card can use this.
- **Animation presets (Phase 1):** springs, durations, staggers, easings — all entrance/interaction animations.
- **Haptic presets (Phase 1):** tap, success, milestone — for lesson interactions.

### Established Patterns
- **Home screen layout:** Header ("tila" + Wird badge) → Hero card → Journey path with serpentine lesson nodes.
- **Lesson node states:** Complete (checkmark), current (bordered ring + "Up next" label), locked (lock icon or letter preview).
- **Serpentine layout:** Dashed connector line on left, nodes offset ±4 to ±12px for organic flow.

### Integration Points
- `app/(tabs)/index.tsx` — Main home screen file, renders HeroCard and LessonGrid.
- `useProgress` hook — Provides lesson completion data, mastery state.
- `useHabit` hook — Provides streak/Wird data for streak counter.

</code_context>

<specifics>
## Specific Ideas

- "Subtle flex that we designed this but not overly in your face" — quiet craftsmanship
- "Things should be engaging, there should be life to the polish" — micro-animations that make it breathe
- "Very easy to look at" — clean, scannable, nothing competing for attention
- Target audience (converts) should feel encouraged, not overwhelmed by progress they haven't made yet

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-home-screen*
*Context gathered: 2026-03-28*
