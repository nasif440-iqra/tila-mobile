import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { Button } from "../../../design/components";
import { typography, spacing, radii, shadows, borderWidths } from "../../../design/tokens";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import { STAGGER_BASE, STAGGER_DURATION } from "../animations";

const motivationOptions = [
  { value: "read_quran" as const, label: "Reading toward the Quran" },
  { value: "pray_confidently" as const, label: "Building toward confident salah" },
  { value: "connect_heritage" as const, label: "Connecting to your heritage" },
  { value: "teach_children" as const, label: "Learning to teach your children" },
  { value: "personal_growth" as const, label: "Growing in your faith" },
];

function OptionCard({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        optionStyles.card,
        {
          backgroundColor: selected ? colors.primarySoft : colors.bgCard,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          optionStyles.label,
          { color: selected ? colors.primary : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const optionStyles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: borderWidths.normal,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  label: {
    ...typography.bodyLarge,
    textAlign: "center",
  },
});

export function NameMotivation({
  userName,
  motivation,
  onChangeName,
  onSelectMotivation,
  onNext,
}: {
  userName: string;
  motivation: string | null;
  onChangeName: (value: string) => void;
  onSelectMotivation: (value: string) => void;
  onNext: () => void;
}) {
  const colors = useColors();

  return (
    <OnboardingStepLayout
      variant="card"
      fadeInDuration={STAGGER_DURATION}
      footer={
        <Button
          title="Continue"
          onPress={onNext}
          style={styles.fullWidthBtn}
        />
      }
    >
      <Text style={[styles.headline, { color: colors.brown }]}>
        What should we call you?
      </Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        Optional — we'll use this to personalize your experience
      </Text>

      <TextInput
        value={userName}
        onChangeText={onChangeName}
        placeholder="Your name"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="words"
        returnKeyType="done"
        style={[
          styles.textInput,
          {
            backgroundColor: colors.bgWarm,
            color: colors.text,
            borderColor: colors.border,
          },
        ]}
      />

      <View style={{ height: spacing.xl }} />

      <Text style={[styles.headline, { color: colors.brown }]}>
        What brings you here?
      </Text>

      <View style={{ height: spacing.md }} />

      {motivationOptions.map((opt, idx) => (
        <Animated.View
          key={`mot-${idx}`}
          entering={FadeInDown.delay(STAGGER_BASE * (idx + 1)).duration(STAGGER_DURATION)}
        >
          <OptionCard
            label={opt.label}
            selected={motivation === opt.value}
            onPress={() => onSelectMotivation(opt.value)}
            colors={colors}
          />
        </Animated.View>
      ))}
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  headline: {
    ...typography.heading1,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  textInput: {
    ...typography.bodyLarge,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: borderWidths.normal,
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },
});
