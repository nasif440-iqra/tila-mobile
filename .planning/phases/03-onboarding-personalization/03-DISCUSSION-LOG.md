# Phase 3: Sacred Moments - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 03-sacred-moments
**Areas discussed:** Phrase reveal design, Bismillah micro-lesson, Onboarding atmosphere, Finish screen gravity

**Note:** Previous CONTEXT.md and discussion log were from a stale roadmap ("Onboarding & Personalization" — name input, motivation picker). Replaced entirely with Sacred Moments context matching current ROADMAP.md.

---

## Phrase Reveal Design

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-timed | Words reveal automatically with staggered timing. Tap to skip ahead. | ✓ |
| Tap-to-reveal | Each word reveals on tap. User controls pace. | |
| Auto then hold | Words auto-reveal, then full phrase holds 2-3s before CTA. | |

**User's choice:** Auto-timed
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Below each word | Transliteration fades in beneath each Arabic word after it reveals. | ✓ |
| Bottom strip | Full transliteration appears as single line after all words reveal. | |
| You decide | Claude picks. | |

**User's choice:** Below each word
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Shared primitive | Build a PhraseReveal component used by Bismillah, Tilawah, Hadith. | ✓ |
| Per-screen | Each screen implements its own reveal. | |

**User's choice:** Shared primitive
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Only Bismillah | English meaning per-word only in Bismillah. Others show full translation after reveal. | ✓ |
| All sacred screens | Every word-by-word reveal includes meaning beneath transliteration. | |
| You decide | Claude picks. | |

**User's choice:** Only Bismillah
**Notes:** None

---

## Bismillah Micro-Lesson

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-reveal all 4 | All 4 units auto-reveal sequentially using PhraseReveal. CTA appears after. | ✓ |
| Tap per segment | Each segment reveals on tap. | |
| Auto-reveal, tap to continue | Words auto-reveal, screen waits for tap to advance. | |

**User's choice:** Auto-reveal all 4
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Wait for CTA tap | After reveal, show CTA button. User absorbs at own pace. | ✓ |
| Auto-advance after hold | After reveal + 3-4s hold, auto-advance. | |

**User's choice:** Wait for CTA tap
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked vertical | Each unit on its own row: Arabic, transliteration, meaning. | ✓ |
| Two columns | Arabic + transliteration left, meaning right. | |
| You decide | Claude picks. | |

**User's choice:** Stacked vertical
**Notes:** None

---

## Onboarding Atmosphere

| Option | Description | Selected |
|--------|-------------|----------|
| All screens | Wrap entire onboarding flow in AtmosphereBackground 'onboarding' preset. | ✓ |
| Sacred screens only | Only Bismillah, Tilawah, Hadith get atmosphere. | |
| Per-screen presets | Different preset per screen type. | |

**User's choice:** All screens
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Background only | Add AtmosphereBackground. Keep existing animations and BrandedLogo. | ✓ |
| Background + WarmGlow | Add AtmosphereBackground + centered WarmGlow behind logo. | |
| You decide | Claude picks. | |

**User's choice:** Background only (for Welcome screen)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with phrase reveal | Replace static Arabic with PhraseReveal. Remove ShimmerWord. Keep headline/motto. | ✓ |
| Add reveal, keep shimmer | Add PhraseReveal for Arabic, keep ShimmerWord on "Tilawat". | |
| You decide | Claude picks. | |

**User's choice:** Replace with phrase reveal (for Tilawah screen)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Keep arch + glow, add reveal | Keep ArchOutline and WarmGlow. Replace static quote with PhraseReveal. | ✓ |
| Simplify to reveal only | Remove ArchOutline and WarmGlow, let AtmosphereBackground handle atmosphere. | |
| You decide | Claude picks. | |

**User's choice:** Keep arch + glow, add reveal (for Hadith screen)
**Notes:** None

---

## Finish Screen Gravity

| Option | Description | Selected |
|--------|-------------|----------|
| Gentle fade + settle | Replace bouncy spring with slow fade-in + subtle scale settle (1.02→1.0). | ✓ |
| Remove checkmark entirely | No checkmark. Just headline with gentle entrance. | |
| Keep checkmark, soften spring | Keep checkmark but replace bouncy with gentle ease-out. | |

**User's choice:** Gentle fade + settle
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Alif watermark | Subtle, ties back to first letter. Ambient, not performative. | ✓ |
| Remove it | Let AtmosphereBackground handle all ambient visuals. | |

**User's choice:** Keep it
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Keep "Start Lesson 1" | Direct, clear, grounding after emotional buildup. | ✓ |
| Change to "Begin" | Simpler, echoes "You've already begun." | |
| You decide | Claude picks. | |

**User's choice:** Keep "Start Lesson 1"
**Notes:** None

---

## Claude's Discretion

- PhraseReveal animation easing curves and exact timing values
- Reduce Motion fallback for PhraseReveal
- Where to place AtmosphereBackground wrapper
- Exact scale settle curve for Finish checkmark
- Bismillah CTA text
- Typography sizing for transliteration
- PhraseReveal component location

## Deferred Ideas

None
