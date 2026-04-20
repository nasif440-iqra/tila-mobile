import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "../../src/design/theme";
import { typography, spacing } from "../../src/design/tokens";

export default function ProgressScreen() {
  const colors = useColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl }}>
        <Text style={[typography.heading2, { color: colors.text, textAlign: "center" }]}>
          Progress
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.md, textAlign: "center" }]}>
          New progress view coming with the curriculum update.
        </Text>
      </View>
    </SafeAreaView>
  );
}
