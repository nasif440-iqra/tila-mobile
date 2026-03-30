import { View, Text, Modal, StyleSheet } from "react-native";
import { Button } from "../../design/components";
import { useColors } from "../../design/theme";
import { spacing, radii, fontFamilies } from "../../design/tokens";

interface AnalyticsConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AnalyticsConsentModal({ visible, onAccept, onDecline }: AnalyticsConsentModalProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Help improve Tila?
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Share anonymous usage data so we can make the app better for everyone. No personal information is collected.
          </Text>
          <View style={styles.buttons}>
            <Button variant="ghost" label="No thanks" onPress={onDecline} />
            <Button variant="primary" label="Sure" onPress={onAccept} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
});
