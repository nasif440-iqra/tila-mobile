# Pre-Reset Grep Audit — 2026-04-20

Executed before Task 5 (strip lessons). Each section records consumers found and their disposition.

## Lesson data / types
### LESSONS
```
src/auth/types.ts:22:export const ACCOUNT_PROMPT_LESSONS = [3, 5, 7] as const;
src/components/home/LessonGrid.tsx:13:import { LESSONS } from "../../data/lessons";
src/components/home/LessonGrid.tsx:208:    for (const lesson of LESSONS) {
src/components/LessonSummary.tsx:34:import { LESSONS } from "../data/lessons";
src/components/LessonSummary.tsx:314:    () => LESSONS.find((l: any) => l.id === lesson.id + 1) ?? null,
src/components/progress/PhaseDetailSheet.tsx:20:import { LESSONS } from "../../data/lessons";
src/components/progress/PhaseDetailSheet.tsx:108:    return LESSONS.filter((l: any) => l.phase === phaseKey).map((l: any) => {
src/data/lessons.js:1:export const LESSONS = [
src/engine/questions/shared.ts:2:import { LESSONS } from "../../data/lessons.js";
src/engine/questions/shared.ts:87: * Uses array position in LESSONS (not ID comparison) since IDs are non-sequential.
src/engine/questions/shared.ts:91:  for (const l of LESSONS) {
src/engine/selectors.ts:1:import { LESSONS } from "../data/lessons.js";
src/engine/selectors.ts:17:  return LESSONS.find(l => l.id === lastId) || null;
src/engine/selectors.ts:22:  return LESSONS.find(l => !done.has(l.id)) || LESSONS[LESSONS.length - 1];
src/engine/selectors.ts:32:  for (let i = 0; i < LESSONS.length; i++) {
src/engine/selectors.ts:33:    const l = LESSONS[i];
src/engine/selectors.ts:38:  return LESSONS[LESSONS.length - 1];
src/engine/selectors.ts:44:    LESSONS.filter(l => done.has(l.id)).flatMap(l => l.teachIds || [])
src/engine/selectors.ts:61:  const p1 = LESSONS.filter(l => l.phase === 1);
src/engine/selectors.ts:62:  const p2 = LESSONS.filter(l => l.phase === 2);
src/engine/selectors.ts:63:  const p3 = LESSONS.filter(l => l.phase === 3);
src/engine/selectors.ts:64:  const p4 = LESSONS.filter(l => l.phase === 4);
src/engine/unlock.ts:9:import { LESSONS, PHASE_1_COMPLETION_THRESHOLD, PHASE_2_COMPLETION_THRESHOLD, PHASE_3_COMPLETION_THRESHOLD } from "../data/lessons.js";
src/engine/unlock.ts:31:  const phaseLessons = LESSONS.filter(l => l.phase === phase);
src/engine/unlock.ts:64:  const cur = LESSONS[lessonIndex];
src/engine/unlock.ts:65:  const prev = LESSONS[lessonIndex - 1];
src/engine/unlock.ts:69:    const p1Done = LESSONS.filter(l => l.phase === 1 && completedLessonIds.includes(l.id)).length;
src/engine/unlock.ts:75:    const p2Done = LESSONS.filter(l => l.phase === 2 && completedLessonIds.includes(l.id)).length;
src/engine/unlock.ts:81:    const p3Done = LESSONS.filter(l => l.phase === 3 && completedLessonIds.includes(l.id)).length;
src/engine/unlock.ts:94:  const p1Done = LESSONS.filter(l => l.phase === 1 && completedLessonIds.includes(l.id)).length;
src/engine/unlock.ts:104:  const p2Done = LESSONS.filter(l => l.phase === 2 && completedLessonIds.includes(l.id)).length;
src/engine/unlock.ts:114:  const p3Done = LESSONS.filter(l => l.phase === 3 && completedLessonIds.includes(l.id)).length;
src/monetization/hooks.ts:3:import { LESSONS } from "../data/lessons";
src/monetization/hooks.ts:22:    for (const lesson of LESSONS) {
src/monetization/hooks.ts:32:      const lesson = LESSONS.find((l: any) => l.id === lessonId);
src/__tests__/checkpoint-classifier.test.ts:3:import { LESSONS } from "../data/lessons.js";
src/__tests__/checkpoint-classifier.test.ts:8:  const lesson = LESSONS.find(
src/__tests__/integration-premium-locking.test.ts:34:const MOCK_LESSONS: MockLesson[] = [
src/__tests__/integration-premium-locking.test.ts:51:  for (const lesson of MOCK_LESSONS) {
src/__tests__/integration-premium-locking.test.ts:61:    const lesson = MOCK_LESSONS.find((l) => l.id === lessonId);
src/__tests__/questions.test.js:27:import { LESSONS } from "../data/lessons.js";
src/__tests__/questions.test.js:43:  const lesson = LESSONS.find(predicate);
src/__tests__/questions.test.js:97:      const laterLesson = LESSONS.find((l) => l.id >= 5);
src/__tests__/questions.test.js:111:      const firstId = LESSONS[0].id;
src/__tests__/questions.test.js:317:    const recogLessons = LESSONS.filter(l => l.lessonMode === "recognition").slice(0, 10);
src/__tests__/questions.test.js:344:    const checkpoint = LESSONS.find(l => l.lessonMode === "checkpoint");
src/__tests__/questions.test.js:429:    const lessonWithReview = LESSONS.find(
src/__tests__/questions.test.js:550:    const contrastLessons = LESSONS.filter(
src/__tests__/questions.test.js:644:    const mixedLessons = LESSONS.filter(
src/__tests__/questions.test.js:709:    const p1 = LESSONS.find(l => l.lessonMode === "checkpoint" && l.phase === 1);
src/__tests__/questions.test.js:719:    const p2 = LESSONS.find(l => l.lessonMode === "checkpoint" && l.phase === 2);
src/__tests__/questions.test.js:731:    const p2 = LESSONS.find(l => l.lessonMode === "checkpoint" && l.phase === 2);
src/__tests__/questions.test.js:935:    const lesson = LESSONS.find((l) => l.lessonMode === "harakat-mixed");
src/__tests__/questions.test.js:966:    const recognitionLessons = LESSONS.filter(
src/__tests__/questions.test.js:979:    const soundLessons = LESSONS.filter((l) => l.lessonMode === "sound");
src/__tests__/questions.test.js:990:    const contrastLessons = LESSONS.filter(
src/__tests__/questions.test.js:1003:    const checkpointLessons = LESSONS.filter(
src/__tests__/questions.test.js:1016:    const introLessons = LESSONS.filter(
src/__tests__/questions.test.js:1034:    const harakatLessons = LESSONS.filter(
src/__tests__/questions.test.js:1056:  it("generateLessonQuestions works for every lesson in LESSONS", () => {
src/__tests__/questions.test.js:1057:    for (const lesson of LESSONS) {
src/__tests__/questions.test.js:1280:  const recognitionLessons = LESSONS.filter(l => l.lessonMode === "recognition").slice(0, 5);
src/__tests__/questions.test.js:1281:  const checkpointLessons = LESSONS.filter(l => l.lessonMode === "checkpoint");
src/__tests__/questions.test.js:1282:  const harakatLessons = LESSONS.filter(l => ["harakat", "harakat-mixed"].includes(l.lessonMode)).slice(0, 5);
src/__tests__/questions.test.js:1333:      for (const lesson of LESSONS) {
src/__tests__/questions.test.js:1346:      for (const lesson of LESSONS) {
src/__tests__/questions.test.js:1380:    const recogLessons = LESSONS.filter(l => l.lessonMode === "recognition");
src/__tests__/questions.test.js:1398:    const checkpoints = LESSONS.filter(l => l.lessonMode === "checkpoint" && l.phase === 1);
src/__tests__/questions.test.js:1442:      for (const lesson of LESSONS) {
src/__tests__/questions.test.js:1461:    const contrastLessons = LESSONS.filter(l => l.lessonMode === "contrast");
src/__tests__/questions.test.js:1479:    const harakatLessons = LESSONS.filter(l =>
src/__tests__/selectors.test.js:2:import { LESSONS } from "../data/lessons.js";
src/__tests__/selectors.test.js:6:const ALL_IDS = LESSONS.map(l => l.id);
src/__tests__/selectors.test.js:7:const LAST_LESSON_ID = LESSONS[LESSONS.length - 1].id;
src/__tests__/selectors.test.js:8:const TOTAL_LESSONS = LESSONS.length;
src/__tests__/selectors.test.js:66:    expect(counts.p1Total).toBe(LESSONS.filter(l => l.phase === 1).length);
src/__tests__/selectors.test.js:67:    expect(counts.p2Total).toBe(LESSONS.filter(l => l.phase === 2).length);
src/__tests__/selectors.test.js:68:    expect(counts.p3Total).toBe(LESSONS.filter(l => l.phase === 3).length);
src/__tests__/selectors.test.js:69:    const p4Total = LESSONS.filter(l => l.phase === 4).length;
src/__tests__/selectors.test.js:70:    expect(counts.p1Total + counts.p2Total + counts.p3Total + p4Total).toBe(TOTAL_LESSONS);
src/__tests__/selectors.test.js:311:    const ids = LESSONS.filter(l => l.phase === 3).slice(0, 11).map(l => l.id);
src/__tests__/selectors.test.js:316:    const ids = LESSONS.filter(l => l.phase === 3).slice(0, 12).map(l => l.id);
app/(tabs)/index.tsx:30:import { LESSONS } from "../../src/data/lessons";
app/(tabs)/index.tsx:104:  const phaseLessons = LESSONS.filter((l) => l.phase === currentPhase);
app/(tabs)/index.tsx:407:  const allDone = !nextLesson || completedLessonIds.length >= LESSONS.length;
app/(tabs)/progress.tsx:30:import { LESSONS } from "../../src/data/lessons";
app/(tabs)/progress.tsx:137:  const totalLessons = LESSONS.length;
app/lesson/[id].tsx:12:import { LESSONS } from "../../src/data/lessons";
app/lesson/[id].tsx:59:  const lesson = LESSONS.find((l: any) => l.id === lessonId);
app/lesson/[id].tsx:273:      const phaseLessons = LESSONS.filter((l: any) => l.phase === lesson.phase);
app/phase-complete.tsx:20:import { LESSONS } from "../src/data/lessons";
app/phase-complete.tsx:77:    const phaseLessons = LESSONS.filter((l) => l.phase === phaseNum);
```

