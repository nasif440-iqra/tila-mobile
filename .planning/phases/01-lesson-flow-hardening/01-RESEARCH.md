# Phase 1: Lesson Flow Hardening - Research

**Researched:** 2026-04-01
**Domain:** SQLite transaction atomicity, React hook stale closure prevention
**Confidence:** HIGH

## Summary

Phase 1 fixes two tightly coupled bugs in the lesson completion flow. Bug 1: the `completeLesson` function in `useProgress.ts` performs 4+ sequential DB writes (lesson attempt, question attempts, mastery entities, mastery skills, mastery confusions) without wrapping them in a transaction, meaning a crash mid-write can leave partial state. Bug 2: after `completeLesson` finishes, the lesson screen in `app/lesson/[id].tsx` reads `progress.mastery` to detect newly mastered letters for celebration display, but this reads from the React state that was refreshed via `refresh()` at the end of `completeLesson` -- which triggers a re-render asynchronously, meaning the comparison on lines 160-175 reads stale pre-completion mastery data.

The fix pattern is already proven in this codebase: `useHabit.ts` uses `db.withExclusiveTransactionAsync(async (txn) => {...})` to do atomic read-modify-write. The same pattern applies here, with the additional requirement that the transaction must return the fresh post-write mastery state so the caller can use it directly for celebration detection instead of reading from stale React state.

**Primary recommendation:** Refactor `completeLesson` to use `db.withExclusiveTransactionAsync`, return fresh mastery state from the transaction, and have the lesson screen use that returned data directly for celebration detection.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Wrap all completion writes in a single `db.withExclusiveTransactionAsync()` call
- The transaction must return fresh post-write state (mastery data) that the UI can consume directly
- A failure during the transaction must roll back ALL writes -- no partial state
- The celebration UI must use the fresh mastery data returned from the completion transaction
- Do NOT re-read from the hook after completion -- the hook closure is stale in the same render cycle
- This task depends on the atomic completion being done first (1.1 then 1.2 dependency)

### Claude's Discretion
- Exact transaction structure and what data to return
- Whether to refactor the completion into a dedicated command/function or modify the existing hook
- Test implementation details

### Deferred Ideas (OUT OF SCOPE)
- Full shared state layer refactor (Block 3, Phase 8) -- will eventually replace isolated hook refreshes with canonical shared state. This phase does the targeted fix; the architecture comes later.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STAB-01 | Lesson completion writes are atomic -- wrapped in a single DB transaction that returns fresh post-write state | `withExclusiveTransactionAsync` API proven in useHabit.ts; completeLesson currently does 4+ sequential non-transactional writes |
| STAB-02 | Mastery celebration uses fresh data from the completion transaction, not a stale hook closure | Current code reads `progress.mastery` after async `completeLesson` -- stale closure. Fix: return mastery from transaction, use directly in handleQuizComplete |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-sqlite | 55.0.11 | SQLite database with transaction API | Already in use; provides `withExclusiveTransactionAsync` |
| vitest | 4.1.2 | Unit testing | Already configured with setup file and coverage |

No new dependencies needed. This phase uses only existing libraries.

## Architecture Patterns

### Current Completion Flow (BROKEN)

```
LessonScreen.handleQuizComplete()
  -> Snapshot pre-mastery states from progress.mastery (React state)
  -> progress.completeLesson()
       -> saveCompletedLesson(db, ...)           // Write 1 (no transaction)
       -> saveQuestionAttempts(db, ...)           // Write 2..N (no transaction)
       -> loadProgress(db)                        // Read fresh from DB
       -> mergeQuizResultsIntoMastery()           // Compute in memory
       -> saveMasteryEntity(db, ...) x N          // Write N+1..M (no transaction)
       -> saveMasterySkill(db, ...) x N           // More writes (no transaction)
       -> saveMasteryConfusion(db, ...) x N       // More writes (no transaction)
       -> refresh()                               // Triggers setState -> async re-render
  -> Compare progress.mastery (STALE - refresh hasn't re-rendered yet)
  -> Newly mastered letters: always empty (stale === stale)
```

### Target Completion Flow (FIXED)

