import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "tila.lesson-completion.";

export interface CompletionStore {
  markCompleted(lessonId: string): Promise<void>;
  getCompletion(lessonId: string): Promise<boolean>;
  clearAll(): Promise<void>;
}

function keyFor(lessonId: string): string {
  return `${KEY_PREFIX}${lessonId}`;
}

export const asyncStorageCompletionStore: CompletionStore = {
  async markCompleted(lessonId) {
    try {
      await AsyncStorage.setItem(keyFor(lessonId), "true");
    } catch (err) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[completion-store] markCompleted failed", err);
      }
    }
  },

  async getCompletion(lessonId) {
    try {
      const v = await AsyncStorage.getItem(keyFor(lessonId));
      return v === "true";
    } catch (err) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[completion-store] getCompletion failed", err);
      }
      return false;
    }
  },

  async clearAll() {
    try {
      const all = await AsyncStorage.getAllKeys();
      const ours = all.filter((k) => k.startsWith(KEY_PREFIX));
      if (ours.length > 0) {
        await AsyncStorage.multiRemove(ours);
      }
    } catch (err) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[completion-store] clearAll failed", err);
      }
    }
  },
};
