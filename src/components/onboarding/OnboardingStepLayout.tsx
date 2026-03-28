import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../design/tokens";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OnboardingStepLayoutProps {
  variant: "splash" | "centered" | "card";
  fadeInDuration?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function OnboardingStepLayout({
  variant,
  fadeInDuration = 600,
  children,
  footer,
}: OnboardingStepLayoutProps) {
  const insets = useSafeAreaInsets();

  const contentStyle =
    variant === "splash"
      ? layoutStyles.splashContent
      : variant === "centered"
      ? layoutStyles.centeredContent
      : layoutStyles.cardContent;

  return (
    <Animated.View entering={FadeIn.duration(fadeInDuration)} style={layoutStyles.root}>
      <View style={[layoutStyles.contentArea, contentStyle]}>
        {children}
      </View>
      {footer && (
        <View style={[layoutStyles.footer, { paddingBottom: Math.max(insets.bottom, spacing.xxxl) }]}>
          {footer}
        </View>
      )}
    </Animated.View>
  );
}

const layoutStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  splashContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: SCREEN_HEIGHT * 0.15,
  },
  centeredContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
  },
  cardContent: {
    alignItems: "stretch",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
  },
});
