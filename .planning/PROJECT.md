# Tila — UI Overhaul

## What This Is

Tila is a mobile app that teaches converts and new Muslims to read the Quran, starting from the Arabic alphabet. Built with Expo/React Native, it uses a mastery-based learning system with lessons, quizzes, and spaced repetition. The app works offline and targets iOS and Android.

This milestone focuses on transforming Tila's visual experience from functional to beautiful — Duolingo-level engagement married with Quranic elegance and a genuine wow factor.

## Core Value

The first impression must be stunning. When someone opens Tila for the first time, they should feel welcomed, inspired, and excited to learn — not intimidated by Arabic.

## Requirements

### Validated

- ✓ Arabic alphabet teaching (28 letters with audio) — existing
- ✓ Lesson-based curriculum with phases and modules — existing
- ✓ Mastery system (not_started → introduced → unstable → accurate → retained) — existing
- ✓ Spaced repetition scheduling — existing
- ✓ Multiple question types (recognition, sound, contrast, harakat, connected forms) — existing
- ✓ Interactive exercises (guided reveal, tap-in-order, build-up reader, free reader) — existing
- ✓ Onboarding flow (8-step guided entry) — existing
- ✓ Progress tracking with letter mastery grid — existing
- ✓ Habit tracking (Wird streaks) — existing
- ✓ Audio playback for letter pronunciation — existing
- ✓ Analytics (PostHog + Sentry) — existing
- ✓ Design system with tokens, typography, and base components — existing

### Active

- [ ] Full UI overhaul — elevate every screen from functional to premium
- [ ] Onboarding wow factor — make the first open feel special and inspiring
- [ ] Visual richness across all screens — not just functional, but beautiful
- [ ] Celebration system — subtle warmth for small wins, excitement for big wins
- [ ] Smooth, polished transitions and animations throughout
- [ ] Consistent premium feel across onboarding, home, lessons, and progress

### Out of Scope

- Dark mode — deferred to future milestone
- Push notifications — separate milestone
- Sound design overhaul — separate milestone
- Monetization features — separate milestone
- Cloud sync — separate milestone
- New lesson content or curriculum changes — separate concern

## Context

- Recently migrated from React/Vite webapp to Expo-only mobile. The UI suffered during migration — functionally complete but visually generic.
- The underlying system (engine, data, hooks, DB) is solid and well-architected. No need to touch business logic.
- Design system foundation exists: dark green (#163323) + gold (#C4A464) on warm cream (#F8F6F0), Amiri/Inter/Lora fonts, 8px spacing rhythm. User loves these colors — keep them.
- Some animations already exist (onboarding floating letters, quiz option feedback, staggered entrances) but need to be elevated and made consistent.
- Target audience (converts/new Muslims) may feel intimidated by Arabic — the UI must be approachable, warm, and encouraging.
- First Android build shipped. iOS pending Apple Developer enrollment.
- Portrait-only, offline-first.

## Constraints

- **Platform**: Expo SDK 55, React Native 0.83, New Architecture enabled — must work within this stack
- **Orientation**: Portrait-only
- **Offline**: No network dependencies for UI — all assets bundled
- **Performance**: Animations must run at 60fps on mid-range Android devices
- **Existing design tokens**: Keep current color palette (green + gold + cream), fonts (Amiri, Inter, Lora), and 8px spacing
- **No business logic changes**: UI overhaul only — engine, data, hooks, DB stay untouched

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep existing color palette | User loves green + gold + cream for Quranic identity | — Pending |
| Duolingo energy + Quranic elegance | Engaging and encouraging but beautifully done with wow factor | — Pending |
| Full overhaul in phases | See progress fast while covering everything | — Pending |
| Subtle small wins, exciting big wins | Mix of celebration styles matches the reverent-but-fun tone | — Pending |
| Onboarding as #1 wow moment | First impression for new/convert users is critical | — Pending |

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
*Last updated: 2026-03-28 after initialization*
