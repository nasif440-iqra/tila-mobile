import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "../../../design/theme";
import { Button } from "../../../design/components";
import { typography, spacing, radii, fontFamilies } from "../../../design/tokens";

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    borderWidth: 1.5,
    marginBottom: spacing.sm,
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
    <Animated.View entering={FadeIn.duration(500)} style={styles.cardStep}>
      <Text style={[styles.headline, { color: colors.text }]}>
        Where are you starting from?
      </Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        Choose what feels most true right now.
      </Text>

      <View style={styles.spacerMd} />

      {startingPointOptions.map((opt, idx) => (
        <Animated.View
          key={`sp-${idx}`}
          entering={FadeInDown.delay(300 + idx * 60).duration(400)}
        >
          <OptionCard
            label={opt.label}
            selected={startingPoint === opt.value}
            onPress={() => onSelectStartingPoint(opt.value)}
            colors={colors}
          />
        </Animated.View>
      ))}

      <View style={styles.spacerMd} />

      <Button
        title="Continue"
        onPress={onNext}
        disabled={!startingPoint}
        style={styles.fullWidthBtn}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardStep: {
    alignItems: "stretch",
    paddingVertical: spacing.xxxl,
  },
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
  spacerMd: { height: spacing.xl },
});
