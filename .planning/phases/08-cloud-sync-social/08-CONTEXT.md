# Phase 8: Cloud Sync & Social - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Users get accounts, progress syncs to the cloud via Supabase, friends can see each other's streaks, dark mode works, and critical flows have integration tests. Executed in two waves: Wave A (infrastructure + auth + sync) then Wave B (social + polish).

This phase does NOT change the learning engine, question generators, or lesson flow. It adds a persistence and social layer on top of the existing offline-first SQLite architecture.

</domain>

<decisions>
## Implementation Decisions

### Backend & Auth (RET-03, RET-07)
- **D-01:** Backend service is **Supabase** (Postgres + Auth + Row Level Security)
- **D-02:** Auth methods: **Email + password, Google Sign-In, Apple Sign-In** (all three required)
- **D-03:** Account prompt appears **after lesson 3** with "Save your progress" framing
- **D-04:** Account prompt is **soft/dismissable** — re-appears after lesson 5 and lesson 7 if still anonymous
- **D-05:** Anonymous-to-authenticated upgrade must preserve all local progress (RET-03 requirement)

### Sync Architecture (RET-02, RET-04, RET-06)
- **D-06:** Conflict resolution: **last-write-wins** (timestamp-based). Single-user learning app — conflicts are rare.
- **D-07:** Sync triggers: **after each lesson completion + on app foreground**. Batched, not real-time.
- **D-08:** Offline-first guarantee: local SQLite stays source of truth. Cloud is a backup/sync target, never the primary read source.

### Claude's Discretion
- **Sync scope:** Sync all user-facing tables (mastery_entities, lesson_completions, habit tracking, user_profile). Subscription state stays with RevenueCat SDK (already cloud-synced). The SQLite schema is small enough that syncing all tables is simpler than cherry-picking.

### Social Features (RET-05)
- **D-09:** Friend discovery via **share link/invite code** — no phone contact access, no username search
- **D-10:** Friend visibility: **minimal — streak count only**. No lesson progress, no accuracy, no last-active.
- **D-11:** Interaction model: **view-only**. No messaging, no nudges, no reactions. Friends list shows streaks. Can add interactions in a future phase.

### Phase Splitting
- **D-12:** Phase 8 executes in **two waves**:
  - **Wave A (Infrastructure):** Shared state layer, Supabase setup, auth (email/Google/Apple), cloud sync, offline-first guarantee, privacy manifest update (RET-02, RET-03, RET-04, RET-06, RET-07)
  - **Wave B (Social + Polish):** Social features (friends/streaks), adaptive return welcome screen, dark mode, integration tests (RET-05, RET-08, RET-09, RET-10)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Core value, requirements, evolution rules
- `.planning/REQUIREMENTS.md` — RET-02 through RET-10 acceptance criteria
- `.planning/ROADMAP.md` — Phase 8 success criteria (9 items)
- `CLAUDE.md` — Stack constraints, architecture, design system, mastery system

### Database Schema
- `src/db/schema.ts` — Current SQLite schema (tables to sync)
- `src/db/client.ts` — Database client and migration patterns
- `src/db/provider.tsx` — React context for DB access

### Existing State Management
- `src/hooks/useProgress.ts` — Progress state hook (sync candidate)
- `src/hooks/useMastery.ts` — Mastery state hook (sync candidate)
- `src/hooks/useHabit.ts` — Habit tracking hook (sync candidate)

### Auth Integration Points
- `app/_layout.tsx` — Root layout (auth provider wrapping point)
- `app/onboarding.tsx` — Onboarding flow (account prompt insertion point)
- `src/components/onboarding/` — Existing onboarding components

### Design System
- `src/design/` — Tokens, colors, typography, spacing (dark mode tokens exist but inactive)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/db/provider.tsx` — DatabaseProvider context pattern can be extended for auth/sync providers
- `src/hooks/` — 5 existing hooks bridge UI to engine; state layer (RET-02) will wrap these
- `src/design/tokens` — Dark mode color tokens already defined, just not activated
- `src/components/onboarding/` — Existing onboarding flow for account prompt insertion

### Established Patterns
- **State:** SQLite + hooks (no Redux/Zustand). New state layer should follow this pattern.
- **Context providers:** ThemeContext + DatabaseProvider wrap the app. Auth/sync providers follow same pattern.
- **Data flow:** Screen -> Hook -> Engine -> SQLite. Sync layer sits between Engine and SQLite (or alongside SQLite).
- **Analytics:** PostHog + Sentry already integrated. Auth events should use same pattern.

### Integration Points
- `app/_layout.tsx` — Auth provider wrapping, sync initialization
- `app/onboarding.tsx` — Account creation prompt after lesson 3
- `app/return-welcome.tsx` — Adaptive return screen (RET-08)
- `src/db/schema.ts` — Schema extensions for sync metadata (last_synced timestamps)

</code_context>

<specifics>
## Specific Ideas

- Account prompt framing: "Save your progress" — not "Create an account". The value prop is data safety, not social.
- Social features are intentionally minimal for v1 — streak-only visibility, view-only interaction. This can grow later.
- Supabase Row Level Security ensures users can only read their own data + friends' streak counts.

</specifics>

<deferred>
## Deferred Ideas

- **Nudge/encourage system** — Pre-written encouragement messages between friends. Good retention feature but adds complexity. Consider for v3.
- **Dua request feature** — Islamic-context social interaction. Meaningful but requires notification infrastructure (DEFER-02).
- **Rich friend profiles** — Letters mastered, last active, lesson reached. Deferred in favor of minimal streak-only visibility.
- **QR code friend adding** — Great for study circles/halaqas. Consider adding alongside share links in a future update.

</deferred>

---

*Phase: 08-cloud-sync-social*
*Context gathered: 2026-04-02*
