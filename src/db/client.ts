import * as SQLite from "expo-sqlite";
import { CREATE_TABLES, SEED_DEFAULTS, SCHEMA_VERSION } from "./schema";

const DB_NAME = "tila.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable foreign key enforcement (off by default in SQLite)
  await db.execAsync("PRAGMA foreign_keys = ON;");

  // Create tables (idempotent via IF NOT EXISTS)
  await db.execAsync(CREATE_TABLES);

  // Seed default rows
  await db.execAsync(SEED_DEFAULTS);

  dbInstance = db;
  return db;
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM question_attempts;
    DELETE FROM lesson_attempts;
    DELETE FROM mastery_entities;
    DELETE FROM mastery_skills;
    DELETE FROM mastery_confusions;
    DELETE FROM habit;
    DELETE FROM user_profile;
  `);
  // Re-seed defaults
  await db.execAsync(SEED_DEFAULTS);
}

export async function getDatabaseVersion(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ version: number }>(
    "SELECT MAX(version) as version FROM schema_version"
  );
  return result?.version ?? 0;
}
