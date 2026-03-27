export type {
  EntityState,
  SkillState,
  ConfusionState,
} from '../engine/progress';

export interface MasteryState {
  entities: Record<string, import('../engine/progress').EntityState>;
  skills: Record<string, import('../engine/progress').SkillState>;
  confusions: Record<string, import('../engine/progress').ConfusionState>;
}
