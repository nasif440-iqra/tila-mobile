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

  // Run migrations for existing databases
  await runMigrations(db);

  // Stamp the current schema version (for fresh DBs, migrations are no-ops but version must be set)
  await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (?)", SCHEMA_VERSION);

  dbInstance = db;
  return db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const versionRow = await db.getFirstAsync<{ version: number }>(
    "SELECT MAX(version) as version FROM schema_version"
  );
  const currentVersion = versionRow?.version ?? 0;

  if (currentVersion < 2) {
    // Add transient screen tracking columns (safe — ALTER TABLE ADD COLUMN is idempotent-ish)
    try {
      await db.execAsync(`
        ALTER TABLE user_profile ADD COLUMN wird_intro_seen INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE user_profile ADD COLUMN post_lesson_onboard_seen INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE user_profile ADD COLUMN return_hadith_last_shown TEXT;
      `);
    } catch {
      // Columns may already exist if DB was created fresh with v2 schema
    }
    await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (2)");
  }

  if (currentVersion < 3) {
    // Check if the column already exists before trying to add it
    const tableInfo = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(mastery_confusions)"
    );
    const hasCategories = tableInfo.some((col) => col.name === "categories");
    if (!hasCategories) {
      await db.execAsync(
        "ALTER TABLE mastery_confusions ADD COLUMN categories TEXT;"
      );
    }
    await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (3)");
  }

  if (currentVersion < 4) {
    const profileInfo = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(user_profile)"
    );
    const hasAnalyticsConsent = profileInfo.some((col) => col.name === "analytics_consent");
    if (!hasAnalyticsConsent) {
      await db.execAsync(
        "ALTER TABLE user_profile ADD COLUMN analytics_consent INTEGER CHECK (analytics_consent IN (0, 1));"
      );
    }
    await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (4)");
  }

  if (currentVersion < 5) {
    const tableCheck = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='premium_lesson_grants'"
    );
    if (!tableCheck) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS premium_lesson_grants (
          lesson_id INTEGER NOT NULL PRIMARY KEY,
          granted_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    }
    await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (5)");
  }
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
    DROP TABLE IF EXISTS premium_lesson_grants;
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
