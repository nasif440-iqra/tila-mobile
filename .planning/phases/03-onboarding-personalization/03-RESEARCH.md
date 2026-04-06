# Phase 3: Sacred Moments - Research

**Researched:** 2026-04-06
**Domain:** React Native Reanimated staggered word-reveal animations, onboarding atmosphere integration
**Confidence:** HIGH

## Summary

Phase 3 transforms onboarding and Bismillah from static content into spiritual thresholds. The primary technical challenge is building a `PhraseReveal` component that auto-reveals Arabic words sequentially with transliteration fading in beneath each word. This is a pure animation challenge using Reanimated 4.2.1's `withDelay`, `withTiming`, and `withSequence` -- no new libraries needed.

The existing codebase provides strong foundations: `AtmosphereBackground` with 'onboarding' preset is ready to wrap `OnboardingFlow`, `ArabicText` handles Arabic rendering with proper line heights, and `OnboardingStepLayout` with its `splash` variant handles centering and safe areas. The Finish screen already uses `withSpring` with `springs.bouncy` which needs replacing with a gentle timing-based settle.

**Primary recommendation:** Build PhraseReveal as a single reusable component in `src/design/components/`, data-driven by an array of word objects. Apply AtmosphereBackground at the OnboardingFlow level. All animation work uses existing Reanimated APIs -- no new dependencies.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Build a shared `PhraseReveal` component that takes Arabic words + transliterations as data. Used by Bismillah, Tilawah, and Hadith screens.
- **D-02:** Auto-timed reveal -- words appear automatically with staggered timing (600-800ms per word, 300-400ms stagger). Tap anywhere to skip ahead.
- **D-03:** Transliteration fades in beneath each Arabic word after it reveals -- creates a two-line pair per word. Clear connection between Arabic and pronunciation.
- **D-04:** English meaning appears per-word ONLY in Bismillah (teaching moment). Tilawah and Hadith show full English translation after the reveal completes.
- **D-05:** Break Bismillah into 4 semantic units: Bismi / Allahi / Ar-Rahmani / Ar-Raheem. Each unit shows Arabic word, transliteration, and English meaning.
- **D-06:** All 4 units auto-reveal sequentially using the PhraseReveal primitive. The current 4-second auto-advance timer is removed.
- **D-07:** After all 4 units reveal, show a CTA button (e.g., "Continue"). User absorbs at their own pace -- no auto-advance on sacred content.
- **D-08:** Stacked vertical layout -- each unit on its own row: Arabic word on top, transliteration below, meaning below that. Clean, spacious, meditative.
- **D-09:** Wrap the entire onboarding flow in AtmosphereBackground 'onboarding' preset. Every step feels like one continuous inhabited space.
- **D-10:** Welcome screen: AtmosphereBackground only. Keep existing staggered fade-in animations and BrandedLogo. The atmosphere IS the upgrade.
- **D-11:** Tilawah screen: Replace static Arabic block with word-by-word PhraseReveal. Remove ShimmerWord animation (replaced by reveal). Keep headline and motto text.
- **D-12:** Hadith screen: Keep ArchOutline and WarmGlow (they add atmosphere). Replace static quote with word-by-word PhraseReveal. Keep source attribution.
- **D-13:** Replace bouncy spring checkmark with gentle fade-in + subtle scale settle (1.02 to 1.0). Checkmark appears quietly -- gravity, not celebration.
- **D-14:** Keep the ambient Alif watermark (200px, 8% opacity). It's subtle and ties back to "you're about to learn your first letter."
- **D-15:** Keep CTA text as "Start Lesson 1" -- direct, clear, grounding after emotional buildup.

