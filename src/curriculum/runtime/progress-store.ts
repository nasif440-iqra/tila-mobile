import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "tila.progress";

export interface ProgressState {
  completedLessonIds: string[];
  lastReachedLessonId: string | null;
}

const INITIAL: ProgressState = {
  completedLessonIds: [],
  lastReachedLessonId: null,
};

const LESSON_SEQUENCE = [
  "lesson-01",
  "lesson-02",
  "lesson-03",
  "lesson-04",
  "lesson-05",
  "lesson-06",
  "lesson-07",
  "lesson-08",
];

async function read(): Promise<ProgressState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...INITIAL };
    return JSON.parse(raw) as ProgressState;
  } catch (err) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[progress-store] read failed", err);
    }
    return { ...INITIAL };
  }
}

async function write(state: ProgressState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[progress-store] write failed", err);
    }
  }
}

export const progressStore = {
  async getProgress(): Promise<ProgressState> {
    return read();
  },

  async markCompleted(lessonId: string): Promise<void> {
    const state = await read();
    if (state.completedLessonIds.includes(lessonId)) return;
    await write({
      ...state,
      completedLessonIds: [...state.completedLessonIds, lessonId],
    });
  },

  async setLastReached(lessonId: string): Promise<void> {
    const state = await read();
    await write({ ...state, lastReachedLessonId: lessonId });
  },

  async isUnlocked(lessonId: string): Promise<boolean> {
    if (lessonId === LESSON_SEQUENCE[0]) return true;
    const idx = LESSON_SEQUENCE.indexOf(lessonId);
    if (idx === -1) return false;
    const prev = LESSON_SEQUENCE[idx - 1];
    const state = await read();
    return state.completedLessonIds.includes(prev);
  },
};
