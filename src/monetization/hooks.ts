import { useContext } from "react";
import { SubscriptionContext, type SubscriptionState } from "./provider";

// Stubbed to max — no lesson gating until new curriculum lands.
const FREE_LESSON_CUTOFF = Number.MAX_SAFE_INTEGER;

export function useSubscription(): SubscriptionState {
  return useContext(SubscriptionContext);
}

export function useCanAccessLesson(_lessonId: number): boolean {
  // Stubbed always-allow — no lessons to gate until new curriculum lands.
  return true;
}

export function usePremiumReviewRights(_grantedLessonIds: number[]): number[] {
  // Stubbed empty — no lessons to derive letter IDs from until new curriculum lands.
  return [];
}

export { FREE_LESSON_CUTOFF };
