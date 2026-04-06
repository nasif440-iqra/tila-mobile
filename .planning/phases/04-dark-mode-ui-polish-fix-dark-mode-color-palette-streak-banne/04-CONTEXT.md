# Phase 4: Dark Mode & UI Polish - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix dark mode color palette from cold/alien green to warm earth tones. Make streak celebrations varied and organic (not all full-screen popups). Replace onboarding progress bar with thin minimal line.

</domain>

<decisions>
## Implementation Decisions

### Dark mode palette
- **D-01:** Replace current cold green dark tokens (#0F1A14, #142019, #A8D5BA) with warm earth tones — deep charcoal-brown backgrounds, warm cream text, gold accents. Should feel like a dimly lit mosque at night, not a sci-fi terminal.
- **D-02:** Keep gold accent (#C4A464) as the primary accent color in both modes — it's already warm and works with earth tones.
- **D-03:** AtmosphereBackground DARK_PRESETS must also shift from cold green gradients to warm brown gradients to match the new palette.

### Streak celebrations
- **D-04:** Celebration format should be organic and varied, not mechanically predictable at fixed streak numbers. Mix of banners, popups, and surprise celebrations.
- **D-05:** Small streaks (3-4) mostly get banners with occasional surprise. Medium streaks (5-6) mix banners and popups with varied messaging. Big streaks (7+) always get a popup with different celebration styles.
- **D-06:** Add surprise celebrations at non-milestone numbers (random chance, ~15-20%) to keep the experience feeling alive and unpredictable.
- **D-07:** Streak overlay must use theme-aware colors — currently renders in light mode even when app is in dark mode.

### Onboarding progress bar
- **D-08:** Replace current progress bar with a thin, barely-there line at the top. Just shows rough position without being distracting. Should blend into the atmosphere rather than sitting on top of it.

### Claude's Discretion
- Exact dark mode color hex values (within the warm earth tone direction)
- Specific celebration variation logic (how randomness is implemented)
- Progress bar thickness and opacity values
- Whether surprise celebrations should have their own messaging pool

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above.

### Relevant source files
- `src/design/tokens.ts` — Light and dark color definitions (darkColors object to rewrite)
- `src/design/atmosphere/AtmosphereBackground.tsx` — DARK_PRESETS to update with new palette
- `src/components/quiz/StreakMilestoneOverlay.tsx` — Current full-screen overlay (to refactor into celebration system)
- `src/components/LessonQuiz.tsx` — Where streak milestones are triggered
- `src/components/onboarding/OnboardingFlow.tsx` — Progress bar rendering
- `src/components/onboarding/ProgressBar.tsx` — Current progress bar component

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useColors()` hook — Already provides theme-aware colors, just needs better dark values
- `AtmosphereBackground` — Already has DARK_PRESETS, just needs palette update
- `StreakMilestoneOverlay` — Has MILESTONES record for 3/5/7 with emoji/headline/subline

### Established Patterns
- Color tokens defined in `lightColors` / `darkColors` objects in tokens.ts
- Theme selection via `useTheme()` returning `{ mode, colors }`
- Animations use Reanimated shared values with timing/spring presets

### Integration Points
- `LessonQuiz.tsx` triggers streak overlay — celebration logic lives here
- `OnboardingFlow.tsx` renders ProgressBar conditionally
- AtmosphereBackground wraps all major screens

</code_context>

<specifics>
## Specific Ideas

- Dark mode should feel like "a dimly lit mosque at night" — warm, contemplative, not cold or technical
- Streak celebrations inspired by Duolingo's variety but culturally appropriate — no game-like excess
- Progress bar should be minimal enough to forget it's there

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-dark-mode-ui-polish*
*Context gathered: 2026-04-06*
