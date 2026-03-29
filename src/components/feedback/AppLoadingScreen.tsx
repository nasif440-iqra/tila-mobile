import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing } from "../../design/tokens";
import { BrandedLogo } from "../onboarding/BrandedLogo";
import { WarmGlow } from "../onboarding/WarmGlow";

export function AppLoadingScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.logoArea}>
        <WarmGlow size={280} animated pulseMin={0.06} pulseMax={0.18} />
        <View style={styles.logoOverlay}>
          <BrandedLogo width={100} height={130} />
        </View>
      </View>
      <Text
        style={[
          typography.body,
          styles.tagline,
          { color: colors.textMuted, marginTop: spacing.xl },
        ]}
      >
        Preparing your lesson...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoArea: {
    width: 280,
    height: 280,
    justifyContent: "center",
    alignItems: "center",
  },
  logoOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  tagline: {
    textAlign: "center",
  },
});
