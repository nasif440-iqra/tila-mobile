import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useColors } from '../../design/theme';
import { fontFamilies, typography, spacing, radii, shadows } from '../../design/tokens';

interface AccountPromptProps {
  visible: boolean;
  onDismiss: () => void;
  onSignIn: () => void;
}

export function AccountPrompt({ visible, onDismiss, onSignIn }: AccountPromptProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onDismiss} />
        <View style={[styles.card, { backgroundColor: colors.bgCard }, shadows.card]}>
          <View style={styles.handle} />

          <Text style={[styles.title, { color: colors.text }]}>
            Save your progress
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSoft }]}>
            Create a free account to keep your learning safe across devices
          </Text>

          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={onSignIn}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryButtonText, { color: colors.white }]}>
              Create Account
            </Text>
          </Pressable>

          <Pressable
            style={styles.dismissButton}
            onPress={onDismiss}
            accessibilityRole="button"
          >
            <Text style={[styles.dismissText, { color: colors.textMuted }]}>
              Not now
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  card: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    ...typography.bodyLarge,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: spacing.sm,
  },
  dismissText: {
    ...typography.body,
  },
});
