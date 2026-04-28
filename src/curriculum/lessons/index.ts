import type { LessonData } from "../types";
import { lessonOne } from "./lesson-01";
import { lessonTwo } from "./lesson-02";

export const lessonRegistry: Record<string, LessonData> = {
  [lessonOne.id]: lessonOne,
  [lessonTwo.id]: lessonTwo,
};
