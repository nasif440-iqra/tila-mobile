# Phase 1: Lesson Flow Hardening - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning
**Source:** MASTER-PLAN.md (Block 1, items 1.1 and 1.2)

<domain>
## Phase Boundary

Fix the two highest-priority bugs in the lesson completion flow:
1. Lesson completion writes are not atomic — a crash mid-completion can leave partially written progress, mastery, or review data
2. Mastery celebration UI reads from a stale hook closure instead of fresh post-write data, causing celebrations to silently not appear

This phase does NOT touch audio, RevenueCat, scaffold cleanup, or any UI beyond the celebration display.

</domain>

<decisions>
## Implementation Decisions

### Atomic Completion
- Wrap all completion writes in a single `db.withExclusiveTransactionAsync()` call
- The transaction must return fresh post-write state (mastery data) that the UI can consume directly
- A failure during the transaction must roll back ALL writes — no partial state

### Mastery Celebration Fix
- The celebration UI must use the fresh mastery data returned from the completion transaction
- Do NOT re-read from the hook after completion — the hook closure is stale in the same render cycle
- This task depends on the atomic completion being done first (1.1 → 1.2 dependency)

### Claude's Discretion
- Exact transaction structure and what data to return
- Whether to refactor the completion into a dedicated command/function or modify the existing hook
- Test implementation details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Lesson Completion Flow
- `src/hooks/useLessonQuiz.ts` — Current lesson completion hook (contains the completion logic)
- `src/db/client.ts` — Database client with `withExclusiveTransactionAsync` API
- `src/engine/mastery.js` — Mastery state updates called during completion

### Expert Review Context
- `MASTER-PLAN.md` — Block 1, items 1.1 and 1.2 (full problem description and fix direction)

</canonical_refs>

<specifics>
## Specific Ideas

- Code review (Document 2) identified this exact pattern: "The lesson completion path appears to snapshot mastery state, await lesson completion, and then inspect mastery again to determine whether to show newly-mastered celebration UI. Because the hook state refreshes asynchronously, the second read can still reflect the stale closure value from the same render cycle."
- The v1.0 milestone already used `withExclusiveTransactionAsync` successfully for the habit race condition fix (Phase 1, Plan 03) — same pattern applies here.
- Completion should behave as "one atomic domain event" per code review feedback.

</specifics>

<deferred>
## Deferred Ideas

- Full shared state layer refactor (Block 3, Phase 8) — will eventually replace isolated hook refreshes with canonical shared state. This phase does the targeted fix; the architecture comes later.

</deferred>

---

*Phase: 01-lesson-flow-hardening*
*Context gathered: 2026-04-01 via MASTER-PLAN.md*
