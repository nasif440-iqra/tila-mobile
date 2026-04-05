# Phase 2: Quiz Experience - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 02-quiz-experience
**Areas discussed:** LetterHero presentation, Correct answer feedback, Wrong answer feedback, Quiz Arabic sizing

---

## LetterHero Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Full hero takeover | Letter fills ~40% screen, 160-180px circle, quizHero 72px, breathing glow | |
| Enhanced current | Keep 120px circle, add breathing animation. Subtler change | |
| You decide | Claude picks the approach for 'living presence' | ✓ |

**User's choice:** Claude's discretion on prominence approach
**Notes:** User trusts Claude to pick the right prominence level.

| Option | Description | Selected |
|--------|-------------|----------|
| WarmGlow with breathing | WarmGlow + breathing token. Avoids re-architecture | ✓ |
| AtmosphereBackground integration | Full atmosphere system behind quiz screen | |
| Both layers | AtmosphereBackground + WarmGlow personal glow | |

**User's choice:** WarmGlow with breathing (Recommended)

---

## Correct Answer Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Gold border expansion | Warm gold border ring expands outward, clean Reanimated | ✓ |
| Background wash | Gold color washes across from tap point | |
| Glow bloom | WarmGlow appears and blooms outward | |

**User's choice:** Gold border expansion (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Simultaneous dim | All other options dim as correct one ripples | ✓ |
| Staggered delay | Ripple first (~300ms), then others fade | |
| You decide | Claude picks natural timing | |

**User's choice:** Simultaneous (Recommended)

---

## Wrong Answer Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Warm cream panel | Replace danger colors with cream bg + brown text, remove X icon | ✓ |
| Minimal inline | No panel, just highlight correct with small hint | |
| You decide | Claude designs warm/encouraging panel | |

**User's choice:** Warm cream panel (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Soft tap only | Replace hapticError with hapticTap — gentle acknowledge | ✓ |
| No haptic on wrong | Remove haptic entirely on wrong | |
| Keep current hapticError | Keep existing error haptic | |

**User's choice:** Soft tap only (Recommended)

---

## Quiz Arabic Sizing

| Option | Description | Selected |
|--------|-------------|----------|
| New 'quizOption' tier at 52px | Dedicated tier between large (36px) and quizHero (72px) | ✓ |
| Hardcode 48px in QuizOption | Direct fontSize, bypasses design system | |
| Reuse 'large' tier (36px) | Existing tier, smaller than target | |

**User's choice:** New 'quizOption' tier at 52px (Recommended)

---

## Claude's Discretion

- LetterHero circle size and prominence approach
- Gold ripple exact color, dim opacity values
- WrongAnswerPanel warm cream/brown exact colors
- Animation easing curves
- Reduce Motion fallback for new quiz animations

## Deferred Ideas

None — discussion stayed within phase scope
