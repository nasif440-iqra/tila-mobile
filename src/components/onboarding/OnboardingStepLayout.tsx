import React from "react";
import { StyleSheet, Dimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { spacing } from "../../design/tokens";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OnboardingStepLayoutProps {
  variant: "splash" | "centered" | "card";
  fadeInDuration?: number;
  children: React.ReactNode;
}

export function OnboardingStepLayout({
  variant,
  fadeInDuration = 600,
  children,
}: OnboardingStepLayoutProps) {
  const style =
    variant === "splash"
      ? layoutStyles.splashStep
      : variant === "centered"
      ? layoutStyles.centeredStep
      : layoutStyles.cardStep;

  return (
    <Animated.View entering={FadeIn.duration(fadeInDuration)} style={style}>
      {children}
    </Animated.View>
  );
}

const layoutStyles = StyleSheet.create({
  splashStep: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: SCREEN_HEIGHT * 0.15,
    paddingBottom: spacing.xxxl,
  },
  centeredStep: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
  },
  cardStep: {
    alignItems: "stretch",
    paddingVertical: spacing.xxxl,
  },
});
