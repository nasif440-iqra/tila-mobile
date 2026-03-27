import { useCallback } from "react";
import { useDatabase } from "../db/provider";
import {
  saveMasteryEntity,
  saveMasterySkill,
  saveMasteryConfusion,
  type EntityState,
  type SkillState,
  type ConfusionState,
} from "../engine/progress";

export function useMastery() {
  const db = useDatabase();

  const updateEntity = useCallback(
    async (entityKey: string, state: EntityState) => {
      await saveMasteryEntity(db, entityKey, state);
    },
    [db]
  );

  const updateSkill = useCallback(
    async (skillKey: string, state: SkillState) => {
      await saveMasterySkill(db, skillKey, state);
    },
    [db]
  );

  const updateConfusion = useCallback(
    async (confusionKey: string, state: ConfusionState) => {
      await saveMasteryConfusion(db, confusionKey, state);
    },
    [db]
  );

  return { updateEntity, updateSkill, updateConfusion };
}
