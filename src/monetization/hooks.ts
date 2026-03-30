import { useContext, useMemo } from "react";
import { SubscriptionContext, type SubscriptionState } from "./provider";
import { LESSONS } from "../data/lessons";

const FREE_LESSON_CUTOFF = 7;

export function useSubscription(): SubscriptionState {
  return useContext(SubscriptionContext);
}

export function useCanAccessLesson(lessonId: number): boolean {
  const { isPremiumActive, loading } = useSubscription();
  if (lessonId <= FREE_LESSON_CUTOFF) return true;
  if (loading) return false;
  return isPremiumActive;
}

export function usePremiumReviewRights(grantedLessonIds: number[]): number[] {
  return useMemo(() => {
    const letterIds = new Set<number>();

    // All letters from free lessons are always reviewable
    for (const lesson of LESSONS) {
      if (lesson.id <= FREE_LESSON_CUTOFF) {
        for (const id of lesson.teachIds || []) {
          letterIds.add(id);
        }
      }
    }

    // Add letters from granted premium lessons
    for (const lessonId of grantedLessonIds) {
      const lesson = LESSONS.find((l: any) => l.id === lessonId);
      if (lesson) {
        for (const id of lesson.teachIds || []) {
          letterIds.add(id);
        }
      }
    }

    return Array.from(letterIds);
  }, [grantedLessonIds]);
}

export { FREE_LESSON_CUTOFF };
