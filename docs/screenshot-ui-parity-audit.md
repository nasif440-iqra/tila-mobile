# Screenshot UI Parity Audit: Web vs Expo

**Date:** 2026-03-29
**Screenshots:** 12 web (`compare/web/`) + 17 expo (`compare/expo/`)

---

## Critical Finding: expo-linear-gradient BROKEN on device

**IMG_2086** shows `"Unimplemented component: <ViewManagerAdapter_ExpoLinearGradient>"` rendered as visible error text. This means **every LinearGradient in the app is silently failing**:

- Warm ambient top gradients (home, quiz, progress, intro, summary) — invisible
- WarmGlow radial component — invisible
- All "atmosphere" effects — gone

**This single issue explains 70%+ of the visual gap.** The app falls back to flat solid backgrounds everywhere.

---

## Screen-by-Screen Gaps

### Quiz Screen (Priority 1)
| Web | Expo | Gap |
|-----|------|-----|
| Large Arabic letter in soft circle with radial glow | Tiny letter (48px) floating in empty space | Letter too small, no circle, no glow |
| Card-style options with depth shadows | Flat white rectangles, barely visible borders | No card depth or lift |
| Warm gradient background creating atmosphere | Flat cream (#F8F6F0), no warmth | LinearGradient broken |
| Compact, proportioned layout | Massive empty space above/below letter | Bad vertical distribution |

### Home Screen (Priority 2)
| Web | Expo | Gap |
|-----|------|-----|
| Hero card with visible glow behind letter circle | Card renders but WarmGlow invisible | LinearGradient broken |
| Warm top gradient creating depth | Flat background | LinearGradient broken |
| Card shadows creating lift | Very subtle shadows (0.06 opacity) | Shadows too subtle for mobile |

### Lesson Intro (Priority 3)
| Web | Expo | Gap |
|-----|------|-----|
| Letter circles with visible golden radial glow | Circles render but glow invisible | WarmGlow broken (LinearGradient) |
| Warm ambient gradient | Flat background | LinearGradient broken |

### Lesson Summary (Priority 3)
| Web | Expo | Gap |
|-----|------|-----|
| Rich celebration with warm glow | Error text visible, pink fallback background | LinearGradient crashes visibly |
| Score proportional glow intensity | No glow at all | WarmGlow broken |

### Progress Screen (Priority 4)
| Web | Expo | Gap |
|-----|------|-----|
| Warm top gradient | Flat background | LinearGradient broken |
| Clean but warm atmosphere | Clinical, no depth | Missing warmth layer |

### Onboarding (Priority 5)
| Web | Expo | Gap |
|-----|------|-----|
| Warm, welcoming atmosphere | Clean but sterile | Missing gradient warmth |
| Wird intro has golden glow | No visible glow | LinearGradient broken |

---

## Implementation Plan

### Fix 1: Replace LinearGradient with View-based alternatives
Rewrite WarmGlow to use concentric View layers with opacity (no LinearGradient dependency). Replace all ambient LinearGradient overlays with simple View-based warm tint layers.

### Fix 2: Quiz letter size and presentation
Increase `arabicDisplay` from 48px to 72px. Add letter circle container around quiz prompt. Add View-based glow behind letter.

### Fix 3: Quiz option card depth
Increase shadow values for card shadow preset. Add visible border styling.

### Fix 4: Shadow intensity across app
Mobile screens need stronger shadows than web. Increase shadowOpacity and shadowRadius for all presets.