```
LessonScreen.handleQuizComplete()
  -> progress.completeLesson() returns { attemptId, updatedMastery }
       -> db.withExclusiveTransactionAsync(async (txn) => {
            -> txn: saveCompletedLesson           // All writes in one transaction
            -> txn: saveQuestionAttempts
            -> txn: read fresh mastery
            -> txn: compute merged mastery
            -> txn: saveMasteryEntity x N
            -> txn: saveMasterySkill x N
            -> txn: saveMasteryConfusion x N
          })
       -> refresh()                               // Update React state for future reads
       -> return { attemptId, updatedMastery }     // Fresh data for immediate use
  -> Use updatedMastery directly for celebration detection (not progress.mastery)
  -> Newly mastered letters: computed from fresh transaction output
```

### Pattern: withExclusiveTransactionAsync (proven in codebase)

**What:** Wraps all DB operations in an exclusive SQLite transaction. The callback receives a `txn` parameter that must be used for all reads/writes inside the transaction.

**When to use:** Any multi-write operation where partial completion would corrupt state.

**Example from useHabit.ts (already working):**
```typescript
await db.withExclusiveTransactionAsync(async (txn) => {
  // Read fresh from DB inside transaction
  const row = await txn.getFirstAsync<{...}>('SELECT ... FROM habit WHERE id = 1');
  // Compute updates
  // Write back through txn
  await txn.runAsync('UPDATE habit SET ... WHERE id = 1', ...);
});
```

### Pattern: Return Fresh State from Completion

**What:** `completeLesson` returns the updated mastery state computed inside the transaction, rather than relying on React state refresh.

**Why:** React `setState` is async. After `completeLesson` returns, the calling component still has the old `progress.mastery` in its closure. By returning the fresh data, the caller can use it immediately.

```typescript
// In useProgress.ts
const completeLesson = useCallback(async (...) => {
  let updatedMastery: MasteryState;
  
  await db.withExclusiveTransactionAsync(async (txn) => {
    // ... all writes via txn ...
    updatedMastery = computedMastery; // capture the fresh state
  });
  
  await refresh(); // update React state for future reads
  return { attemptId, updatedMastery }; // return for immediate use
}, [db, refresh]);
```