### LESSONS_V2
(no matches)

### Lesson / LessonV2 / LessonMode / LessonPhase
```
src/auth/types.ts:21:/** Lesson IDs at which we prompt anonymous users to create an account */
src/components/home/HeroCard.tsx:16:import type { Lesson } from "../../types/lesson";
src/components/home/HeroCard.tsx:41:  lesson: Lesson | null;
src/components/home/HeroCard.tsx:114:    ? "Review Lesson"
src/components/home/HeroCard.tsx:116:      ? "Continue Lesson"
src/components/home/HeroCard.tsx:117:      : "Start Lesson";
src/components/home/HeroCard.tsx:157:        {/* Lesson pill */}
src/components/home/HeroCard.tsx:160:            Lesson {lesson.id}
src/components/home/HeroCard.tsx:164:        {/* Lesson info */}
src/components/LessonIntro.tsx:46:// -- Lesson mode metadata --
src/components/LessonIntro.tsx:48:function getLessonModePill(lesson: any): { text: string; show: boolean }
src/components/LessonIntro.tsx:50:  if (mode === "sound") return { text: "Listening Lesson -- learn how these sound", show: true };
src/components/LessonIntro.tsx:172:  const modePill = getLessonModePill(lesson);
src/components/LessonIntro.tsx:214:        {/* Lesson mode contextual pill */}
src/components/LessonIntro.tsx:320:  // Lesson mode pill
src/components/LessonQuiz.tsx:28:import type { Lesson } from "../types/lesson";
src/components/LessonQuiz.tsx:44:  lesson: Lesson;
src/components/LessonSummary.tsx:422:    : (COMPLETION_HEADLINES as Record<string, string>)[tier] ?? "Lesson complete.";
src/components/LessonSummary.tsx:774:        {/* -- Lesson 7 Celebration + Trial Offer (per D-01 through D-04) -- */}
src/components/onboarding/steps/Finish.tsx:78:              title={finishError ? "Try Again" : "Start Lesson 1"}
src/components/progress/PhaseDetailSheet.tsx:235:        {/* Lesson list */}
src/components/progress/PhaseDetailSheet.tsx:302:                    {/* Lesson info */}
src/engine/engagement.ts:9:import type { Lesson } from "../types/lesson";
src/engine/engagement.ts:243:  lesson: Pick<Lesson, "lessonMode">,
src/engine/engagement.ts:323:  lesson: Pick<Lesson, "lessonMode">,
src/engine/insights.ts:74:// -- Post-Lesson Insights --
src/engine/outcome.ts:2: * Lesson outcome evaluation.
src/engine/progress.ts:364:// -- Premium Lesson Grants --
src/engine/questions/checkpoint.ts:2:import type { Lesson } from "../../types/lesson";
src/engine/questions/checkpoint.ts:32:export function generateCheckpointQs(lesson: Lesson, progress: CheckpointProgress | null | undefined): Question[]
src/engine/questions/checkpoint.ts:42:function generateRecognitionCheckpointQs(lesson: Lesson, progress: CheckpointProgress | null | undefined): Question[]
src/engine/questions/checkpoint.ts:95:function generateSoundCheckpointQs(lesson: Lesson, progress: CheckpointProgress | null | undefined): Question[]
src/engine/questions/connectedForms.ts:3:import type { Lesson } from "../../types/lesson";
src/engine/questions/connectedForms.ts:285:function generateSpotTheBreakExercises(lesson: Lesson): ConnectedFormExercise[]
src/engine/questions/connectedForms.ts:323:function generateMixedRetrievalExercises(lesson: Lesson): ConnectedFormExercise[]
src/engine/questions/connectedForms.ts:384:export function generateConnectedFormExercises(lesson: Lesson): ConnectedFormExercise[]
src/engine/questions/connectedReading.ts:2:import type { Lesson } from "../../types/lesson";
src/engine/questions/connectedReading.ts:142:export function generateConnectedReadingExercises(lesson: Lesson): ConnectedReadingExercise[]
src/engine/questions/contrast.ts:2:import type { Lesson } from "../../types/lesson";
src/engine/questions/contrast.ts:7:export function generateContrastQs(lesson: Lesson): Question[]
src/engine/questions/harakat.ts:2:import type { Lesson } from "../../types/lesson";
src/engine/questions/harakat.ts:7:/** Extended lesson interface for harakat-specific fields not on base Lesson */
src/engine/questions/harakat.ts:8:interface HarakatLesson extends Lesson
src/engine/questions/index.ts:1:import type { Lesson } from "../../types/lesson";
src/engine/questions/index.ts:29:export function generateLessonQuestions(lesson: Lesson, progress?: LessonProgress | null): Question[]
src/engine/questions/index.ts:47:export function generateHybridExercises(lesson: Lesson, progress?: LessonProgress | null): Question[]
src/engine/questions/recognition.ts:2:import type { Lesson } from "../../types/lesson";
src/engine/questions/recognition.ts:7:export function generateRecognitionQs(lesson: Lesson): Question[]
src/engine/questions/review.ts:3:import type { Lesson } from "../../types/lesson";
src/engine/questions/review.ts:14:interface ReviewLesson extends Lesson
src/engine/questions/shared.ts:3:import type { Lesson } from "../../types/lesson";
src/engine/questions/shared.ts:272:export function filterValidQuestions(qs: Question[], lesson: Lesson): Question[]
src/engine/questions/sound.ts:2:import type { Lesson } from "../../types/lesson";
src/engine/questions/sound.ts:7:export function generateSoundQs(lesson: Lesson): Question[]
src/engine/selectors.ts:6:import type { Lesson } from "../types/lesson";
src/engine/selectors.ts:14:export function getLastCompletedLesson(completedLessonIds: number[]): Lesson | null
src/engine/selectors.ts:20:export function getCurrentLesson(completedLessonIds: number[]): Lesson
src/engine/selectors.ts:30: ): Lesson
src/hooks/useLessonQuiz.ts:6:import type { Lesson } from '../types/lesson';
src/hooks/useLessonQuiz.ts:25:  lesson: Lesson,
src/types/lesson.ts:1:export interface Lesson {
src/__tests__/home-hero.test.ts:6:  it.todo("shows 'Start Lesson' CTA when no lessons completed");
src/__tests__/home-hero.test.ts:7:  it.todo("shows 'Continue Lesson' CTA when some lessons completed");
src/__tests__/home-hero.test.ts:8:  it.todo("shows 'Review Lesson' CTA when current lesson already completed");
src/__tests__/integration-lesson-completion.test.ts:2: * Integration test: Lesson completion flow.
src/__tests__/integration-lesson-completion.test.ts:109:describe('Lesson completion integration', () => {
src/__tests__/integration-premium-locking.test.ts:102:    const grantedLessonIds = [8]; // Lesson 8 was completed during subscription
src/__tests__/questions.test.js:117:      // Lesson 84 appears before lesson 64 in the array
src/__tests__/questions.test.js:1291:          if (!r.valid) throw new Error(`Lesson ${lesson.id} run ${run}: ...`);
src/__tests__/screen-boundary.test.ts:8:      path.resolve(__dirname, "../../app/lesson/[id].tsx"),
app/lesson/[id].tsx:304:            Lesson not found
app/lesson/[id].tsx:322:  // -- Lesson locked gate --
app/lesson/[id].tsx:341:              : `Lesson ${lesson.id}: ${lesson.title} requires Tila Premium.`
```

