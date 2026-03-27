// ── Color Tokens ──

export const lightColors = {
  bg: "#F8F6F0",
  bgWarm: "#F2EADE",
  bgCard: "#FFFFFF",
  primary: "#163323",
  primaryLight: "#255038",
  primarySoft: "#E8F0EB",
  primaryDark: "#0F2419",
  accent: "#C4A464",
  accentLight: "#F5EDDB",
  accentGlow: "rgba(196, 164, 100, 0.3)",
  danger: "#BD524D",
  dangerLight: "#FCE6E5",
  dangerDark: "#7A2E2B",
  text: "#163323",
  textSoft: "#52545C",
  textMuted: "#6B6760",
  border: "#EBE6DC",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const darkColors = {
  bg: "#0F1A14",
  bgWarm: "#142019",
  bgCard: "#1C2A22",
  primary: "#A8D5BA",
  primaryLight: "#7ABF95",
  primarySoft: "#1E3328",
  primaryDark: "#D4EAE0",
  accent: "#C4A464",
  accentLight: "#2A2418",
  accentGlow: "rgba(196, 164, 100, 0.2)",
  danger: "#E07672",
  dangerLight: "#2A1A1A",
  dangerDark: "#F0A8A6",
  text: "#E8E4DC",
  textSoft: "#A0A4AC",
  textMuted: "#8A8680",
  border: "#2A3028",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export type ColorTokens = typeof lightColors;

// ── Typography ──

export const fontFamilies = {
  arabicRegular: "Amiri_400Regular",
  arabicBold: "Amiri_700Bold",
  bodyRegular: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  headingRegular: "Lora_400Regular",
  headingMedium: "Lora_500Medium",
  headingSemiBold: "Lora_600SemiBold",
  headingBold: "Lora_700Bold",
  headingItalic: "Lora_400Regular_Italic",
} as const;

export const typography = {
  arabicDisplay: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 48,
    lineHeight: 72,
  },
  arabicLarge: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 36,
    lineHeight: 54,
  },
  arabicBody: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 24,
    lineHeight: 36,
  },
  heading1: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 24,
    lineHeight: 32,
  },
  heading2: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  heading3: {
    fontFamily: fontFamilies.headingMedium,
    fontSize: 17,
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 17,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 11,
    lineHeight: 16,
  },
} as const;

// ── Spacing (8px base rhythm) ──

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ── Border Radii ──

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ── Shadows ──

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLifted: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  soft: {
    shadowColor: "#163323",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;
