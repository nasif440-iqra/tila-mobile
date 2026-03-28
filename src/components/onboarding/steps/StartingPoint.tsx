import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { Button } from "../../../design/components";
import { typography, spacing, radii, shadows, borderWidths } from "../../../design/tokens";
import { playTap } from "../../../audio/player";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import { STAGGER_BASE, STAGGER_DURATION } from "../animations";

const startingPointOptions = [
  { label: "I'm completely new", value: "new" as const },
  { label: "I know a few letters", value: "some_arabic" as const },
  { label: "I used to learn, but forgot a lot", value: "rusty" as const },
  { label: "I can read a little, but want stronger basics", value: "can_read" as const },
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
      onPress={() => {
        playTap();
        onPress();
      }}
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

export function StartingPoint({
  startingPoint,
  onSelectStartingPoint,
  onNext,
}: {
  startingPoint: string | null;
  onSelectStartingPoint: (value: string) => void;
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
          disabled={!startingPoint}
          style={styles.fullWidthBtn}
        />
      }
    >
      <Text style={[styles.headline, { color: colors.brown }]}>
        Where are you starting from?
      </Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        Choose what feels most true right now.
      </Text>

      <View style={{ height: spacing.xl }} />

      {startingPointOptions.map((opt, idx) => (
        <Animated.View
          key={`sp-${idx}`}
          entering={FadeInDown.delay(STAGGER_BASE * (idx + 1)).duration(STAGGER_DURATION)}
        >
          <OptionCard
            label={opt.label}
            selected={startingPoint === opt.value}
            onPress={() => onSelectStartingPoint(opt.value)}
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
  fullWidthBtn: {
    width: "100%",
  },
});
