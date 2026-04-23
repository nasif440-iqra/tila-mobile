import type { LessonData } from "../types";
import { lessonOne } from "./lesson-01";

export const lessonRegistry: Record<string, LessonData> = {
  [lessonOne.id]: lessonOne,
};
