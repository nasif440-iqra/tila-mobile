import { useState, useEffect, useCallback } from "react";

import { useDatabase } from "../db/provider";
import type { EntityMastery, RecentAttempt, ConfusionRecord } from "../engine/v2/mastery";
import { createEntityMastery } from "../engine/v2/mastery";
import type { MasterySnapshot, EntityMasteryState } from "../types/exercise";

// ── Types ──

interface UseMasteryV2Return {
  snapshot: MasterySnapshot;
  loading: boolean;
  loadAllMastery: () => Promise<EntityMastery[]>;
  saveMasteryUpdate: (mastery: EntityMastery) => Promise<void>;
  saveMasteryUpdates: (updates: EntityMastery[]) => Promise<void>;
  getOrCreateMastery: (entityId: string) => Promise<EntityMastery>;
  reload: () => Promise<void>;
}

// ── Row shape returned from SQLite ──

interface MasteryRow {
  entity_id: string;
  profile_id: string;
  state: string;
  correct_count: number;
  attempt_count: number;
  recent_attempts: string;
  interval_days: number;
  next_review: string | null;
  session_streak: number;
  confusion_pairs: string;
}

function rowToEntityMastery(row: MasteryRow): EntityMastery {
  return {
    entityId: row.entity_id,
    state: row.state as EntityMastery["state"],
    correctCount: row.correct_count,
    attemptCount: row.attempt_count,
    recentAttempts: JSON.parse(row.recent_attempts || "[]") as RecentAttempt[],
    intervalDays: row.interval_days,
    nextReview: row.next_review ?? "",
    sessionStreak: row.session_streak,
    confusionPairs: JSON.parse(row.confusion_pairs || "[]") as ConfusionRecord[],
  };
}

// ── Hook ──

export function useMasteryV2(): UseMasteryV2Return {
  const db = useDatabase();
  const [snapshot, setSnapshot] = useState<MasterySnapshot>({
    entityStates: new Map(),
    confusionPairs: new Map(),
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);

    const rows = await db.getAllAsync<{
      entity_id: string;
      state: string;
      correct_count: number;
      attempt_count: number;
      confusion_pairs: string;
    }>(
      "SELECT entity_id, state, correct_count, attempt_count, confusion_pairs FROM v2_entity_mastery WHERE profile_id = 'local'"
    );

    const states = new Map<string, EntityMasteryState>();
    const confusions = new Map<string, string[]>();

    for (const row of rows) {
      states.set(row.entity_id, {
        state: row.state as EntityMasteryState["state"],
        correctCount: row.correct_count,
        attemptCount: row.attempt_count,
      });

      const pairs: ConfusionRecord[] = JSON.parse(row.confusion_pairs || "[]");
      if (pairs.length > 0) {
        confusions.set(row.entity_id, pairs.map((p) => p.entityId));
      }
    }

    setSnapshot({ entityStates: states, confusionPairs: confusions });
    setLoading(false);
  }, [db]);

  // Load on mount
  useEffect(() => {
    reload();
  }, [reload]);

  const loadAllMastery = useCallback(async (): Promise<EntityMastery[]> => {
    const rows = await db.getAllAsync<MasteryRow>(
      "SELECT * FROM v2_entity_mastery WHERE profile_id = 'local'"
    );
    return rows.map(rowToEntityMastery);
  }, [db]);

  const saveMasteryUpdate = useCallback(
    async (mastery: EntityMastery) => {
      await db.runAsync(
        `INSERT OR REPLACE INTO v2_entity_mastery (
          entity_id, profile_id, state, correct_count, attempt_count,
          recent_attempts, interval_days, next_review, session_streak,
          confusion_pairs, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          mastery.entityId,
          "local",
          mastery.state,
          mastery.correctCount,
          mastery.attemptCount,
          JSON.stringify(mastery.recentAttempts),
          mastery.intervalDays,
          mastery.nextReview || null,
          mastery.sessionStreak,
          JSON.stringify(mastery.confusionPairs),
        ]
      );
    },
    [db]
  );

  const saveMasteryUpdates = useCallback(
    async (updates: EntityMastery[]) => {
      await db.withExclusiveTransactionAsync(async () => {
        for (const mastery of updates) {
          await saveMasteryUpdate(mastery);
        }
      });
      await reload();
    },
    [db, saveMasteryUpdate, reload]
  );

  const getOrCreateMastery = useCallback(
    async (entityId: string): Promise<EntityMastery> => {
      const row = await db.getFirstAsync<MasteryRow>(
        "SELECT * FROM v2_entity_mastery WHERE entity_id = ? AND profile_id = 'local'",
        [entityId]
      );
      if (row) {
        return rowToEntityMastery(row);
      }
      return createEntityMastery(entityId);
    },
    [db]
  );

  return {
    snapshot,
    loading,
    loadAllMastery,
    saveMasteryUpdate,
    saveMasteryUpdates,
    getOrCreateMastery,
    reload,
  };
}
