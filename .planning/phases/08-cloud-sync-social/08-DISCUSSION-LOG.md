# Phase 8: Cloud Sync & Social - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 08-cloud-sync-social
**Areas discussed:** Backend & Auth, Sync Architecture, Social Features, Phase Splitting

---

## Backend & Auth

### Q1: Backend Service

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase | Postgres + Auth + Realtime + RLS. Free tier generous. React Native SDK. | ✓ |
| Firebase | Firestore + Firebase Auth. Mature RN support. NoSQL. | |
| Custom backend | Build own API. Full control, much more work. | |

**User's choice:** Supabase (Recommended)

### Q2: Auth Methods

| Option | Description | Selected |
|--------|-------------|----------|
| Email + password | Standard registration. Supabase handles verification. | ✓ |
| Google Sign-In | One-tap Google login. | ✓ |
| Apple Sign-In | Required by Apple if offering social login. | ✓ |
| Anonymous first | Start anonymous, upgrade later. | |

**User's choice:** Email + password, Google Sign-In, Apple Sign-In (all three)

### Q3: Account Gate Timing

| Option | Description | Selected |
|--------|-------------|----------|
| After lesson 3 | Enough investment to justify. "Save your progress" framing. | ✓ |
| During onboarding | Part of initial setup. Higher friction. | |
| After lesson 7 | Bundle with premium conversion. | |
| Never required | Always optional. Periodic prompts. | |

**User's choice:** After lesson 3 (Recommended)

### Q4: Dismissability

| Option | Description | Selected |
|--------|-------------|----------|
| Soft prompt (dismissable) | Re-appears at lesson 5 and 7. Not blocking. | ✓ |
| Dismiss once only | Second prompt is a hard gate. | |
| Hard gate | Must create account to continue. | |

**User's choice:** Yes, soft prompt (Recommended)

---

## Sync Architecture

### Q1: Conflict Resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Last-write-wins | Timestamp-based. Conflicts rare for single-user learning app. | ✓ |
| Field-level merge | Merge individual fields. More complex. | |
| Prompt user | Show conflict, let user choose. Worst UX. | |

**User's choice:** Last-write-wins (Recommended)

### Q2: Sync Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All user tables | Mastery, completions, habits, profile | ✓ |

**User's choice:** "You decide" — Claude selected syncing all user-facing tables.

### Q3: Sync Timing

| Option | Description | Selected |
|--------|-------------|----------|
| After each lesson + foreground | Batched, low frequency. | ✓ |
| Real-time | Every write immediately. Overkill. | |
| Manual only | User taps sync. Least automatic. | |

**User's choice:** After each lesson (Recommended)

---

## Social Features

### Q1: Friend Discovery

| Option | Description | Selected |
|--------|-------------|----------|
| Share link/code | Unique invite link. No contact permissions. | ✓ |
| Username search | Create usernames, search. Requires exact match. | |
| QR code | In-person only. | |
| You decide | Claude picks. | |

**User's choice:** Share link/code (Recommended)

### Q2: Friend Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Streak + lesson reached | Motivating without accuracy scores. | |
| Minimal (streak only) | Maximum privacy. | ✓ |
| Rich profile | Streak + lesson + letters + last active. | |
| You decide | Claude picks supportive approach. | |

**User's choice:** Minimal (streak only)

### Q3: Interaction Model

| Option | Description | Selected |
|--------|-------------|----------|
| View-only | Friends list shows streaks. No messaging. | ✓ |
| Nudge/encourage | Pre-written encouragement. One-tap. | |
| Dua requests | Islamic-context prayer requests. | |

**User's choice:** View-only (Recommended)

---

## Phase Splitting

### Q1: Split Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| 3 waves | A: Infra+auth+sync. B: Social+return. C: Dark mode+tests. | |
| 2 waves | A: Infra+auth+sync. B: Social+polish+tests. | ✓ |
| 1 phase | All 9 requirements at once. | |

**User's choice:** Split into 2 waves

### Q2: Wave Composition

| Option | Description | Selected |
|--------|-------------|----------|
| A: Infra+Auth+Sync, B: Social+Polish | Wave A: RET-02/03/04/06/07. Wave B: RET-05/08/09/10. | ✓ |
| A: Infra+Auth+Sync+Dark, B: Social+Tests | Dark mode in Wave A as quick win. | |
| You decide | Claude groups by dependency order. | |

**User's choice:** A: Infra+Auth+Sync, B: Social+Polish (Recommended)

---

## Claude's Discretion

- Sync scope: all user-facing SQLite tables (mastery, completions, habits, profile). RevenueCat handles subscription state separately.

## Deferred Ideas

- Nudge/encourage system — pre-written encouragement messages
- Dua request feature — Islamic-context social interaction
- Rich friend profiles — letters mastered, last active, lesson reached
- QR code friend adding — in-person study circle use case
