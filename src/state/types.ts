import type { ProgressState, HabitState } from '../engine/progress';
import type { SubscriptionState } from '../monetization/provider';

export interface AppState {
  progress: ProgressState | null;
  habit: HabitState | null;
  subscription: SubscriptionState | null;
  loading: boolean;
}

export interface AppStateContextValue extends AppState {
  refreshAll: () => Promise<void>;
}
