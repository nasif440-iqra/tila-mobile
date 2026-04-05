# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 01-foundation
**Areas discussed:** Ambient system, Arabic fix scope, Animation tiers, Reduce Motion

---

## Ambient System

| Option | Description | Selected |
|--------|-------------|----------|
| Root layout | One ambient layer in app/_layout.tsx wraps everything | |
| Per-screen wrapper | Each screen wraps in AmbientScreen | |
| You decide | Claude picks best approach | ✓ |

**User's choice:** Claude's discretion — pick what works best with Expo Router structure

| Option | Description | Selected |
|--------|-------------|----------|
| Relocate + enhance | Move WarmGlow to design/atmosphere/, keep API, add Reduce Motion | |
| Replace entirely | Build new AmbientBackground from scratch | |
| You decide | Claude picks based on codebase needs | ✓ |

**User's choice:** Claude's discretion — decide based on what codebase needs

| Option | Description | Selected |
|--------|-------------|----------|
| Preset system | Named presets (home, sacred, quiz) | |
| Raw composition | Screens compose gradients directly | |
| You decide | Claude picks approach | ✓ |

**User's choice:** Claude's discretion

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, replace all | Clean break, remove WarmGradient entirely | |
| Deprecate only | Mark deprecated, migrate incrementally | |
| You decide | Claude decides based on effort vs consistency | ✓ |

**User's choice:** Claude's discretion
**Notes:** User gave Claude full discretion on all ambient architecture decisions

---

## Arabic Fix Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Fix all tiers | Update display, large, AND body. Add overflow. Add quiz-hero tier. | ✓ |
| Display only | Just fix 72px display tier | |
| You decide | Claude assesses and fixes what needs fixing | |

**User's choice:** Fix all tiers — full audit
**Notes:** Explicit decision to be aggressive on Arabic typography

---

## Animation Tiers

| Option | Description | Selected |
|--------|-------------|----------|
| Meditative (4.5s) | 2s inhale, 0.5s hold, 2s exhale | ✓ |
| Slower (6-8s) | More like candlelight | |
| You decide | Claude picks | |

**User's choice:** Meditative 4.5s breathing cycle

| Option | Description | Selected |
|--------|-------------|----------|
| 18-24 seconds | Barely perceptible, like sunlight | ✓ |
| 30-45 seconds | Almost invisible | |
| You decide | Claude picks within 18-32s range | |

**User's choice:** 18-24 second drift cycle

---

## Reduce Motion

| Option | Description | Selected |
|--------|-------------|----------|
| Full accessibility | Disable ALL ambient, replace entrances with opacity fades | ✓ |
| Ambient only | Only disable breathing/drift, keep entrances | |
| You decide | Claude implements brief + Apple guidelines | |

**User's choice:** Full accessibility — matches the design brief exactly

---

## Claude's Discretion

- Ambient system architecture (root vs per-screen, preset vs composition, WarmGlow strategy)
- WarmGradient migration approach
- Specific lineHeight values per tier
- Animation easing curves
- FloatingLettersLayer fix approach

## Deferred Ideas

None
