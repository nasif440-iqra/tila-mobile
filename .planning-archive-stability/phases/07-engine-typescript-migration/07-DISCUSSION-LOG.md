# Phase 7: Engine TypeScript Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 07-engine-typescript-migration
**Areas discussed:** Type strictness, Type organization, Migration strategy, Existing any cleanup

---

## Type Strictness Level

| Option | Description | Selected |
|--------|-------------|----------|
| Pragmatic strict | Typed interfaces at boundaries, Record<string, any> at DB rows | ✓ |
| Full strict (no any anywhere) | Maximum type safety, requires DB row typing | |
| Loose (ts-nocheck / as any) | Fast rename, no real safety gained | |

**User's choice:** Deferred to Claude's research — Claude recommended pragmatic strict
**Notes:** Existing .ts files already use Record<string, any> at DB boundaries (8 occurrences). This is a deliberate architectural choice matching the "no business logic changes" constraint.

---

## Type Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Extend src/types/ directory | Consistent with existing quiz.ts, mastery.ts pattern | ✓ |
| Co-located types only | Types inline in each engine file | |
| Hybrid | Shared in src/types/, internal co-located | |

**User's choice:** Deferred to Claude's research — Claude recommended extending src/types/
**Notes:** Project already has 6 type files in src/types/ imported by both engine and UI. Natural extension of existing pattern.

---

## Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Leaf-first file-by-file | Start with zero-dependency files, work inward, commit each | ✓ |
| Rename-all-then-fix | Rename all 18 at once, fix errors in bulk | |
| Standard file-by-file | One at a time in arbitrary order | |

**User's choice:** Deferred to Claude's research — Claude recommended leaf-first file-by-file
**Notes:** App must stay buildable at every step. Solo founder, App Store deadline. Dependency order minimizes temporary workarounds.

---

## Existing any Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Defer to separate task | Focus only on .js→.ts conversion | ✓ |
| Fix alongside migration | Clean up existing any while in the files | |

**User's choice:** Deferred to Claude's research — Claude recommended deferring
**Notes:** The 8 existing `any` usages are all DB-boundary types (Record<string, any> for SQLite rows). Fixing requires DB row interface definitions — scope creep into DB layer.

---

## Claude's Discretion

- All 4 areas: User explicitly requested Claude research independently and decide ("I am a non-technical founder. Do some independent research, check with other models, and confirm your hypothesis")
- Interface names, type file organization, commit granularity

## Deferred Ideas

- DB row typing (eliminate remaining any in insights.ts/progress.ts)
- Strict mode escalation (noImplicitAny, strictNullChecks project-wide)
