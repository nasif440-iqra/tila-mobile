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
  // Drop all tables and recreate with latest schema (picks up CHECK constraint changes)
  await db.execAsync(`
    DROP TABLE IF EXISTS question_attempts;
    DROP TABLE IF EXISTS lesson_attempts;
    DROP TABLE IF EXISTS mastery_entities;
    DROP TABLE IF EXISTS mastery_skills;
    DROP TABLE IF EXISTS mastery_confusions;
    DROP TABLE IF EXISTS habit;
    DROP TABLE IF EXISTS user_profile;
    DROP TABLE IF EXISTS schema_version;
  `);
  await db.execAsync(CREATE_TABLES);
  await db.execAsync(SEED_DEFAULTS);
}

export async function getDatabaseVersion(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ version: number }>(
    "SELECT MAX(version) as version FROM schema_version"
  );
  return result?.version ?? 0;
}
