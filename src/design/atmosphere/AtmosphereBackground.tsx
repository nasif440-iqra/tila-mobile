import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { WarmGlow } from "./WarmGlow";
import { FloatingLettersLayer } from "./FloatingLettersLayer";
import { useColors, useTheme } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type AtmospherePreset =
  | "home"
  | "quiz"
  | "sacred"
  | "celebration"
  | "loading"
  | "onboarding";

interface PresetConfig {
  linearColors: [string, string];
  glowPositionX: string;
  glowPositionY: string;
  glowColor: string;
  glowOpacity: number;
  glowRadius: number; // fraction of screen width (0.7 = 70%)
  floatingLetters: boolean;
  floatingLetterSpeed: "normal" | "slow";
}

export const PRESETS: Record<AtmospherePreset, PresetConfig> = {
  home: {
    linearColors: ["#F8F6F0", "#F2EADE"],
    glowPositionX: "50%",
    glowPositionY: "15%",
    glowColor: "rgba(196, 164, 100, 0.3)",
    glowOpacity: 0.06,
    glowRadius: 0.7,
    floatingLetters: true,
    floatingLetterSpeed: "normal",
  },
  quiz: {
    linearColors: ["#F8F6F0", "#F2EADE"],
    glowPositionX: "50%",
    glowPositionY: "35%",
    glowColor: "rgba(196, 164, 100, 0.3)",
    glowOpacity: 0.08,
    glowRadius: 0.6,
    floatingLetters: false,
    floatingLetterSpeed: "normal",
  },
  sacred: {
    linearColors: ["#F2EADE", "#F8F6F0"],
    glowPositionX: "50%",
    glowPositionY: "20%",
    glowColor: "rgba(196, 164, 100, 0.3)",
    glowOpacity: 0.10,
    glowRadius: 0.8,
    floatingLetters: true,
    floatingLetterSpeed: "slow",
  },
  celebration: {
    linearColors: ["#F8F6F0", "#F2EADE"],
    glowPositionX: "50%",
    glowPositionY: "40%",
    glowColor: "rgba(196, 164, 100, 0.3)",
    glowOpacity: 0.12,
    glowRadius: 0.9,
    floatingLetters: true,
    floatingLetterSpeed: "normal",
  },
  loading: {
    linearColors: ["#F8F6F0", "#F8F6F0"],
    glowPositionX: "50%",
    glowPositionY: "50%",
    glowColor: "rgba(196, 164, 100, 0.3)",
    glowOpacity: 0.04,
    glowRadius: 0.5,
    floatingLetters: false,
    floatingLetterSpeed: "normal",
  },
  onboarding: {
    linearColors: ["#F2EADE", "#F8F6F0"],
    glowPositionX: "50%",
    glowPositionY: "25%",
    glowColor: "rgba(196, 164, 100, 0.3)",
    glowOpacity: 0.08,
    glowRadius: 0.75,
    floatingLetters: true,
    floatingLetterSpeed: "slow",
  },
};

export const DARK_PRESETS: Record<AtmospherePreset, PresetConfig> = {
  home: {
    linearColors: ["#1A1613", "#211D18"],
    glowPositionX: "50%",
    glowPositionY: "15%",
    glowColor: "rgba(196, 164, 100, 0.2)",
    glowOpacity: 0.06,
    glowRadius: 0.7,
    floatingLetters: true,
    floatingLetterSpeed: "normal",
  },
  quiz: {
    linearColors: ["#1A1613", "#211D18"],
    glowPositionX: "50%",
    glowPositionY: "35%",
    glowColor: "rgba(196, 164, 100, 0.2)",
    glowOpacity: 0.08,
    glowRadius: 0.6,
    floatingLetters: false,
    floatingLetterSpeed: "normal",
  },
  sacred: {
    linearColors: ["#211D18", "#1A1613"],
    glowPositionX: "50%",
    glowPositionY: "20%",
    glowColor: "rgba(196, 164, 100, 0.2)",
    glowOpacity: 0.10,
    glowRadius: 0.8,
    floatingLetters: true,
    floatingLetterSpeed: "slow",
  },
  celebration: {
    linearColors: ["#1A1613", "#211D18"],
    glowPositionX: "50%",
    glowPositionY: "40%",
    glowColor: "rgba(196, 164, 100, 0.2)",
    glowOpacity: 0.12,
    glowRadius: 0.9,
    floatingLetters: true,
    floatingLetterSpeed: "normal",
  },
  loading: {
    linearColors: ["#1A1613", "#1A1613"],
    glowPositionX: "50%",
    glowPositionY: "50%",
    glowColor: "rgba(196, 164, 100, 0.2)",
    glowOpacity: 0.04,
    glowRadius: 0.5,
    floatingLetters: false,
    floatingLetterSpeed: "normal",
  },
  onboarding: {
    linearColors: ["#211D18", "#1A1613"],
    glowPositionX: "50%",
    glowPositionY: "25%",
    glowColor: "rgba(196, 164, 100, 0.2)",
    glowOpacity: 0.08,
    glowRadius: 0.75,
    floatingLetters: true,
    floatingLetterSpeed: "slow",
  },
};

export function AtmosphereBackground({
  preset,
  children,
}: {
  preset: AtmospherePreset;
  children?: React.ReactNode;
}) {
  const colors = useColors();
  const { mode } = useTheme();
  const config = mode === "dark" ? DARK_PRESETS[preset] : PRESETS[preset];
  const glowSize = Math.round(SCREEN_WIDTH * config.glowRadius * 2);
  const glowY = (parseFloat(config.glowPositionY) / 100) * SCREEN_WIDTH;

  return (
    <View style={styles.container}>
      {/* Layer 1: Linear gradient base */}
      <LinearGradient
        colors={config.linearColors}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Layer 2: Radial glow */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.glowContainer,
          { top: glowY - glowSize / 2 },
        ]}
        pointerEvents="none"
      >
        <WarmGlow
          size={glowSize}
          opacity={config.glowOpacity}
          animated={true}
          color={config.glowColor}
        />
      </View>

      {/* Layer 3: Optional floating letters */}
      {config.floatingLetters && (
        <FloatingLettersLayer color={colors.primary} />
      )}

      {/* Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowContainer: {
    alignItems: "center",
  },
});
