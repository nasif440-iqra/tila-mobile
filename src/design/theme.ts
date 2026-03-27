import { createContext, useContext } from "react";
import { lightColors, darkColors, type ColorTokens } from "./tokens";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  colors: ColorTokens;
  mode: "light" | "dark";
}

export const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  mode: "light",
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useColors(): ColorTokens {
  return useContext(ThemeContext).colors;
}

export function resolveColors(
  preferredMode: ThemeMode,
  systemScheme: "light" | "dark" | null | undefined
): { colors: ColorTokens; mode: "light" | "dark" } {
  const resolved =
    preferredMode === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preferredMode;
  return {
    colors: resolved === "dark" ? darkColors : lightColors,
    mode: resolved,
  };
}
