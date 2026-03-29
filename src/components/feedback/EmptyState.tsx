import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  subtitle,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { padding: spacing.xxl }]}>
      {icon && (
        <View style={{ marginBottom: spacing.lg }}>{icon}</View>
      )}
      <Text
        style={[typography.heading2, styles.centered, { color: colors.text }]}
      >
        {title}
      </Text>
      <Text
        style={[
          typography.body,
          styles.centered,
          { color: colors.textSoft, marginTop: spacing.sm },
        ]}
      >
        {subtitle}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.accent,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              marginTop: spacing.xxl,
            },
          ]}
        >
          <Text style={[typography.bodyLarge, { color: colors.white }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    textAlign: "center",
  },
  actionButton: {
    alignItems: "center",
  },
});
