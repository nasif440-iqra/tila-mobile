import type { SQLiteDatabase } from "expo-sqlite";

export type CurriculumVersion = "v1" | "v2";

const PRODUCTION_DEFAULT: CurriculumVersion = "v1";

let resolvedVersion: CurriculumVersion | null = null;

export async function resolveCurriculumVersion(
  db: SQLiteDatabase,
): Promise<CurriculumVersion> {
  if (resolvedVersion) return resolvedVersion;

  // 1. Dev override via env
  if (typeof __DEV__ !== "undefined" && __DEV__ && process.env.EXPO_PUBLIC_CURRICULUM_OVERRIDE) {
    resolvedVersion = process.env.EXPO_PUBLIC_CURRICULUM_OVERRIDE as CurriculumVersion;
    return resolvedVersion;
  }

  // 2. User profile flag (column may not exist yet — added by migrateV2)
  try {
    const row = await db.getFirstAsync<{ curriculum_version: string | null }>(
      "SELECT curriculum_version FROM user_profile WHERE id = 1"
    );
    if (row?.curriculum_version === "v2") {
      resolvedVersion = "v2";
      return resolvedVersion;
    }
  } catch { /* column doesn't exist yet */ }

  // 3. Production default
  resolvedVersion = PRODUCTION_DEFAULT;
  return resolvedVersion;
}

// For testing: reset the cached version
export function resetCurriculumVersionCache(): void {
  resolvedVersion = null;
}
