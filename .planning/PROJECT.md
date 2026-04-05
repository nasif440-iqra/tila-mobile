# Tila — Emotional Design Overhaul

## What This Is

Tila is a mobile app that teaches converts and new Muslims to read the Quran, starting from the Arabic alphabet. This milestone transforms Tila's visual and emotional experience from a functional content app into an inhabited space — like walking into a beautiful mosque for the first time: light shaped by architecture, warmth without fanfare, a place that tells the uncertain visitor "this was always yours." Built with Expo 55 / React Native 0.83, offline-first SQLite, mastery-based SRS learning.

## Core Value

Every screen should feel like entering a quiet, beautiful room that was made for people who aren't sure they belong yet — a sanctuary for learners reconnecting with their faith.

## Emotional Design Contract

These are the non-negotiable emotional principles that override aesthetic preferences:

- **Light as architecture, not decoration** — gold is illumination, not bling. Patterns exist whether you notice them or not.
- **Cleanliness as reverence** — nothing cluttered, nothing competing for attention. Every element earns its place.
- **Softness as welcome** — the app catches you, it doesn't demand.
- **Beauty that doesn't perform** — ambient, structural beauty. Not "look at this."
- **A space for the uncertain** — someone who doesn't know Arabic yet, who might feel like an outsider to their own faith, should feel received.

**Reference tone:** Duolingo's pedagogical clarity and motion confidence, stripped of the arcade/gamification layer. Add Islamic reverence, spatial warmth, living typography.

**Arabic letters are living presences** — they breathe, glow softly, invite. Not static ink, not flashcards.

**Wrong answers feel like encouragement** — "Close!" energy. Acknowledge the attempt. No red flash, no shake, no punishment.

**First 2 seconds on home screen:** Quiet welcome. Like entering a calm, familiar room. Warmth without fanfare.

**Bismillah screen:** Both spiritual threshold AND first teaching moment. "This is sacred, and you're about to be able to read it yourself."

## Requirements

### Validated

- ✓ Mastery-based learning system with SRS — existing
- ✓ 28 Arabic letter curriculum across 4 phases (106 lessons) — existing
- ✓ Offline-first SQLite storage — existing
- ✓ RevenueCat monetization integration — existing
- ✓ PostHog analytics + Sentry crash reporting — existing
- ✓ Onboarding flow with wird streak tracking — existing
- ✓ Error boundaries, audio guards, DB timeout recovery — v1.0
- ✓ Quiz engine with adaptive question generation — existing
- ✓ Expo Router file-based navigation — existing
- ✓ Design system foundation (tokens, components, ThemeContext) — existing

### Active

- [ ] Global ambient background system (layered gradients, slow motion, geometric patterns)
- [ ] Shared motion language (breathing, drifting, settling — not arcade animation)
- [ ] Typography hierarchy overhaul (Arabic dominance on sacred/quiz surfaces, Amiri display sizing)
- [ ] Arabic presentation rules (never clipped, diacritics respected, generous line height)
- [ ] LetterHero component (breathing letter with warm glow, dominates quiz/lesson hero areas)
- [ ] Sacred phrase reveal system (phrase-by-phrase unfolding for Tilawah, Hadith, Bismillah)
- [ ] Bismillah micro-lesson (word-by-word Arabic + transliteration + meaning)
- [ ] Quiz composition redesign (letter hero dominates top half, answer feedback redesign)
- [ ] Answer feedback overhaul (warm ripple on correct, encouraging nudge on wrong, remove +1 treatment)
- [ ] Streak escalation system (3=quiet banner, 5=warmer banner, 7=dignified full-screen moment)
- [ ] Onboarding atmosphere upgrade (Welcome, Tilawah, Hadith, Bismillah, Finish screens)
- [ ] Home screen polish (hero card, lesson grid — quiet welcome feeling)
- [ ] Progress screen polish (atmospheric, not dashboard-like)
- [ ] State screens polish (loading, empty, error — all feel part of the same inhabited space)
- [ ] Reduce Motion accessibility (disable ambient animations, replace entrances with opacity fades)
- [ ] Arabic clipping audit (ensure no letter/diacritic is ever cut off across all screens)
- [ ] Contrast and touch-target audit (accessibility hardening)

### Out of Scope

- Business logic changes — engine algorithms stay the same
- Routing changes — Expo Router structure stays the same
- Quiz correctness logic — progression, scoring, analytics untouched
- Monetization logic — RevenueCat integration untouched
- Dark mode activation — separate milestone
- New lesson content — 106 lessons exist, this is visual/emotional work
- Cloud sync / accounts — infrastructure milestone
- E2E testing — separate milestone
- New npm dependencies beyond what's needed for SVG/gradient primitives

## Context

**Existing design system:** `src/design/` has tokens (colors `#163323` green, `#C4A464` gold, `#F8F6F0` cream), typography (Amiri Arabic, Inter body, Lora headings), 8px spacing grid, and shared components (Button, Card, ArabicText, QuizOption, HearButton, WarmGradient). The foundation is solid but underutilized — screens often render content correctly without creating atmosphere.

**Existing motion:** `src/design/animations.ts` has basic Reanimated animations. Onboarding has `WarmGlow` and `FloatingLettersLayer` components. These are starting points but are per-screen rather than shared primitives.

**What's flat today:** Home screen is a functional grid. Quiz is a card among cards. Progress is a dashboard. Loading/empty/error are utilitarian. Sacred screens (Tilawah, Hadith, Bismillah) display text but don't create moments. The gap isn't missing content — it's missing atmosphere and emotional specificity.

**Codebase architecture:** Clean layered architecture (Engine → Hooks → Components). Engine layer is pure JS with zero React deps. UI changes don't risk business logic. Design system components are already shared and reusable. Good foundation for this work.

**Tech for this milestone:** react-native-reanimated (already installed), react-native-svg (for gradients, patterns, glow/ripple), expo-linear-gradient (already installed). No new framework dependencies needed.

## Constraints

- **Stack**: Expo SDK 55, React Native 0.83, New Architecture — no framework changes
- **No business logic changes**: Engine algorithms, quiz correctness, progression, analytics, monetization all stay the same
- **Offline-first**: All visual changes must work without network connectivity
- **Performance**: No regressions on mid-range Android (60fps animations must hold)
- **Backwards compatible**: Existing user data (SQLite) must not be affected
- **Accessibility**: Reduce Motion support required. Touch targets and contrast must pass audit.
- **Cultural sensitivity**: No inappropriate Islamic imagery. Reverent, not theatrical. No game-like patterns.
- **Maintainability**: Shared primitives over per-screen hacks. New components must be reusable.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Duolingo clarity + mosque reverence as reference tone | User's vision: pedagogical confidence without arcade energy, plus Islamic spatial warmth | — Pending |
| Arabic letters as living presences (breathing, glowing) | Letters are characters in the story, not flashcards. Inviting, not static. | — Pending |
| Wrong answers feel like encouragement, not correction | "Close!" energy. No red, no shake. Compassionate nudge. | — Pending |
| Bismillah as spiritual threshold + first micro-lesson | Sets the emotional promise: "This is sacred, and you'll learn to read it." | — Pending |
| Shared ambient system over per-screen atmosphere | Maintainability + consistency. One inhabited space, not scattered effects. | — Pending |
| react-native-reanimated + react-native-svg for motion/effects | Already installed or Expo-safe. No new framework dependencies. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-03 after initialization*
