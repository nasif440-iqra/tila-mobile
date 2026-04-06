import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../design/theme";
import { fontFamilies, radii } from "../../design/tokens";

// ── Spring config matching web: stiffness 400, damping 32 — fast snap, minimal overshoot ──
const BANNER_SPRING = { stiffness: 400, damping: 32, mass: 1 };

// ── Types ──

interface StreakBannerProps {
  streak: number;
}

// ── Component ──

export function StreakBanner({ streak }: StreakBannerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const isTier3 = streak >= 7;
  const isTier2 = streak >= 5 && streak < 7;

  // ── Varied messaging pools ──
  const BANNER_MESSAGES_SMALL = [
    `${streak} in a row`,
    `${streak} straight`,
    `Streak: ${streak}`,
  ];
  const BANNER_MESSAGES_MEDIUM = [
    `${streak} in a row  \u00B7  Sharp focus.`,
    `${streak} straight  \u00B7  In the zone.`,
    `${streak}!  \u00B7  Keep this up.`,
  ];
  const BANNER_ARABIC_PHRASES = [
    { arabic: "\u0645\u0627\u0634\u0627\u0621 \u0627\u0644\u0644\u0647", english: "What Allah wills" },
    { arabic: "\u0628\u0627\u0631\u0643 \u0627\u0644\u0644\u0647", english: "Allah has blessed" },
  ];
  const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const smallMsg = pickRandom(BANNER_MESSAGES_SMALL);
  const mediumMsg = pickRandom(BANNER_MESSAGES_MEDIUM);
  const arabicPhrase = pickRandom(BANNER_ARABIC_PHRASES);

  // Wrapper: spring enter from -48 → 0 (web uses -64 but mobile has less viewport)
  const wrapperY = useSharedValue(-48);
  const wrapperOpacity = useSharedValue(0);

  // Inner content: slightly delayed fade for a "two-beat" read
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Spring for position — decisive snap, not floaty
    wrapperY.value = withSpring(0, BANNER_SPRING);
    wrapperOpacity.value = withTiming(1, { duration: 180 });
    // Content reveals after wrapper settles
    contentOpacity.value = withDelay(100, withTiming(1, { duration: 150 }));
  }, []);

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: wrapperY.value }],
    opacity: wrapperOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  // Pill border — tier 3 is brightest gold
  const pillBorder = isTier3
    ? "rgba(196,164,100,0.40)"
    : isTier2
      ? "rgba(196,164,100,0.30)"
      : "rgba(196,164,100,0.22)";

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { top: insets.top + 8 },
        wrapperStyle,
      ]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.primary,
            borderColor: pillBorder,
          },
          // Tier 3 gets a slightly more assertive shadow
          isTier3 && styles.pillTier3,
        ]}
      >
        {isTier3 ? (
          <Animated.View style={[styles.tier3Row, contentStyle]}>
            <Text style={[styles.tier3Number, { color: colors.accent }]}>
              {streak}
            </Text>
            <View style={[styles.tier3Divider, { backgroundColor: "rgba(196,164,100,0.3)" }]} />
            <View style={styles.tier3TextCol}>
              <Text style={[styles.tier3Arabic, { color: colors.accent }]}>
                {arabicPhrase.arabic}
              </Text>
              <Text style={styles.tier3English}>
                {arabicPhrase.english}
              </Text>
            </View>
          </Animated.View>
        ) : isTier2 ? (
          <Animated.View style={[styles.tierRow, contentStyle]}>
            <Text style={[styles.tierGlyph, { color: colors.accent }]}>
              {"\u2726\u2726"}
            </Text>
            <Text style={[styles.tierText, { color: colors.accent }]}>
              {mediumMsg}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.tierRow, contentStyle]}>
            <Text style={[styles.tierGlyph, { color: colors.accent }]}>
              {"\u2726"}
            </Text>
            <Text style={[styles.tierText, { color: colors.accent }]}>
              {smallMsg}
            </Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 200,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: radii.full,
    borderWidth: 1,
    // Subtle shadow — not as heavy as cardLifted
    shadowColor: "#163323",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  pillTier3: {
    // Tier 3 gets slightly larger padding and stronger shadow
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },

  // Tier 1 & 2
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tierGlyph: {
    fontSize: 11,
  },
  tierText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
  },

  // Tier 3
  tier3Row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tier3Number: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 15,
  },
  tier3Divider: {
    width: 1,
    height: 16,
  },
  tier3TextCol: {
    alignItems: "center",
  },
  tier3Arabic: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 16,
    lineHeight: 22,
    writingDirection: "rtl",
  },
  tier3English: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 10,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.4)",
    marginTop: -1,
  },
});
