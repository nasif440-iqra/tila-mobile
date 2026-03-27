import { View, Text } from "react-native";
import { useColors } from "../../src/design/theme";
import { typography, spacing } from "../../src/design/tokens";

export default function ProgressScreen() {
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: spacing.xl }}>
      <Text style={[typography.heading2, { color: colors.text }]}>Progress</Text>
      <Text style={[typography.body, { color: colors.textSoft, marginTop: spacing.sm, textAlign: "center" }]}>
        Letter mastery grid and phase progress will go here.
      </Text>
    </View>
  );
}
