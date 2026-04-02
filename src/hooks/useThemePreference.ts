import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../db/provider";
import type { ThemeMode } from "../design/theme";

export function useThemePreference() {
  const db = useDatabase();
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.getFirstAsync<{ theme_mode: string }>(
      "SELECT theme_mode FROM user_profile WHERE id = 1"
    )
      .then((row) => {
        if (row?.theme_mode) {
          setThemeMode(row.theme_mode as ThemeMode);
        }
        setLoaded(true);
      })
      .catch(() => {
        // Default to 'system' on error
        setLoaded(true);
      });
  }, [db]);

  const updateThemeMode = useCallback(
    async (mode: ThemeMode) => {
      setThemeMode(mode);
      await db.runAsync(
        "UPDATE user_profile SET theme_mode = ?, updated_at = datetime('now') WHERE id = 1",
        mode
      );
    },
    [db]
  );

  return { themeMode, updateThemeMode, loaded };
}
