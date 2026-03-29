import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";

interface ErrorFallbackProps {
  onRetry: () => void;
}

export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
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
        Don't worry -- your progress is saved. Tap below to try again.
      </Text>
      <Pressable
        onPress={onRetry}
        style={[
          styles.retryButton,
          {
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.xxl,
            paddingVertical: spacing.lg,
            borderRadius: radii.md,
          },
        ]}
      >
        <Text style={[typography.bodyLarge, { color: colors.white }]}>
          Try Again
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
  retryButton: {
    alignItems: "center",
  },
});