### Anti-Patterns to Avoid
- **Using `db` inside `withExclusiveTransactionAsync` callback:** Must use the `txn` parameter. Using `db` defeats transaction isolation.
- **Reading React state after async DB write:** The state reflects the pre-write snapshot. Always pass fresh data explicitly.
- **Calling existing save functions with `db`:** The existing `saveCompletedLesson`, `saveMasteryEntity`, etc. take a `db: SQLiteDatabase` parameter. Inside the transaction, pass `txn` instead (it extends `SQLiteDatabase`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Transaction management | Manual BEGIN/COMMIT/ROLLBACK | `db.withExclusiveTransactionAsync` | Handles rollback on error, connection isolation |
| Mastery computation | New merge logic | Existing `mergeQuizResultsIntoMastery` | Already correct, just needs transactional context |
| Mastery state derivation | Custom state detection | Existing `deriveMasteryState` | Already handles all mastery states correctly |

## Common Pitfalls

### Pitfall 1: Using `db` Instead of `txn` Inside Transaction
**What goes wrong:** Code inside `withExclusiveTransactionAsync` calls existing functions with `db` instead of `txn`, defeating transaction isolation.
**Why it happens:** The existing save functions (`saveCompletedLesson`, `saveMasteryEntity`, etc.) all accept `db: SQLiteDatabase`. The `txn` parameter also extends `SQLiteDatabase`, so TypeScript won't catch the mistake.
**How to avoid:** Pass `txn` to all save functions inside the transaction callback. Review every DB call inside the callback to ensure it uses `txn`.
**Warning signs:** Tests pass but crash recovery doesn't work (writes go through `db` outside the transaction boundary).

### Pitfall 2: Forgetting to Return Fresh Mastery from completeLesson
**What goes wrong:** `completeLesson` wraps writes in a transaction but doesn't return the updated mastery. The lesson screen still reads from stale `progress.mastery`.
**Why it happens:** The transaction fix (STAB-01) and the celebration fix (STAB-02) feel independent, but they're coupled: the transaction produces the fresh data that the celebration needs.
**How to avoid:** Change `completeLesson` return type from `Promise<number>` (attemptId) to `Promise<{ attemptId: number; updatedMastery: MasteryState }>`.

### Pitfall 3: loadProgress Inside Transaction Re-reads Uncommitted State
**What goes wrong:** The current code calls `loadProgress(db)` to get fresh mastery before merging. Inside a transaction, this read must go through `txn` to see the writes made earlier in the same transaction.
**Why it happens:** SQLite WAL mode means reads through `db` see the last committed state, not uncommitted transaction writes.
**How to avoid:** Either read mastery through `txn` directly (preferred) or restructure so the fresh mastery is computed without needing to re-read from DB inside the transaction. Since the transaction starts by writing the lesson attempt and question attempts, reading mastery entities through `txn` is sufficient because mastery tables haven't been modified yet at that point in the transaction.

### Pitfall 4: Existing Save Functions May Need Overloaded Versions
**What goes wrong:** The existing `saveCompletedLesson`, `saveMasteryEntity` etc. in `progress.ts` accept `db: SQLiteDatabase`. You need to pass `txn` but `txn` is of type `Transaction` which extends `SQLiteDatabase`.
**Why it happens:** TypeScript compatibility.
**How to avoid:** This should work out of the box since `Transaction extends SQLiteDatabase`. Just pass `txn` where `db` is expected. Verify with typecheck.

## Code Examples

### Example 1: Atomic completeLesson with Transaction

```typescript
// In useProgress.ts - refactored completeLesson
const completeLesson = useCallback(
  async (
    lessonId: number,
    accuracy: number,
    passed: boolean,
    questions: QuestionAttempt[],
    quizResultItems?: QuizResultItem[]
  ): Promise<{ attemptId: number; updatedMastery: ProgressState['mastery'] }> => {
    let attemptId = 0;
    let updatedMastery = { entities: {}, skills: {}, confusions: {} } as ProgressState['mastery'];

    await db.withExclusiveTransactionAsync(async (txn) => {
      // Write 1: lesson attempt
      const result = await txn.runAsync(
        'INSERT INTO lesson_attempts (lesson_id, accuracy, passed) VALUES (?, ?, ?)',
        lessonId, accuracy, passed ? 1 : 0
      );
      attemptId = result.lastInsertRowId;

      // Write 2..N: question attempts
      for (const q of questions) {
        await txn.runAsync(
          'INSERT INTO question_attempts (attempt_id, question_type, skill_bucket, target_entity, correct, selected_option, correct_option, response_time_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          attemptId, q.questionType, q.skillBucket, q.targetEntity,
          q.correct ? 1 : 0, q.selectedOption, q.correctOption, q.responseTimeMs
        );
      }

      // Mastery pipeline
      if (quizResultItems && quizResultItems.length > 0) {
        const today = new Date().toISOString().slice(0, 10);
        
        // Read current mastery through txn (sees uncommitted writes)
        const entityRows = await txn.getAllAsync<{...}>('SELECT ... FROM mastery_entities');
        // ... build currentMastery from rows ...
        
        const enriched = quizResultItems.map(r => ({
          ...r,
          targetKey: normalizeEntityKey(r.targetId, r),
        }));
        updatedMastery = mergeQuizResultsIntoMastery(currentMastery, enriched, today);

        // Write mastery updates through txn
        for (const [key, entity] of Object.entries(updatedMastery.entities)) {
          await saveMasteryEntity(txn, key, entity as EntityState);
        }
        // ... skills, confusions ...
      }
    });

    // After transaction commits, update React state for future reads
    await refresh();

    return { attemptId, updatedMastery };
  },
  [db, refresh]
);
```

### Example 2: Lesson Screen Using Fresh Mastery for Celebration

```typescript
// In app/lesson/[id].tsx - refactored handleQuizComplete
const handleQuizComplete = useCallback(async (results) => {
  // Snapshot pre-mastery for comparison
  const today = new Date().toISOString().slice(0, 10);
  const currentMastery = progress.mastery ?? { entities: {}, skills: {}, confusions: {} };
  const preMasteryStates = new Map<string, string>();
  for (const [key, entity] of Object.entries(currentMastery.entities)) {
    preMasteryStates.set(key, deriveMasteryState(entity, today));
  }

  const { updatedMastery } = await progress.completeLesson(
    lesson!.id, accuracy, passed, attempts, results.questions
  );

  // Use updatedMastery directly -- NOT progress.mastery (which is stale)
  const newlyMastered = [];
  for (const [key, entity] of Object.entries(updatedMastery.entities)) {
    const oldState = preMasteryStates.get(key) ?? "introduced";
    const newState = deriveMasteryState(entity, today);
    if (newState === "retained" && oldState !== "retained") {
      // ... push to newlyMastered
    }
  }
}, [lesson, progress]);
```

### Example 3: Regression Test Pattern (Source Analysis)

```typescript
// Following the pattern from habit-race.test.ts
import fs from 'fs';
import path from 'path';

const progressHookSrc = fs.readFileSync(
  path.resolve(__dirname, '../hooks/useProgress.ts'), 'utf-8'
);

describe('completeLesson atomicity - STAB-01 regression', () => {
  it('uses withExclusiveTransactionAsync for atomic writes', () => {
    expect(progressHookSrc).toContain('withExclusiveTransactionAsync');
  });

  it('reads and writes through txn parameter, not outer db', () => {
    // Inside the transaction callback, all DB ops must go through txn
    expect(progressHookSrc).toContain('txn.runAsync');
  });
});
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAB-01 | completeLesson wraps all writes in withExclusiveTransactionAsync | unit (source analysis) | `npx vitest run src/__tests__/lesson-completion-atomic.test.ts` | No -- Wave 0 |
| STAB-01 | Transaction rollback on failure leaves DB consistent | unit (source analysis) | Same file | No -- Wave 0 |
| STAB-02 | completeLesson returns fresh mastery state | unit (source analysis) | `npx vitest run src/__tests__/lesson-completion-celebration.test.ts` | No -- Wave 0 |
| STAB-02 | Lesson screen uses returned mastery, not progress.mastery | unit (source analysis) | Same file | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run validate`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/lesson-completion-atomic.test.ts` -- covers STAB-01 (source analysis: withExclusiveTransactionAsync, txn usage)
- [ ] `src/__tests__/lesson-completion-celebration.test.ts` -- covers STAB-02 (source analysis: return type, no stale progress.mastery read)

## Files Requiring Modification

| File | Change | Requirement |
|------|--------|-------------|
| `src/hooks/useProgress.ts` | Wrap completeLesson body in `withExclusiveTransactionAsync`, change return type to include updatedMastery | STAB-01, STAB-02 |
| `app/lesson/[id].tsx` | Use returned updatedMastery from completeLesson for celebration detection instead of progress.mastery | STAB-02 |

### Files NOT Modified
- `src/engine/mastery.js` -- Pure logic, no changes needed
- `src/engine/progress.ts` -- Save functions already accept `SQLiteDatabase` which `Transaction` extends; no changes needed
- `src/db/client.ts` -- Transaction API is already available, no changes needed
- `src/components/LessonQuiz.tsx` -- Only passes results up via onComplete, no changes needed
- `src/hooks/useLessonQuiz.ts` -- Quiz logic only, not involved in completion writes

## Open Questions

1. **Should existing save functions be refactored to accept `Transaction` explicitly?**
   - What we know: `Transaction extends SQLiteDatabase` in expo-sqlite, so passing `txn` where `db` is expected should typecheck
   - What's unclear: Whether the TypeScript compiler will actually accept this without explicit type widening
   - Recommendation: Try passing `txn` directly first. If typecheck fails, cast `txn as SQLiteDatabase` or refactor function signatures to accept `SQLiteDatabase | Transaction`

2. **Should `completeLesson` read mastery from DB inside the transaction, or use the current React state as the base?**
   - What we know: The current code already does `loadProgress(db)` to get fresh mastery before merging. Inside the transaction, mastery tables haven't been written yet when we need to read them, so reading through `txn` gives the same result as reading through `db`
   - What's unclear: Nothing -- this is straightforward
   - Recommendation: Read through `txn` for correctness and consistency with the transaction pattern, even though it would give the same result as `db` at that point in the flow

## Sources

### Primary (HIGH confidence)
- `src/hooks/useProgress.ts` -- Current completeLesson implementation (non-atomic, 4+ sequential writes)
- `src/hooks/useHabit.ts` -- Proven `withExclusiveTransactionAsync` pattern in same codebase
- `app/lesson/[id].tsx` -- Current celebration detection reading stale `progress.mastery`
- `src/engine/progress.ts` -- Save functions accepting `SQLiteDatabase` parameter
- `src/engine/mastery.js` -- `mergeQuizResultsIntoMastery` and `deriveMasteryState` APIs
- `src/__tests__/habit-race.test.ts` -- Existing regression test pattern for transaction atomicity

### Secondary (MEDIUM confidence)
- CLAUDE.md -- Confirms `withExclusiveTransactionAsync` availability in expo-sqlite 55
- `.planning/milestones/v1.0-phases/01-correctness-blockers/01-RESEARCH.md` -- Previous research confirming `txn` parameter receives Transaction type

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all APIs already in use in codebase
- Architecture: HIGH -- exact same pattern as useHabit.ts fix, just applied to completeLesson
- Pitfalls: HIGH -- identified from direct code reading and prior v1.0 implementation experience

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable -- no dependency changes expected)
