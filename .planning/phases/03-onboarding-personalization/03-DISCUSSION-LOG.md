# Phase 3: Onboarding & Personalization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 03-onboarding-personalization
**Areas discussed:** Name input placement, Home greeting, Wird explanation

---

## Name Input Placement & UX

| Option | Description | Selected |
|--------|-------------|----------|
| Combined step (Recommended) | One new step: name + motivation picker. Net +1 step (10 total). | ✓ |
| Name only, infer motivation | Just name. Motivation auto-inferred from startingPoint. | |
| Name only, skip motivation | Just name. Don't populate motivation. | |

**User's choice:** Combined step
**Notes:** Keeps onboarding tight while collecting both pieces of data.

---

## Step Placement

| Option | Description | Selected |
|--------|-------------|----------|
| After StartingPoint (step 3) | Before spiritual moment. | |
| After Welcome (step 0) | Early personalization. | |
| Before Finish (step 8) | After experiencing the learning preview. | ✓ |

**User's choice:** Before Finish
**Notes:** Less friction upfront — user has context for why they're sharing after experiencing the learning demo.

---

## Home Greeting Style

| Option | Description | Selected |
|--------|-------------|----------|
| Name + motivation message | "Assalamu Alaikum, Amira / Building toward confident salah" | ✓ |
| Name only, keep dynamic subtitle | "Assalamu Alaikum, Amira / 5 letters down" | |
| Name in subtitle | "Assalamu Alaikum / Amira, you're 5 letters in" | |

**User's choice:** Name + motivation message

---

## Greeting Fallback (no name)

| Option | Description | Selected |
|--------|-------------|----------|
| Generic + motivation | "Assalamu Alaikum / Building toward confident salah" | ✓ |
| Current behavior | "Assalamu Alaikum / 5 letters down" | |

**User's choice:** Generic + motivation — still personalized by intent even without name.

---

## Wird Explanation Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Auto tooltip on first view | Small card appears automatically first time. Dismisses on tap. One-time. | ✓ |
| Tap-to-learn icon | Info icon next to badge. Always available. | |
| Inline text below badge | Brief text below count. Fades after 3 views. | |

**User's choice:** Auto tooltip on first view

---

## Claude's Discretion

- Exact visual design of tooltip
- Name + motivation step layout design
- DB migration version number
- Test approach

## Deferred Ideas

None
