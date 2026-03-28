# Phase 1: Design Foundation & Transitions - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish the design system foundation, centralize animation presets, establish a consistent haptic feedback system, and standardize screen transitions app-wide. This phase creates the infrastructure that all subsequent UI phases build on. No new screens or features — just elevating what exists.

</domain>

<decisions>
## Implementation Decisions

### Component Polish Direction
- **D-01:** Components should feel premium but not heavy — subtle depth via shadows and borders, clean lines, refined spacing. Not flat/minimal and not overly skeuomorphic.
- **D-02:** Button press animations should feel satisfying — spring-based scale with slight bounce, not just a flat opacity change. Current 0.97 scale is a good start, may refine spring constants.
- **D-03:** Cards should have gentle elevation differences between resting and interactive states (not dramatic lifts).

### Animation Personality
- **D-04:** Balanced animation personality — elegant base with occasional energy. Logic-driven: content reveals are smooth and flowing (ease curves), success/reward moments get bouncy springs, errors are quick and sharp.
- **D-05:** Default animation timing: 250-400ms for transitions, 150-250ms for micro-interactions, 500-700ms for entrance animations. Stagger delays 50-100ms between elements.
- **D-06:** Spring configs: gentle springs for UI (stiffness 200-300, damping 20-25) for general motion, snappier springs (stiffness 400-500, damping 15-20) for feedback moments.
- **D-07:** All animation presets centralized in a single shared module (`src/design/animations.ts` or similar) — no more magic numbers in individual components.

### Haptic Feedback
- **D-08:** Haptics should be meaningful, not everywhere. Three tiers: (1) Light impact on interactive taps (buttons, options), (2) Success notification on correct answers / completions, (3) Error notification on wrong answers. No haptics on passive scrolling or navigation.
- **D-09:** Create a `useHaptics()` hook or haptic utility with named presets (tap, success, error, milestone) so every component uses the same patterns.

### Screen Transitions
- **D-10:** Three transition types, used consistently with logic: (1) Slide-up for modal/overlay screens (lessons, celebrations), (2) Fade for in-place content changes (quiz stages, exercise switches), (3) Push/slide for forward navigation (tab switches, onboarding steps).
- **D-11:** Transition speed: gentle and flowing by default (300-400ms), faster for feedback-driven transitions like quiz answer states (150-200ms). The logic: user-initiated navigation = flowing, system responses = snappy.

### Claude's Discretion
- Animation preset module structure and naming conventions
- Specific spring constant tuning (can be refined during implementation)
- Which components need the most polish vs. which are already acceptable
- Whether to refactor existing animation code in onboarding/animations.ts or create a new shared module that supersedes it
- Token enforcement strategy (how strictly to audit existing usage)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `src/design/tokens.ts` — Complete color, typography, spacing, radii, border, shadow tokens
- `src/design/theme.ts` — Theme context with useColors() and useTheme() hooks
- `src/design/components/Button.tsx` — Base button with 3 variants, spring animation, haptics
- `src/design/components/Card.tsx` — Base card with optional elevation
- `src/design/components/ArabicText.tsx` — Arabic text with RTL and size variants
- `src/design/components/HearButton.tsx` — Audio playback button with loading state
- `src/design/components/QuizOption.tsx` — Quiz option with correct/wrong/dimmed state animations

### Existing Animation Code
- `src/components/onboarding/animations.ts` — Transition timing constants (currently onboarding-only)
- `app/_layout.tsx` — Root layout with screen transition configuration

### Codebase Analysis
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, code style, import organization
- `.planning/codebase/STRUCTURE.md` — Directory layout, module organization
- `.planning/codebase/CONCERNS.md` — Technical debt and known issues

### Research
- `.planning/research/STACK.md` — Library recommendations (Reanimated 4 CSS Animations API)
- `.planning/research/ARCHITECTURE.md` — Animation architecture patterns, celebration tier system
- `.planning/research/PITFALLS.md` — Performance risks, Arabic rendering concerns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Design tokens (tokens.ts):** Complete token system — colors, typography (15+ presets), spacing (8px rhythm), radii, border widths, shadows. Well-structured, no gaps.
- **5 base components:** Button, Card, ArabicText, HearButton, QuizOption — all functional, need polish pass
- **Reanimated 4.2.1:** Already installed, supports CSS Animations API (keyframes, transitionProperty)
- **expo-haptics:** Already installed, used in 13 files but inconsistently

### Established Patterns
- **Theme context:** useColors() hook provides color tokens app-wide. All components should use this, not direct token imports.
- **StyleSheet.create:** Standard RN styling, no CSS-in-JS library. Keep this pattern.
- **Spring animations:** Button already uses withSpring (stiffness 400, damping 25, mass 0.8). QuizOption uses similar springs. This is the established animation pattern.

### Integration Points
- **onboarding/animations.ts:** Currently holds transition timing constants only for onboarding. The new shared animation presets module should either extend or replace this.
- **Root layout (app/_layout.tsx):** Screen transition configuration lives here. Phase 1 may refine these transition settings.
- **Every screen file:** Will benefit from the centralized presets and haptic system without needing individual changes (downstream phases handle screen-specific polish).

</code_context>

<specifics>
## Specific Ideas

- "A mix of elegance, but animation. A mix of gentle and flowing, but occasional fast and snappy. There should be logic to it all."
- User wants Duolingo energy married with Quranic elegance — the animation system should reflect both
- User is non-technical and trusts Claude to make implementation decisions — focus on feel, not API choices
- The overarching tone: warm, sacred, encouraging, premium

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-design-foundation-transitions*
*Context gathered: 2026-03-28*
