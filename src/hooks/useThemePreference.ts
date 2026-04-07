import type { ThemeMode } from "../design/theme";

// Beta: force light mode. Dark palette needs polish before user testing.
// To restore: revert this file from git (pre-beta version).
export function useThemePreference() {
  return {
    themeMode: "light" as ThemeMode,
    updateThemeMode: async (_mode: ThemeMode) => {},
    loaded: true,
  };
}
