export interface Lesson {
  id: number;
  phase: number;
  lessonMode: string;
  lessonType?: string;
  module: string;
  moduleTitle?: string;
  title: string;
  description: string;
  teachIds: number[];
  reviewIds: number[];
  familyRule?: string;
  hasSpeaking?: boolean;
  hybridSteps?: any[];
}