### Claude's Discretion
- PhraseReveal animation easing curves and exact timing values within the 600-800ms/300-400ms ranges
- Reduce Motion fallback for PhraseReveal (likely: show all words at once with simple fade)
- Where to place AtmosphereBackground wrapper (OnboardingFlow level vs per-screen)
- Exact scale settle curve for Finish checkmark
- Whether Bismillah CTA says "Continue" or something else
- Typography sizing for transliteration text in PhraseReveal
- Whether PhraseReveal lives in `src/design/components/` or `src/components/shared/`

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SACR-01 | Sacred phrase reveal primitive -- word-by-word fade-in (600-800ms per word, 300-400ms stagger) with transliteration appearing beneath each word | PhraseReveal component architecture, Reanimated stagger pattern, data-driven word array |
| SACR-02 | Bismillah micro-lesson -- 4 semantic units with Arabic, transliteration, and meaning | Bismillah data structure, BismillahMoment.tsx rewrite pattern, CTA addition |
| SACR-03 | Onboarding Welcome screen atmosphere -- warm ambient background, gentle entrance | AtmosphereBackground 'onboarding' preset at OnboardingFlow level |
| SACR-04 | Onboarding Tilawah screen -- sacred phrase reveals word-by-word | PhraseReveal integration, ShimmerWord removal, Tilawah Arabic word data |
| SACR-05 | Onboarding Hadith screen -- sacred phrase reveals word-by-word | PhraseReveal integration, preserving ArchOutline + WarmGlow, Hadith Arabic word data |
| SACR-06 | Onboarding Finish screen atmosphere -- lands with gravity, not bounce | Replace withSpring(bouncy) with withTiming settle pattern |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | 4.2.1 | All PhraseReveal animations, stagger, fade, scale settle | Already installed; project standard for animations [VERIFIED: package.json] |
| expo-haptics | 55.0.11 | hapticSelection for Bismillah entrance | Already installed; project standard [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-svg | 15.15.3 | ArchOutline in Hadith (existing), WarmGlow SVG gradients | Already used in Hadith.tsx [VERIFIED: codebase] |
| expo-linear-gradient | 55.0.11 | AtmosphereBackground linear gradient layer | Already used in AtmosphereBackground [VERIFIED: codebase] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reanimated withDelay stagger | LayoutAnimation | LayoutAnimation cannot control per-word timing; Reanimated is already the project standard |
| Custom PhraseReveal | react-native-animatable | Adds dependency; Reanimated already covers all needed primitives |

**No new dependencies required.** Everything needed is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/design/components/
  PhraseReveal.tsx        # New shared reveal primitive (SACR-01)
  index.ts                # Add PhraseReveal export

src/components/onboarding/steps/
  BismillahMoment.tsx     # Rewrite with PhraseReveal + CTA (SACR-02)
  Tilawat.tsx             # Replace static Arabic + ShimmerWord (SACR-04)
  Hadith.tsx              # Replace static quote with PhraseReveal (SACR-05)
  Welcome.tsx             # No content changes (SACR-03 via flow wrapper)
  Finish.tsx              # Replace bouncy spring with settle (SACR-06)

src/components/onboarding/
  OnboardingFlow.tsx      # Wrap in AtmosphereBackground (SACR-03)
```

### Pattern 1: PhraseReveal Component -- Data-Driven Word Array
**What:** A reusable component that accepts an array of word objects and reveals them sequentially with staggered timing. Each word is a vertical unit: Arabic on top, transliteration below, optional meaning below that.
**When to use:** Any screen with sacred Arabic text that should reveal word-by-word.
**Recommendation:** Place in `src/design/components/PhraseReveal.tsx` since it is a design-system-level primitive (like ArabicText), not a feature component. [ASSUMED]

**Data structure:**
```typescript
interface PhraseWord {
  arabic: string;
  transliteration: string;
  meaning?: string; // Only provided for Bismillah (D-04)
}

interface PhraseRevealProps {
  words: PhraseWord[];
  wordDuration?: number;   // 600-800ms per word (D-02)
  staggerDelay?: number;   // 300-400ms between words (D-02)
  onComplete?: () => void; // Fires after all words revealed
  layout?: 'horizontal' | 'vertical'; // Bismillah = vertical (D-08), others = horizontal
}
```

**Critical implementation note -- hook rules:** Cannot call `useSharedValue` inside a `.map()` loop. Each word's animation must be managed by a child `RevealWord` component that owns its own shared values. The parent coordinates via props (index, timing config) and a shared skip signal. [VERIFIED: React hooks rules apply to Reanimated hooks]

**Child component pattern:**
```typescript
// Source: Reanimated withDelay + withTiming stagger pattern [VERIFIED: Reanimated API in codebase]
function RevealWord({ word, index, staggerDelay, wordDuration, skipImmediate }: {
  word: PhraseWord;
  index: number;
  staggerDelay: number;
  wordDuration: number;
  skipImmediate: boolean; // When true, show immediately (skip or reduce motion)
}) {
  const arabicOpacity = useSharedValue(skipImmediate ? 1 : 0);
  const translitOpacity = useSharedValue(skipImmediate ? 1 : 0);
  const meaningOpacity = useSharedValue(skipImmediate ? 1 : 0);

  useEffect(() => {
    if (skipImmediate) return;
    const baseDelay = index * staggerDelay;
    arabicOpacity.value = withDelay(baseDelay,
      withTiming(1, { duration: wordDuration, easing: Easing.out(Easing.cubic) })
    );
    translitOpacity.value = withDelay(baseDelay + 200,
      withTiming(1, { duration: wordDuration * 0.8, easing: Easing.out(Easing.cubic) })
    );
    if (word.meaning) {
      meaningOpacity.value = withDelay(baseDelay + 400,
        withTiming(1, { duration: wordDuration * 0.7, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [skipImmediate]);

  const arabicStyle = useAnimatedStyle(() => ({ opacity: arabicOpacity.value }));
  const translitStyle = useAnimatedStyle(() => ({ opacity: translitOpacity.value }));
  const meaningStyle = useAnimatedStyle(() => ({ opacity: meaningOpacity.value }));

  return (
    <View style={styles.wordUnit}>
      <Animated.View style={arabicStyle}>
        <ArabicText size="large" /* ... */>{word.arabic}</ArabicText>
      </Animated.View>
      <Animated.Text style={[styles.transliteration, translitStyle]}>
        {word.transliteration}
      </Animated.Text>
      {word.meaning && (
        <Animated.Text style={[styles.meaning, meaningStyle]}>
          {word.meaning}
        </Animated.Text>
      )}
    </View>
  );
}
```

**Parent component handles skip and completion:**
```typescript
function PhraseReveal({ words, wordDuration = 700, staggerDelay = 350, onComplete, layout = 'vertical' }: PhraseRevealProps) {
  const reducedMotion = useReducedMotion();
  const [skipped, setSkipped] = useState(reducedMotion ?? false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (skipped) {
      onComplete?.();
      return;
    }
    const totalTime = (words.length - 1) * staggerDelay + wordDuration + 400;
    timerRef.current = setTimeout(() => {
      onComplete?.();
    }, totalTime);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [skipped]);

  function handleSkip() {
    if (skipped) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSkipped(true);
    // Setting skipped=true triggers re-render; RevealWord children
    // receive skipImmediate=true and show instantly via quick withTiming
  }

  const containerStyle = layout === 'vertical' ? styles.vertical : styles.horizontal;

  return (
    <Pressable onPress={handleSkip} style={containerStyle}>
      {words.map((word, i) => (
        <RevealWord
          key={i}
          word={word}
          index={i}
          staggerDelay={staggerDelay}
          wordDuration={wordDuration}
          skipImmediate={skipped}
        />
      ))}
    </Pressable>
  );
}
```

### Pattern 2: AtmosphereBackground at Flow Level
**What:** Wrap `OnboardingFlow` root in `AtmosphereBackground preset="onboarding"` so all steps share a continuous ambient background.
**When to use:** D-09 specifies entire flow gets atmosphere.

**Key changes to OnboardingFlow.tsx:**
1. Import `AtmosphereBackground` from `../../design/atmosphere/AtmosphereBackground`
2. Wrap the root `Animated.View` in `<AtmosphereBackground preset="onboarding">`
3. Remove `backgroundColor: colors.bgWarm` from `styles.root` (AtmosphereBackground provides gradient)
4. Remove the standalone `<FloatingLettersLayer>` on line 143 -- AtmosphereBackground's 'onboarding' preset already has `floatingLetters: true` [VERIFIED: AtmosphereBackground.tsx line 88]

```typescript
// OnboardingFlow.tsx -- updated render
return (
  <AtmosphereBackground preset="onboarding">
    <Animated.View style={[styles.root, fadeStyle]}>
      {/* REMOVED: FloatingLettersLayer -- now provided by AtmosphereBackground */}
      {showProgressBar && (
        <View style={[styles.progressContainer, { paddingTop: insets.top + spacing.sm }]}>
          <ProgressBar current={step} total={TOTAL_STEPS} colors={colors} />
        </View>
      )}
      <ScrollView ...>
        {/* All step content unchanged */}
      </ScrollView>
    </Animated.View>
  </AtmosphereBackground>
);
```

### Pattern 3: Gentle Scale Settle (Finish Screen)
**What:** Replace `withSpring(1.0, springs.bouncy)` with `withTiming` for a gentle 1.02 to 1.0 settle.
**When to use:** D-13 -- Finish screen checkmark.

**Current code** (Finish.tsx lines 45-53):
```typescript
// CURRENT: bouncy spring
scale.value = withSpring(1.0, springs.bouncy);
```

**Replacement:**
```typescript
// NEW: gentle settle (D-13)
const reducedMotion = useReducedMotion();

// Replace initial value: was 0.5, now 0.98 (smaller range = subtler)
const scale = useSharedValue(reducedMotion ? 1 : 0.98);
const checkOpacity = useSharedValue(reducedMotion ? 1 : 0);

useEffect(() => {
  if (reducedMotion) { hapticSuccess(); return; }
  const timer = setTimeout(() => {
    hapticSuccess();
    checkOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withSequence(
      withTiming(1.02, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withTiming(1.0, { duration: 400, easing: Easing.inOut(Easing.ease) })
    );
  }, checkDelay);
  return () => clearTimeout(timer);
}, []);

const checkAnimStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
  opacity: checkOpacity.value,
}));
```

### Anti-Patterns to Avoid
- **Calling useSharedValue in a loop:** Reanimated hooks must follow React hook rules. Use child components for dynamic lists where each child owns its own shared values.
- **Auto-advancing sacred content:** D-06 explicitly removes the 4-second setTimeout. Never auto-advance after PhraseReveal completes -- show a CTA button instead.
- **Nesting AtmosphereBackground:** Do not put AtmosphereBackground inside individual steps AND at the flow level. One wrapper at the flow level is sufficient (D-09).
- **Forgetting to remove old patterns:** ShimmerWord in Tilawat.tsx, FloatingLettersLayer in OnboardingFlow.tsx, setTimeout in BismillahMoment.tsx must all be explicitly removed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Staggered word reveal | Custom setTimeout chains with setState | Reanimated `withDelay` + `withTiming` per child | setTimeout chains cause re-renders; Reanimated runs on UI thread [VERIFIED: Reanimated architecture] |
| Ambient background | Per-screen gradient + glow | `AtmosphereBackground` preset='onboarding' | Already built in Phase 1 with proper layering [VERIFIED: codebase] |
| Reduce Motion detection | Manual AccessibilityInfo listeners | `useReducedMotion()` from Reanimated | Already used in WarmGlow and FloatingLettersLayer [VERIFIED: codebase grep] |
| Arabic text rendering | Raw `<Text>` with manual font/lineHeight | `ArabicText` component with size tiers | Handles writingDirection, overflow visible, font family [VERIFIED: ArabicText.tsx] |

## Common Pitfalls

### Pitfall 1: Shared Value Hook Rules Violation
**What goes wrong:** Calling `useSharedValue` inside a `.map()` loop or conditionally creates hook ordering violations.
**Why it happens:** PhraseReveal needs N opacity values for N words. Tempting to create them in a loop.
**How to avoid:** Each `RevealWord` child component calls `useSharedValue` once for its own opacity. The parent renders N children.
**Warning signs:** React "hooks called in different order" error, or silent bugs where animations target wrong words.

### Pitfall 2: Double FloatingLetters
**What goes wrong:** Floating Arabic letters appear doubled -- one set from `OnboardingFlow.tsx` line 143, another from `AtmosphereBackground`.
**Why it happens:** `OnboardingFlow` currently renders its own `<FloatingLettersLayer>` for steps 0-3. The 'onboarding' preset in `AtmosphereBackground` also has `floatingLetters: true`.
**How to avoid:** Remove the standalone `FloatingLettersLayer` from `OnboardingFlow.tsx` when adding `AtmosphereBackground` wrapper.
**Warning signs:** Doubled semi-transparent Arabic letters on Welcome/Tilawat/Hadith screens.

### Pitfall 3: Stale Timer After Skip
**What goes wrong:** User taps to skip PhraseReveal, but the `onComplete` callback fires twice -- once from skip handler, once from the stale setTimeout.
**Why it happens:** The total-time setTimeout in PhraseReveal is not cleared when user taps to skip.
**How to avoid:** Clear the completion timer in the skip handler. Use a ref for the timer and clear it on skip + unmount.
**Warning signs:** CTA button appearing twice or onComplete firing after navigation.

### Pitfall 4: BismillahMoment Timer Not Removed
**What goes wrong:** Bismillah auto-advances after 4 seconds despite D-06 saying to remove auto-advance.
**Why it happens:** Forgetting to remove the `setTimeout(onNext, BISMILLAH_HOLD)` and replacing it with a CTA button.
**How to avoid:** Delete the setTimeout entirely. Replace `onNext` prop usage with a CTA `<Button>` that becomes visible after PhraseReveal completes.
**Warning signs:** Screen auto-advances before user presses Continue.

### Pitfall 5: Missing Reduce Motion Fallback
**What goes wrong:** PhraseReveal animations play on devices with Reduce Motion enabled, violating accessibility.
**Why it happens:** New component does not check `useReducedMotion()`.
**How to avoid:** Check `useReducedMotion()` at the top of PhraseReveal. If true, render all words immediately with a simple 300ms opacity fade (no stagger). This matches the existing pattern in WarmGlow and FloatingLettersLayer.
**Warning signs:** Accessibility audit failure, FOUN-04 regression.

### Pitfall 6: Arabic Word Segmentation
**What goes wrong:** Arabic words split at wrong boundaries, breaking meaning or display.
**Why it happens:** Arabic text has connecting forms -- splitting at the wrong point creates orphaned connectors.
**How to avoid:** The Bismillah data is pre-segmented into 4 semantic units (D-05). Tilawah and Hadith quotes should also be pre-segmented as static data arrays, not split programmatically. Each word is a string literal.
**Warning signs:** Broken Arabic letterforms, incorrect word boundaries.

### Pitfall 7: BismillahMoment Prop Interface Change
**What goes wrong:** BismillahMoment currently receives `onNext` and auto-advances. After changes, it needs `onNext` for the CTA button but must NOT auto-advance.
**Why it happens:** The prop interface stays the same but behavior changes completely.
**How to avoid:** Keep `onNext` prop. Remove the useEffect timer. Add a `<Button>` in footer that calls `onNext`. PhraseReveal's `onComplete` controls when the button becomes visible.
**Warning signs:** No way to advance past Bismillah screen.

## Code Examples

### Bismillah Data Structure
```typescript
// Pre-segmented Bismillah semantic units [VERIFIED: D-05 from CONTEXT.md]
// Arabic strings extracted from current BismillahMoment.tsx and split at word boundaries
const BISMILLAH_WORDS: PhraseWord[] = [
  { arabic: "\u0628\u0650\u0633\u0652\u0645\u0650", transliteration: "Bismi", meaning: "In the name" },
  { arabic: "\u0627\u0644\u0644\u0651\u0670\u0647\u0650", transliteration: "Allahi", meaning: "of God" },
  { arabic: "\u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u0670\u0646\u0650", transliteration: "Ar-Rahmani", meaning: "the Most Gracious" },
  { arabic: "\u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650", transliteration: "Ar-Raheem", meaning: "the Most Merciful" },
];
```

### Tilawah Data Structure
```typescript
// Tilawat.tsx currently shows: تِلاوَة (single Arabic word) [VERIFIED: Tilawat.tsx line 77]
// For PhraseReveal, this is a single-word reveal with transliteration
const TILAWAH_WORDS: PhraseWord[] = [
  { arabic: "\u062A\u0650\u0644\u0627\u0648\u064E\u0629", transliteration: "Tilawah" },
];
// Note: single-word PhraseReveal still adds the transliteration pair.
// The ShimmerWord "Tilawat" in English headline gets removed (D-11).
```

### Hadith Data Structure
```typescript
// The Hadith screen currently shows an English-only quote [VERIFIED: Hadith.tsx line 80-82]
// Success criteria #2 says "Sacred Arabic phrases (Bismillah, Tilawah quote, Hadith quote) 
// reveal word-by-word with transliteration"
// The Arabic hadith text needs to be added. Key phrase:
const HADITH_WORDS: PhraseWord[] = [
  { arabic: "\u0627\u0644\u0645\u0627\u0647\u0631", transliteration: "Al-mahir" },
  { arabic: "\u0628\u0650\u0627\u0644\u0642\u064F\u0631\u0622\u0646\u0650", transliteration: "bil-Qurani" },
  { arabic: "\u0645\u064E\u0639\u064E", transliteration: "ma'a" },
  { arabic: "\u0627\u0644\u0633\u0651\u064E\u0641\u064E\u0631\u064E\u0629\u0650", transliteration: "as-safarati" },
  { arabic: "\u0627\u0644\u0643\u0650\u0631\u0627\u0645\u0650", transliteration: "al-kirami" },
  { arabic: "\u0627\u0644\u0628\u064E\u0631\u064E\u0631\u064E\u0629\u0650", transliteration: "al-bararah" },
];
// [ASSUMED] This uses the first portion of the hadith. The full hadith is longer.
// English translation shown after reveal completes per D-04.
// Alternative: use shorter key phrase. Needs confirmation.
```

### Updated BismillahMoment Structure
```typescript
// BismillahMoment.tsx -- after changes [pattern from CONTEXT.md decisions]
export function BismillahMoment({ onNext }: { onNext: () => void }) {
  const colors = useColors();
  const [revealComplete, setRevealComplete] = useState(false);

  useEffect(() => {
    hapticSelection();
    playSacredMoment();
  }, []);

  return (
    <OnboardingStepLayout
      variant="splash"
      fadeInDuration={800}
      footer={
        revealComplete ? (
          <Animated.View entering={FadeIn.duration(400)} style={{ zIndex: 1 }}>
            <Button title="Continue" onPress={onNext} />
          </Animated.View>
        ) : undefined
      }
    >
      <PhraseReveal
        words={BISMILLAH_WORDS}
        layout="vertical"
        onComplete={() => setRevealComplete(true)}
      />
    </OnboardingStepLayout>
  );
}
// Key changes from current:
// - REMOVED: setTimeout(onNext, BISMILLAH_HOLD)
// - REMOVED: timerRef
// - ADDED: PhraseReveal with onComplete
// - ADDED: CTA Button visible after reveal completes
// - KEPT: hapticSelection + playSacredMoment on mount
```

### OnboardingFlow AtmosphereBackground Integration
```typescript
// OnboardingFlow.tsx -- changes [VERIFIED: AtmosphereBackground component structure]
import { AtmosphereBackground } from "../../design/atmosphere/AtmosphereBackground";

// In render:
return (
  <AtmosphereBackground preset="onboarding">
    <Animated.View style={[styles.root, fadeStyle]}>
      {/* REMOVED: {step <= STEP.STARTING_POINT && <FloatingLettersLayer color={colors.primary} />} */}
      {showProgressBar && (/* unchanged */)}
      <ScrollView ...>
        {/* All step content unchanged */}
      </ScrollView>
    </Animated.View>
  </AtmosphereBackground>
);

// styles.root update: remove backgroundColor: colors.bgWarm
```

### Finish Screen Settle Pattern
```typescript
// Finish.tsx -- replace bouncy spring [VERIFIED: current code uses springs.bouncy]
import { withTiming, withSequence, Easing, useReducedMotion } from "react-native-reanimated";

const reducedMotion = useReducedMotion();
const scale = useSharedValue(reducedMotion ? 1 : 0.98);
const checkOpacity = useSharedValue(reducedMotion ? 1 : 0);

useEffect(() => {
  if (reducedMotion) { hapticSuccess(); return; }
  const timer = setTimeout(() => {
    hapticSuccess();
    checkOpacity.value = withTiming(1, {
      duration: 600, easing: Easing.out(Easing.cubic),
    });
    scale.value = withSequence(
      withTiming(1.02, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withTiming(1.0, { duration: 400, easing: Easing.inOut(Easing.ease) })
    );
  }, checkDelay);
  return () => clearTimeout(timer);
}, []);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `withSpring(bouncy)` for entrances | `withTiming` + `withSequence` for calm settle | Phase 3 (now) | Matches emotional design -- gravity over celebration |
| Static Arabic text blocks | Word-by-word PhraseReveal | Phase 3 (now) | Sacred content unfolds like revelation |
| Per-screen background hacks | `AtmosphereBackground` presets | Phase 1 | Consistent atmosphere across onboarding |
| ShimmerWord opacity loop | PhraseReveal word entrance | Phase 3 (now) | Replace shimmer with intentional reveal |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PhraseReveal should live in `src/design/components/` rather than `src/components/shared/` | Architecture Patterns | Low -- location is organizational, easy to move. Design components barrel export makes it more discoverable. |
| A2 | Hadith screen should show Arabic text of the hadith for PhraseReveal | Code Examples | Medium -- the current Hadith.tsx shows only English. CONTEXT says "Sacred Arabic phrases" reveal word-by-word, suggesting Arabic is expected. But adding Arabic hadith text is new content scope. |
| A3 | Tilawah screen PhraseReveal applies to the single Arabic word only, not a longer verse | Code Examples | Low -- the screen currently shows one Arabic word with English headline. |
| A4 | Skip-ahead behavior (D-02 "Tap anywhere to skip ahead") means tapping reveals all remaining words instantly | Architecture Patterns | Low -- standard skip pattern. |

## Open Questions (RESOLVED)

1. **Hadith Screen: What text gets PhraseReveal treatment?** -- RESOLVED
   - Resolution: Add Arabic hadith text and reveal it word-by-word with transliteration (6 words from Sahih al-Bukhari 4937). English translation appears after reveal completes per D-04 pattern. Implemented in Plan 02, Task 3.

2. **Tilawah Screen: Single-Word PhraseReveal Value** -- RESOLVED
   - Resolution: Apply PhraseReveal to the single Arabic word. The value is the transliteration appearing beneath -- teaching the word, not just displaying it. ShimmerWord removed and replaced with static accent-colored text per D-11. Implemented in Plan 02, Task 2.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SACR-01 | PhraseReveal exports PhraseWord type and PhraseRevealProps | unit (source scan) | `npm test -- --run src/__tests__/phrase-reveal.test.ts` | Wave 0 |
| SACR-01 | PhraseReveal imports useReducedMotion | unit (source scan) | `npm test -- --run src/__tests__/phrase-reveal.test.ts` | Wave 0 |
| SACR-02 | BismillahMoment uses PhraseReveal, has 4 words, has CTA button, no setTimeout | unit (source scan) | `npm test -- --run src/__tests__/bismillah-sacred.test.ts` | Wave 0 |
| SACR-03 | OnboardingFlow wraps in AtmosphereBackground, no standalone FloatingLettersLayer | unit (source scan) | `npm test -- --run src/__tests__/onboarding-atmosphere.test.ts` | Wave 0 |
| SACR-04 | Tilawat uses PhraseReveal, does not contain ShimmerWord | unit (source scan) | `npm test -- --run src/__tests__/tilawat-reveal.test.ts` | Wave 0 |
| SACR-05 | Hadith uses PhraseReveal, keeps ArchOutline and WarmGlow | unit (source scan) | `npm test -- --run src/__tests__/hadith-reveal.test.ts` | Wave 0 |
| SACR-06 | Finish does not import springs.bouncy, uses withSequence for settle | unit (source scan) | `npm test -- --run src/__tests__/finish-settle.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/phrase-reveal.test.ts` -- covers SACR-01 (PhraseReveal component structure, types, reduce motion)
- [ ] `src/__tests__/bismillah-sacred.test.ts` -- covers SACR-02 (Bismillah micro-lesson structure, replaces old bismillah.test.ts todos)
- [ ] `src/__tests__/onboarding-atmosphere.test.ts` -- covers SACR-03 (AtmosphereBackground integration)
- [ ] `src/__tests__/tilawat-reveal.test.ts` -- covers SACR-04 (Tilawat PhraseReveal, ShimmerWord removed)
- [ ] `src/__tests__/hadith-reveal.test.ts` -- covers SACR-05 (Hadith PhraseReveal, preserves existing elements)
- [ ] `src/__tests__/finish-settle.test.ts` -- covers SACR-06 (Finish gentle settle, no bouncy spring)

Note: Existing `src/__tests__/bismillah.test.ts` has only `.todo` tests describing the old pattern. It should be updated or replaced by `bismillah-sacred.test.ts`.

## Security Domain

Not applicable. This phase is purely UI animation and visual changes with no data handling, authentication, network calls, or user input processing changes.

## Sources

### Primary (HIGH confidence)
- Codebase: `BismillahMoment.tsx` -- current implementation with 4s auto-advance timer, haptic, audio
- Codebase: `Tilawat.tsx` -- current implementation with ShimmerWord, single Arabic word, stagger pattern
- Codebase: `Hadith.tsx` -- current implementation with English-only quote, ArchOutline, WarmGlow
- Codebase: `Welcome.tsx` -- current implementation with BrandedLogo, stagger animations
- Codebase: `Finish.tsx` -- current implementation with bouncy spring checkmark, Alif watermark
- Codebase: `OnboardingFlow.tsx` -- flow orchestrator with FloatingLettersLayer, step constants
- Codebase: `AtmosphereBackground.tsx` -- preset configs verified, 'onboarding' has floatingLetters: true
- Codebase: `animations.ts` (design) -- springs.bouncy, easings.contentReveal, breathing/drift tokens
- Codebase: `ArabicText.tsx` -- size tiers and props
- Codebase: `useReducedMotion` usage pattern -- WarmGlow.tsx, FloatingLettersLayer.tsx, QuizOption.tsx
- Codebase: `OnboardingStepLayout.tsx` -- splash/centered/card variants, footer prop
- Codebase: `animations.ts` (onboarding) -- SPLASH_STAGGER_BASE, SPLASH_STAGGER_DURATION constants

### Secondary (MEDIUM confidence)
- Reanimated API: `withDelay`, `withTiming`, `withSequence`, `useReducedMotion`, `useSharedValue` -- confirmed from existing codebase usage patterns [VERIFIED: multiple files in codebase]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, everything already installed and used in codebase
- Architecture: HIGH -- PhraseReveal pattern is straightforward Reanimated stagger; AtmosphereBackground integration is well-defined
- Pitfalls: HIGH -- identified from direct code inspection (double FloatingLetters, hook rules, timer cleanup)
- Arabic data: MEDIUM -- Bismillah segmentation is clear (4 units defined in CONTEXT), Hadith/Tilawah Arabic content needs confirmation

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable -- no dependency changes expected)
