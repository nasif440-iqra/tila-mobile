import type { SQLiteDatabase } from "expo-sqlite";
import { V2_SCHEMA_VERSION, V2_CREATE_TABLES } from "./schema-v2";

export async function migrateV2(db: SQLiteDatabase): Promise<void> {
  const versionRow = await db
    .getFirstAsync<{ version: number }>("SELECT version FROM v2_schema_version ORDER BY version DESC LIMIT 1")
    .catch(() => null);

  const currentVersion = versionRow?.version ?? 0;
  if (currentVersion >= V2_SCHEMA_VERSION) return;

  await db.execAsync(V2_CREATE_TABLES);

  await db.runAsync(
    "INSERT OR REPLACE INTO v2_schema_version (version) VALUES (?)",
    [V2_SCHEMA_VERSION]
  );
}
