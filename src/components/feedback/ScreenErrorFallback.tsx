import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";
import type { FallbackProps } from "react-error-boundary";

export function ScreenErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[typography.heading2, { color: colors.text }]}>
        Something went wrong
      </Text>
      <Text
        style={[
          typography.body,
          styles.message,
          { color: colors.textSoft, marginTop: spacing.md, marginBottom: spacing.xxl },
        ]}
      >
        Don't worry -- your progress is saved.
      </Text>
      <Pressable
        onPress={resetErrorBoundary}
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.xxl,
            paddingVertical: spacing.lg,
            borderRadius: radii.md,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Text style={[typography.bodyLarge, { color: colors.white }]}>
          Try Again
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.replace("/")}
        style={[
          styles.button,
          {
            backgroundColor: "transparent",
            paddingHorizontal: spacing.xxl,
            paddingVertical: spacing.lg,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.primary,
          },
        ]}
      >
        <Text style={[typography.bodyLarge, { color: colors.primary }]}>
          Go Home
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  message: {
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    width: "100%",
    maxWidth: 280,
  },
});