### teachIds / reviewIds / teachEntityIds / reviewEntityIds
(Full output: 316 lines across src/data/lessons.js, src/engine/questions/*, src/engine/selectors.ts, src/engine/unlock.ts, src/components/home/HeroCard.tsx, src/components/home/JourneyNode.tsx, src/components/LessonIntro.tsx, src/components/LessonSummary.tsx, src/components/progress/PhaseDetailSheet.tsx, src/hooks/useLessonQuiz.ts, src/monetization/hooks.ts, src/types/lesson.ts, src/__tests__/*, app/lesson/[id].tsx, app/lesson/review.tsx)

Key files:
```
src/types/lesson.ts:10:  teachIds: number[];
src/types/lesson.ts:11:  reviewIds: number[];
src/engine/selectors.ts:342:  teachIds: number[];
src/engine/selectors.ts:344:  reviewIds: number[];
src/components/home/HeroCard.tsx:110:  const heroLetters = (lesson.teachIds || []).map(...)
src/components/home/JourneyNode.tsx:30:  lesson: { id: number; title: string; teachIds?: number[] };
src/components/LessonSummary.tsx:304:    () => (lesson.teachIds || []).map(...)
src/components/progress/PhaseDetailSheet.tsx:38:  teachIds: number[];
src/monetization/hooks.ts:24:        for (const id of lesson.teachIds || []) {
app/lesson/review.tsx:79:    const filteredTeachIds = (payload.teachIds || []).filter(...)
app/lesson/[id].tsx:225:        const lessonLetterIds = [...(lesson!.teachIds || []), ...(lesson!.reviewIds || [])];
```
(no matches for teachEntityIds or reviewEntityIds)

## Routes
### /lesson/
```
src/__tests__/lesson-completion-celebration.test.ts:6:  path.resolve(__dirname, '../../app/lesson/[id].tsx'), 'utf-8'
src/__tests__/promise-safety.test.ts:33:  const sourcePath = path.resolve(__dirname, "../../app/lesson/review.tsx");
src/__tests__/quiz-lesson-reset.test.ts:6:  path.resolve(__dirname, '../../app/lesson/[id].tsx'), 'utf-8'
src/__tests__/screen-boundary.test.ts:8:      path.resolve(__dirname, "../../app/lesson/[id].tsx"),
app/(tabs)/index.tsx:457:    router.push({ pathname: '/lesson/[id]', params: { id: String(lessonId) } });
app/(tabs)/index.tsx:461:    router.push('/lesson/review');
app/(tabs)/index.tsx:617:              router.push({ pathname: "/lesson/[id]", params: { id: String(lessonId) } });
app/lesson/[id].tsx:417:            onReview={() => router.replace("/lesson/review")}
```

### phase-complete / post-lesson-onboard
```
src/__tests__/celebration-tiers.test.ts:77:      path.resolve(__dirname, "../../app/phase-complete.tsx"),
src/__tests__/celebration-tiers.test.ts:81:    it("phase-complete uses hapticMilestone", () => {
src/__tests__/celebration-tiers.test.ts:85:    it("phase-complete uses WarmGlow", () => {
src/__tests__/celebration-tiers.test.ts:97:        path.resolve(__dirname, "../../app/phase-complete.tsx"),
src/__tests__/crescent-icon.test.ts:43:  it('phase-complete uses CrescentIcon', () => {
src/__tests__/crescent-icon.test.ts:45:      path.resolve(__dirname, '../../app/phase-complete.tsx'),
src/__tests__/phase-complete-celebration.test.ts:7:    path.resolve(__dirname, "../../app/phase-complete.tsx"),
app/lesson/[id].tsx:267:        router.replace({ pathname: '/post-lesson-onboard' });
app/lesson/[id].tsx:278:        router.replace({ pathname: '/phase-complete', params: { phase: String(lesson.phase) } });
```

## Progress calculators
### completedLessonIds / currentLessonId / getCurrentLesson / getPhaseCounts / getLearnedLetterIds / getRecommendedLessons
```
src/components/home/HeroCard.tsx:43:  completedLessonIds: number[];
src/components/home/HeroCard.tsx:55:  completedLessonIds,
src/components/home/HeroCard.tsx:113:  const ctaTitle = completedLessonIds.includes(lesson.id) ...
src/components/home/LessonGrid.tsx:166:  completedLessonIds: number[];
src/components/home/LessonGrid.tsx:178:  completedLessonIds,
src/components/home/LessonGrid.tsx:201:  const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);
src/components/LessonQuiz.tsx:45:  completedLessonIds: number[];
src/components/progress/PhaseDetailSheet.tsx:26:  completedLessonIds: number[];
src/components/progress/PhaseDetailSheet.tsx:27:  currentLessonId: number;
src/engine/progress.ts:43:  completedLessonIds: number[];
src/engine/progress.ts:100:  const completedLessonIds = lessonRows.map((r) => r.lesson_id);
src/engine/progress.ts:153:    completedLessonIds,
src/engine/selectors.ts:9:export function getLessonsCompletedCount(completedLessonIds: number[]): number
src/engine/selectors.ts:14:export function getLastCompletedLesson(completedLessonIds: number[]): Lesson | null
src/engine/selectors.ts:20:export function getCurrentLesson(completedLessonIds: number[]): Lesson
src/engine/selectors.ts:41:export function getLearnedLetterIds(completedLessonIds: number[]): number[]
src/engine/selectors.ts:59:export function getPhaseCounts(completedLessonIds: number[]): PhaseCounts
src/engine/selectors.ts:86:export function getCurrentPhase(completedLessonIds: number[]): number
src/hooks/useLessonQuiz.ts:26:  completedLessonIds: number[],
src/state/provider.tsx:73:        completedLessonIds: progressHook.completedLessonIds ?? [],
src/__tests__/selectors.test.js:3:import { getCurrentLesson, getCurrentUnlockedLesson, getLearnedLetterIds, getPhaseCounts, ... }
src/__tests__/selectors.test.js:10:describe("getCurrentLesson", () => { ...
src/__tests__/selectors.test.js:32:describe("getLearnedLetterIds", () => { ...
src/__tests__/selectors.test.js:49:describe("getPhaseCounts", () => { ...
app/(tabs)/index.tsx:32:  getCurrentLesson,
app/(tabs)/index.tsx:34:  getLearnedLetterIds,
app/(tabs)/index.tsx:377:  const completedLessonIds = progress?.completedLessonIds ?? [];
app/(tabs)/index.tsx:384:  const nextLesson = useMemo(() => getCurrentLesson(completedLessonIds), [completedLessonIds]);
app/(tabs)/progress.tsx:32:  getPhaseCounts,
app/(tabs)/progress.tsx:33:  getLearnedLetterIds,
app/(tabs)/progress.tsx:34:  getCurrentLesson,
app/(tabs)/progress.tsx:116:  const completedLessonIds = appState.progress?.completedLessonIds ?? [];
app/lesson/review.tsx:66:  const completedLessonIds = progress.completedLessonIds ?? [];
app/lesson/[id].tsx:77:  const completedLessonIds = progress.completedLessonIds ?? [];
```
(no matches for getRecommendedLessons)

### planReviewSession / getDueEntityKeys / getWeakEntityKeys
```
src/engine/selectors.ts:107:export function getDueEntityKeys(
src/engine/selectors.ts:118:export function getWeakEntityKeys(
src/engine/selectors.ts:251:export function planReviewSession(
src/engine/selectors.ts:256:  const due = getDueEntityKeys(mastery.entities, today);
src/engine/selectors.ts:258:  const weak = getWeakEntityKeys(mastery.entities);
src/engine/selectors.ts:358:  const plan = planReviewSession(mastery, today);
src/__tests__/mastery.test.js:24:  getDueEntityKeys,
src/__tests__/mastery.test.js:25:  getWeakEntityKeys,
src/__tests__/mastery.test.js:27:  planReviewSession,
src/__tests__/mastery.test.js:419:describe("getDueEntityKeys", () => { ...
src/__tests__/mastery.test.js:437:describe("getWeakEntityKeys", () => { ...
src/__tests__/mastery.test.js:465:describe("planReviewSession", () => { ...
src/__tests__/selectors.test.js:3:import { ..., planReviewSession } from "../engine/selectors";
src/__tests__/selectors.test.js:245:describe("planReviewSession — unstable items and urgency", () => { ...
src/__tests__/summaryAndReview.test.js:10:  planReviewSession,
src/__tests__/summaryAndReview.test.js:202:describe("planReviewSession safety", () => { ...
app/(tabs)/index.tsx:35:  planReviewSession,
app/(tabs)/index.tsx:387:    const plan = planReviewSession(mastery, today);
app/lesson/[id].tsx:32:import { planReviewSession } from "../../src/engine/selectors";
app/lesson/[id].tsx:401:      const reviewPlan = progress.mastery ? planReviewSession(progress.mastery, today) : null;
```

## Analytics
### lesson_started / lesson_completed / lesson_failed
```
src/analytics/events.ts:161:  lesson_started: LessonStartedProps;
src/analytics/events.ts:162:  lesson_completed: LessonCompletedProps;
src/analytics/events.ts:163:  lesson_failed: LessonFailedProps;
app/lesson/[id].tsx:90:      track('lesson_started', {
app/lesson/[id].tsx:196:          track('lesson_completed', {
app/lesson/[id].tsx:205:          track('lesson_failed', {
```

### other lesson_* event types
```
src/analytics/events.ts:71:  trigger: "lesson_7_summary" | "lesson_locked" | "expired_card" | "home_upsell";
src/analytics/events.ts:76:  trigger: "lesson_7_summary" | "lesson_locked" | "expired_card" | "home_upsell"
```

## Monetization
### FREE_LESSON_CUTOFF / useCanAccessLesson / premium_lesson
```
src/components/home/LessonGrid.tsx:14:import { FREE_LESSON_CUTOFF } from "../../monetization/hooks";
src/db/client.ts:86:      "SELECT name FROM sqlite_master WHERE type='table' AND name='premium_lesson_grants'"
src/db/client.ts:90:        CREATE TABLE IF NOT EXISTS premium_lesson_grants (
src/db/client.ts:140:    DROP TABLE IF EXISTS premium_lesson_grants;
src/db/schema.ts:95:CREATE TABLE IF NOT EXISTS premium_lesson_grants (
src/engine/progress.ts:371:    "INSERT OR IGNORE INTO premium_lesson_grants (lesson_id) VALUES (?)"
src/engine/progress.ts:380:    "SELECT lesson_id FROM premium_lesson_grants ORDER BY lesson_id"
src/engine/progress.ts:396:  await db.runAsync('DELETE FROM premium_lesson_grants');
src/engine/progress.ts:414:      db.getAllAsync('SELECT * FROM premium_lesson_grants ORDER BY lesson_id'),
src/engine/progress.ts:457:    await db.runAsync('DELETE FROM premium_lesson_grants');
src/engine/progress.ts:576:          'INSERT INTO premium_lesson_grants (lesson_id, granted_at) VALUES (?, ?)',
src/monetization/hooks.ts:6:const FREE_LESSON_CUTOFF = 999;
src/monetization/hooks.ts:12:export function useCanAccessLesson(_lessonId: number): boolean
src/monetization/hooks.ts:23:      if (lesson.id <= FREE_LESSON_CUTOFF) {
src/monetization/hooks.ts:44:export { FREE_LESSON_CUTOFF };
src/sync/migration.sql:130:-- 8. premium_lesson_grants
src/sync/migration.sql:131:CREATE TABLE IF NOT EXISTS premium_lesson_grants (
src/sync/tables.ts:124:    localTable: 'premium_lesson_grants',
src/sync/tables.ts:125:    remoteTable: 'premium_lesson_grants',
src/__tests__/integration-premium-locking.test.ts:6: * Matches FREE_LESSON_CUTOFF = 7 from src/monetization/hooks.ts.
src/__tests__/integration-premium-locking.test.ts:12:const FREE_LESSON_CUTOFF = 7;
src/__tests__/integration-premium-locking.test.ts:14:// -- Access control logic (mirrors useCanAccessLesson) --
src/__tests__/integration-premium-locking.test.ts:21:  if (lessonId <= FREE_LESSON_CUTOFF) return true;
src/__tests__/integration-premium-locking.test.ts:52:    if (lesson.id <= FREE_LESSON_CUTOFF) {
src/__tests__/schema-v5.test.ts:4:describe("Schema v5: premium_lesson_grants", () => {
src/__tests__/schema-v5.test.ts:9:  it("CREATE_TABLES includes premium_lesson_grants", () => {
src/__tests__/schema-v5.test.ts:10:    expect(CREATE_TABLES).toContain("premium_lesson_grants");
app/(tabs)/index.tsx:27:import { useSubscription, FREE_LESSON_CUTOFF, usePremiumReviewRights } from "../../src/monetization/hooks";
app/(tabs)/index.tsx:302:  // Beta: skip premium_lesson_grants load when all lessons are free
app/(tabs)/index.tsx:306:    if (FREE_LESSON_CUTOFF >= 999) return; // Beta: all lessons unlocked, skip DB read
app/(tabs)/index.tsx:594:        {stage === "free" && completedLessonIds.includes(FREE_LESSON_CUTOFF) && (
app/lesson/review.tsx:17:import { useSubscription, usePremiumReviewRights, FREE_LESSON_CUTOFF } from "../../src/monetization/hooks";
app/lesson/[id].tsx:19:import { useSubscription, useCanAccessLesson, FREE_LESSON_CUTOFF } from "../../src/monetization/hooks";
app/lesson/[id].tsx:65:  const canAccess = useCanAccessLesson(lessonId);
app/lesson/[id].tsx:174:        if (passed && lesson!.id > FREE_LESSON_CUTOFF && isPremiumActive) {
app/lesson/[id].tsx:418:            showTrialCTA={lesson.id === FREE_LESSON_CUTOFF && !isPremiumActive ...}
```

### ACCOUNT_PROMPT_LESSONS
```
src/auth/types.ts:22:export const ACCOUNT_PROMPT_LESSONS = [3, 5, 7] as const;
app/lesson/[id].tsx:38:import { ACCOUNT_PROMPT_LESSONS } from '../../src/auth/types';
app/lesson/[id].tsx:107:      (ACCOUNT_PROMPT_LESSONS as readonly number[]).includes(lesson.id)
```

## Sync / export / restore
### exportProgress / resetProgress / importProgress / restoreProgress
```
src/engine/progress.ts:387:export async function resetProgress(db: SQLiteDatabase): Promise<void>
src/engine/progress.ts:404:export async function exportProgress(db: SQLiteDatabase): Promise<object>
src/engine/progress.ts:443:export async function importProgress(db: SQLiteDatabase, data: ImportData): Promise<void>
```
(no matches for restoreProgress)

### SQL strings for lesson_attempts / question_attempts
```
src/db/client.ts:134:    DROP TABLE IF EXISTS question_attempts;
src/db/client.ts:135:    DROP TABLE IF EXISTS lesson_attempts;
src/db/schema.ts:30:CREATE TABLE IF NOT EXISTS lesson_attempts (
src/db/schema.ts:38:CREATE INDEX IF NOT EXISTS idx_attempts_lesson ON lesson_attempts(lesson_id);
src/db/schema.ts:39:CREATE INDEX IF NOT EXISTS idx_attempts_date ON lesson_attempts(attempted_at);
src/db/schema.ts:79:CREATE TABLE IF NOT EXISTS question_attempts (
src/db/schema.ts:81:  attempt_id INTEGER NOT NULL REFERENCES lesson_attempts(id),
src/db/schema.ts:91:CREATE INDEX IF NOT EXISTS idx_qa_attempt ON question_attempts(attempt_id);
src/db/schema.ts:92:CREATE INDEX IF NOT EXISTS idx_qa_entity ON question_attempts(target_entity);
src/db/schema.ts:93:CREATE INDEX IF NOT EXISTS idx_qa_date ON question_attempts(attempted_at);
src/engine/progress.ts:73:        'SELECT DISTINCT lesson_id FROM lesson_attempts WHERE passed = 1 ORDER BY lesson_id'
src/engine/progress.ts:170:    'INSERT INTO lesson_attempts (lesson_id, accuracy, passed) VALUES (?, ?, ?)'
src/engine/progress.ts:217:      'INSERT INTO question_attempts (...) VALUES (...)'
src/engine/progress.ts:389:  await db.runAsync('DELETE FROM question_attempts');
src/engine/progress.ts:390:  await db.runAsync('DELETE FROM lesson_attempts');
src/engine/progress.ts:407:      db.getAllAsync('SELECT * FROM lesson_attempts ORDER BY id'),
src/engine/progress.ts:408:      db.getAllAsync('SELECT * FROM question_attempts ORDER BY id'),
src/engine/progress.ts:450-478: (import/restore INSERT statements for both tables)
src/sync/migration.sql:88-102: (CREATE TABLE definitions)
src/sync/tables.ts:74-91: (sync table mappings)
src/__tests__/integration-lesson-completion.test.ts: (multiple INSERT/SELECT references)
src/__tests__/sync-service.test.ts: (multiple mock data references)
```

### SQL strings for mastery_* tables
```
src/db/client.ts:136-138: DROP TABLE IF EXISTS mastery_entities/skills/confusions
src/db/schema.ts:41-93: CREATE TABLE definitions for all three mastery tables
src/engine/progress.ts:79-85: SELECT queries loading mastery state
src/engine/progress.ts:236-273: INSERT OR REPLACE writes for mastery_entities, mastery_skills, mastery_confusions
src/engine/progress.ts:391-393: DELETE FROM all three mastery tables (resetProgress)
src/engine/progress.ts:409-411: SELECT * for export
src/engine/progress.ts:452-530: DELETE + INSERT for import
src/sync/migration.sql:47-77: Remote table definitions
src/sync/migration.sql:145-157: RLS + policies
src/sync/tables.ts:32-62: Sync table mappings for all three mastery tables
src/__tests__/integration-lesson-completion.test.ts:116+: mastery_entities mock data
src/__tests__/integration-onboarding.test.ts:85+: mastery_entities empty arrays
src/__tests__/sync-service.test.ts: (extensive mastery_entities mock data throughout)
```

## Phase / module hardcoded references
### "Phase 1" | "Phase 2" | etc.
```
src/components/onboarding/animations.ts:18:// -- Sacred moment timing (Phase 2) -- (comment only)
src/data/harakat.js:1:// Phase 3: Harakat (short vowels) data (comment only)
src/data/lessons.js:2: // -- Phase 1 — Letter Recognition -- (comment only, file being deleted)
src/data/lessons.js:140-429: (multiple Phase N headers and labels in lesson data — file deleted)
src/design/tokens.ts:127:  // -- Role-based presets (Phase 2) -- (comment only, unrelated to lesson phases)
src/engine/questions/checkpoint.ts:29-30: Phase 1/2 checkpoint comments
src/engine/questions/connectedForms.ts:382: Phase 4 comment
src/engine/questions/index.ts:43: Phase 4+ comment
src/engine/questions/review.ts:26: Phase 1 comment
src/__tests__/checkpoint-classifier.test.ts:90: "Phase 1 checkpoint:" test label
src/__tests__/checkpoint-classifier.test.ts:101: "Phase 2 checkpoint:" test label
src/__tests__/integration-onboarding.test.ts:118: "optional per Phase 3 decision" comment
src/__tests__/onboarding-animations.test.ts:51: "ONB-03: New Phase 2 constants" describe label
src/__tests__/questions.test.js:708: "Phase 1 checkpoint uses visual recognition types" test label
src/__tests__/questions.test.js:718-730: Phase 2 checkpoint test labels
src/__tests__/selectors.test.js:123: "does not return a locked Phase 2 lesson..." test label
src/__tests__/selectors.test.js:309-316: "Phase 4 unlock" describe/test labels
app/phase-complete.tsx:27-47: Phase 1-4 title strings (file being deleted)
```

### phase: 1..4
```
src/data/lessons.js: (every lesson record has phase:1/2/3/4 — file being deleted)
src/__tests__/checkpoint-classifier.test.ts:54:      phase: 1,
src/__tests__/connectedForms.test.js:10:    phase: 4,
```

## Disposition summary
| Consumer file:line | Pattern | Disposition (delete / stub / keep) | Task where handled |
|---|---|---|---|
| src/data/lessons.js:1 | LESSONS | delete | 9 |
| src/components/home/LessonGrid.tsx | LESSONS | delete | 7 |
| src/components/LessonSummary.tsx | LESSONS | delete | 7 |
| src/components/progress/PhaseDetailSheet.tsx | LESSONS | delete | 7 |
| src/engine/questions/shared.ts | LESSONS | delete | 8 |
| src/engine/selectors.ts | LESSONS | delete | 8 |
| src/engine/unlock.ts | LESSONS | delete | 8 |
| src/monetization/hooks.ts | LESSONS | stub | 6 |
| src/__tests__/checkpoint-classifier.test.ts | LESSONS | delete | 8 |
| src/__tests__/questions.test.js | LESSONS | delete | 8 |
| src/__tests__/selectors.test.js | LESSONS | delete | 8 |
| app/(tabs)/index.tsx | LESSONS | stub | 5 |
| app/(tabs)/progress.tsx | LESSONS | stub | 5 |
| app/lesson/[id].tsx | LESSONS | delete | 5 |
| app/phase-complete.tsx | LESSONS | delete | 5 |
| src/types/lesson.ts:1 | Lesson (interface) | delete | 8 |
| src/components/home/HeroCard.tsx | Lesson | stub | 7 |
| src/components/LessonIntro.tsx | Lesson/LessonMode | delete | 7 |
| src/components/LessonQuiz.tsx | Lesson | delete | 7 |
| src/engine/engagement.ts | Lesson | delete | 8 |
| src/engine/questions/checkpoint.ts | Lesson | delete | 8 |
| src/engine/questions/connectedForms.ts | Lesson | delete | 8 |
| src/engine/questions/connectedReading.ts | Lesson | delete | 8 |
| src/engine/questions/contrast.ts | Lesson | delete | 8 |
| src/engine/questions/harakat.ts | Lesson | delete | 8 |
| src/engine/questions/index.ts | Lesson | delete | 8 |
| src/engine/questions/recognition.ts | Lesson | delete | 8 |
| src/engine/questions/review.ts | Lesson | delete | 8 |
| src/engine/questions/shared.ts | Lesson | delete | 8 |
| src/engine/questions/sound.ts | Lesson | delete | 8 |
| src/engine/selectors.ts | Lesson | delete | 8 |
| src/hooks/useLessonQuiz.ts | Lesson | delete | 7 |
| src/__tests__/integration-lesson-completion.test.ts | Lesson | delete | 7 |
| src/__tests__/integration-premium-locking.test.ts | Lesson | delete | 7 |
| app/lesson/[id].tsx | Lesson | delete | 5 |
| src/components/home/HeroCard.tsx:110 | teachIds | stub | 7 |
| src/components/home/JourneyNode.tsx:30 | teachIds | delete | 7 |
| src/components/LessonIntro.tsx:159 | teachIds | delete | 7 |
| src/components/LessonSummary.tsx:304 | teachIds | delete | 7 |
| src/components/progress/PhaseDetailSheet.tsx:38 | teachIds | delete | 7 |
| src/data/lessons.js | teachIds/reviewIds | delete | 9 |
| src/engine/questions/* | teachIds/reviewIds | delete | 8 |
| src/engine/selectors.ts:342 | teachIds/reviewIds | delete | 8 |
| src/monetization/hooks.ts:24 | teachIds | stub | 6 |
| src/types/lesson.ts:10 | teachIds/reviewIds | delete | 8 |
| src/__tests__/checkpoint-classifier.test.ts | teachIds/reviewIds | delete | 8 |
| src/__tests__/connectedForms.test.js | teachIds/reviewIds | delete | 8 |
| src/__tests__/integration-premium-locking.test.ts | teachIds | delete | 7 |
| src/__tests__/questions.test.js | teachIds/reviewIds | delete | 8 |
| src/__tests__/selectors.test.js | teachIds | delete | 8 |
| src/__tests__/summaryAndReview.test.js | teachIds | delete | 8 |
| app/lesson/[id].tsx:225 | teachIds/reviewIds | delete | 5 |
| app/lesson/review.tsx:79 | teachIds | delete | 5 |
| src/__tests__/lesson-completion-celebration.test.ts:6 | /lesson/ | delete | 5 |
| src/__tests__/promise-safety.test.ts:33 | /lesson/ | delete | 5 |
| src/__tests__/quiz-lesson-reset.test.ts:6 | /lesson/ | delete | 5 |
| src/__tests__/screen-boundary.test.ts:8 | /lesson/ | delete | 5 |
| app/(tabs)/index.tsx:457 | /lesson/ | stub | 5 |
| app/(tabs)/index.tsx:461 | /lesson/ | stub | 5 |
| app/(tabs)/index.tsx:617 | /lesson/ | stub | 5 |
| app/lesson/[id].tsx | /lesson/ | delete | 5 |
| src/__tests__/celebration-tiers.test.ts | phase-complete | delete | 5 |
| src/__tests__/crescent-icon.test.ts:43 | phase-complete | delete | 5 |
| src/__tests__/phase-complete-celebration.test.ts | phase-complete | delete | 5 |
| app/lesson/[id].tsx:267 | post-lesson-onboard | delete | 5 |
| app/lesson/[id].tsx:278 | phase-complete | delete | 5 |
| src/components/home/HeroCard.tsx:43 | completedLessonIds | stub | 7 |
| src/components/home/LessonGrid.tsx:166 | completedLessonIds | delete | 7 |
| src/components/LessonQuiz.tsx:45 | completedLessonIds | delete | 7 |
| src/components/progress/PhaseDetailSheet.tsx:26 | completedLessonIds/currentLessonId | delete | 7 |
| src/engine/progress.ts:43 | completedLessonIds | stub | 6 |
| src/engine/progress.ts:100 | completedLessonIds | stub | 6 |
| src/engine/selectors.ts:9 | getLessonsCompletedCount | delete | 8 |
| src/engine/selectors.ts:14 | getLastCompletedLesson | delete | 8 |
| src/engine/selectors.ts:20 | getCurrentLesson | delete | 8 |
| src/engine/selectors.ts:41 | getLearnedLetterIds | delete | 8 |
| src/engine/selectors.ts:59 | getPhaseCounts | delete | 8 |
| src/hooks/useLessonQuiz.ts:26 | completedLessonIds | delete | 7 |
| src/state/provider.tsx:73 | completedLessonIds | stub | 6 |
| src/__tests__/data-loading.test.ts:30 | completedLessonIds | delete | 6 |
| src/__tests__/outcome.test.js:88 | completedLessonIds | delete | 8 |
| src/__tests__/selectors.test.js | getCurrentLesson/getPhaseCounts/getLearnedLetterIds | delete | 8 |
| app/(tabs)/index.tsx:377 | completedLessonIds/getCurrentLesson/getLearnedLetterIds | stub | 5 |
| app/(tabs)/progress.tsx:116 | completedLessonIds/getPhaseCounts/getLearnedLetterIds/getCurrentLesson | stub | 5 |
| app/lesson/review.tsx:66 | completedLessonIds | delete | 5 |
| app/lesson/[id].tsx:77 | completedLessonIds | delete | 5 |
| src/engine/selectors.ts:107 | getDueEntityKeys | delete | 8 |
| src/engine/selectors.ts:118 | getWeakEntityKeys | delete | 8 |
| src/engine/selectors.ts:251 | planReviewSession | delete | 8 |
| src/__tests__/mastery.test.js:24 | getDueEntityKeys/getWeakEntityKeys/planReviewSession | delete | 8 |
| src/__tests__/selectors.test.js:245 | planReviewSession | delete | 8 |
| src/__tests__/summaryAndReview.test.js:202 | planReviewSession | delete | 8 |
| app/(tabs)/index.tsx:387 | planReviewSession | stub | 5 |
| app/lesson/[id].tsx:401 | planReviewSession | delete | 5 |
| src/analytics/events.ts:161 | lesson_started/lesson_completed/lesson_failed | stub | 6 |
| app/lesson/[id].tsx:90 | lesson_started | delete | 5 |
| app/lesson/[id].tsx:196 | lesson_completed | delete | 5 |
| app/lesson/[id].tsx:205 | lesson_failed | delete | 5 |
| src/analytics/events.ts:71 | lesson_7_summary/lesson_locked | stub | 6 |
| src/components/home/LessonGrid.tsx:14 | FREE_LESSON_CUTOFF | delete | 7 |
| src/monetization/hooks.ts:6 | FREE_LESSON_CUTOFF | stub | 6 |
| src/monetization/hooks.ts:12 | useCanAccessLesson | stub | 6 |
| src/monetization/hooks.ts:44 | FREE_LESSON_CUTOFF | stub | 6 |
| src/engine/progress.ts:371-576 | premium_lesson_grants SQL | stub | 6 |
| src/sync/tables.ts:124 | premium_lesson_grants | keep | n/a |
| src/__tests__/integration-premium-locking.test.ts | FREE_LESSON_CUTOFF/useCanAccessLesson | delete | 7 |
| src/__tests__/schema-v5.test.ts | premium_lesson_grants | keep | n/a |
| app/(tabs)/index.tsx:27 | FREE_LESSON_CUTOFF | stub | 5 |
| app/(tabs)/index.tsx:594 | FREE_LESSON_CUTOFF | stub | 5 |
| app/lesson/review.tsx:17 | FREE_LESSON_CUTOFF | delete | 5 |
| app/lesson/[id].tsx:19 | useCanAccessLesson/FREE_LESSON_CUTOFF | delete | 5 |
| src/auth/types.ts:22 | ACCOUNT_PROMPT_LESSONS | stub | 6 |
| app/lesson/[id].tsx:38 | ACCOUNT_PROMPT_LESSONS | delete | 5 |
| app/lesson/[id].tsx:107 | ACCOUNT_PROMPT_LESSONS | delete | 5 |
| src/engine/progress.ts:387 | resetProgress | stub | 6 |
| src/engine/progress.ts:404 | exportProgress | stub | 6 |
| src/engine/progress.ts:443 | importProgress | stub | 6 |
| src/db/client.ts:134 | lesson_attempts DROP | keep | n/a |
| src/db/schema.ts:30 | lesson_attempts CREATE | keep | n/a |
| src/db/schema.ts:79 | question_attempts CREATE | keep | n/a |
| src/engine/progress.ts:73 | lesson_attempts SELECT | stub | 6 |
| src/engine/progress.ts:170 | lesson_attempts INSERT | stub | 6 |
| src/engine/progress.ts:217 | question_attempts INSERT | stub | 6 |
| src/engine/progress.ts:389-390 | DELETE lesson/question_attempts | stub | 6 |
| src/engine/progress.ts:407-408 | SELECT * lesson/question_attempts | stub | 6 |
| src/sync/migration.sql:88-102 | lesson_attempts/question_attempts remote DDL | keep | n/a |
| src/sync/tables.ts:74-91 | lesson_attempts/question_attempts sync | keep | n/a |
| src/__tests__/integration-lesson-completion.test.ts | lesson_attempts | delete | 7 |
| src/__tests__/sync-service.test.ts:335 | lesson_attempts sync test | keep | n/a |
| src/db/client.ts:136-138 | mastery_* DROP | keep | n/a |
| src/db/schema.ts:41-62 | mastery_* CREATE | keep | n/a |
| src/engine/progress.ts:79-85 | mastery_* SELECT | stub | 6 |
| src/engine/progress.ts:236-273 | mastery_* INSERT writes | stub | 6 |
| src/engine/progress.ts:391-393 | mastery_* DELETE (reset) | stub | 6 |
| src/engine/progress.ts:409-411 | mastery_* SELECT (export) | stub | 6 |
| src/engine/progress.ts:452-530 | mastery_* DELETE+INSERT (import) | stub | 6 |
| src/sync/migration.sql:47-77 | mastery_* remote DDL | keep | n/a |
| src/sync/tables.ts:32-62 | mastery_* sync table mappings | keep | n/a |
| src/__tests__/sync-service.test.ts | mastery_entities mock data | keep | n/a |
| src/__tests__/integration-onboarding.test.ts:85 | mastery_entities | keep | n/a |
| src/__tests__/integration-lesson-completion.test.ts:116 | mastery_entities | delete | 7 |
| src/components/onboarding/animations.ts:18 | "Phase 2" (comment) | keep | n/a |
| src/data/harakat.js:1 | "Phase 3" (comment) | keep | n/a |
| src/design/tokens.ts:127 | "Phase 2" (comment, unrelated) | keep | n/a |
| src/engine/questions/checkpoint.ts:29-30 | "Phase 1/2" (comments) | delete | 8 |
| src/engine/questions/connectedForms.ts:382 | "Phase 4" (comment) | delete | 8 |
| app/phase-complete.tsx:27-47 | "Phase 1-4" title strings | delete | 5 |
| src/__tests__/checkpoint-classifier.test.ts:54 | phase: 1 | delete | 8 |
| src/__tests__/connectedForms.test.js:10 | phase: 4 | delete | 8 |
