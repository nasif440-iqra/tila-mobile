import type { LessonV2, ExerciseStep } from "@/src/types/curriculum-v2";
import type { EntityCapability } from "@/src/types/entity";
import { resolveEntity } from "./entityRegistry";
import { ASSESSMENT_PROFILES } from "@/src/data/curriculum-v2/assessmentProfiles";

export interface ValidationResult {
  lessonId: number;
  valid: boolean;
  errors: string[];
}

function isDecodeStep(step: ExerciseStep): boolean {
  return step.type === "read" || step.type === "check";
}

function totalDecodeItems(plan: ExerciseStep[]): number {
  return plan.filter(isDecodeStep).reduce((sum, s) => sum + s.count, 0);
}

// ── Render complexity ordering ──

const RENDER_COMPLEXITY: Record<string, number> = {
  isolated: 0,
  connected: 1,
  "quran-script": 2,
  mushaf: 3,
};

// ── Target → required capability mapping ──

const TARGET_TO_CAPABILITY: Record<string, EntityCapability> = {
  letter: "tappable",
  form: "tappable",
  mark: "tappable",
  combo: "readable",
  chunk: "readable",
  word: "readable",
  phrase: "readable",
  verse: "readable",
};

export async function validateLesson(lesson: LessonV2): Promise<ValidationResult> {
  const errors: string[] = [];

  // Rule 1: All entity IDs in teachEntityIds and reviewEntityIds must resolve
  const allEntityIds = [...lesson.teachEntityIds, ...lesson.reviewEntityIds];
  for (const id of allEntityIds) {
    const entity = await resolveEntity(id);
    if (!entity) {
      errors.push(`Entity "${id}" in lesson ${lesson.id} does not resolve to any registry`);
    }
  }

  // Rule 3: check steps must have assessmentProfile that resolves
  for (const step of lesson.exercisePlan) {
    if (step.type === "check") {
      if (!step.assessmentProfile) {
        errors.push(`Lesson ${lesson.id}: check step missing assessmentProfile`);
      } else {
        const profile = ASSESSMENT_PROFILES.find((p) => p.id === step.assessmentProfile);
        if (!profile) {
          errors.push(
            `Lesson ${lesson.id}: assessmentProfile "${step.assessmentProfile}" not found in registry`
          );
        }
      }
    }
  }

  // Rule 4: decodePassRequired cannot exceed total decode items
  if (lesson.masteryPolicy.decodePassRequired !== undefined) {
    const decodeCount = totalDecodeItems(lesson.exercisePlan);
    if (lesson.masteryPolicy.decodePassRequired > decodeCount) {
      errors.push(
        `Lesson ${lesson.id}: decodePassRequired (${lesson.masteryPolicy.decodePassRequired}) exceeds total decode items (${decodeCount})`
      );
    }
  }

  // Rule 6: explicit source entityIds must resolve and must not be empty
  for (const step of lesson.exercisePlan) {
    if (step.source.from === "explicit") {
      if (step.source.entityIds.length === 0) {
        errors.push(`Lesson ${lesson.id}: explicit source has empty entityIds array`);
      }
      for (const id of step.source.entityIds) {
        const entity = await resolveEntity(id);
        if (!entity) {
          errors.push(`Lesson ${lesson.id}: explicit source entity "${id}" does not resolve`);
        }
      }
    }
  }

  // Rule 7: renderOverride cannot be less complex than lesson renderProfile
  const lessonComplexity = RENDER_COMPLEXITY[lesson.renderProfile ?? "isolated"] ?? 0;
  for (const step of lesson.exercisePlan) {
    if (step.type === "read" && step.renderOverride) {
      const stepComplexity = RENDER_COMPLEXITY[step.renderOverride] ?? 0;
      if (stepComplexity < lessonComplexity) {
        errors.push(
          `Lesson ${lesson.id}: read step renderOverride "${step.renderOverride}" is less complex than lesson renderProfile "${lesson.renderProfile}"`
        );
      }
    }
  }

  // Rule 8: exit-block — lessons with decodePassRequired must end with decode steps
  if (lesson.masteryPolicy.decodePassRequired !== undefined) {
    const plan = lesson.exercisePlan;
    const lastStep = plan[plan.length - 1];
    if (lastStep && !isDecodeStep(lastStep)) {
      errors.push(
        `Lesson ${lesson.id}: decodePassRequired set but exercisePlan does not end with decode steps (exit-block violated)`
      );
    }
  }

  // Rule 9: transliteration answer mode rejected past Phase 2.
  // KNOWN LIMITATION: answerMode is a runtime property of ExerciseItem (generated
  // by the read.ts generator), not an authored field on ExerciseStep. At validation
  // time, we can only check for a tags-based convention: lessons that allow
  // transliteration must declare it via tags: ["answerMode:transliteration"].
  // This is a weak proxy — a lesson author could forget the tag. The real enforcement
  // happens at two additional layers:
  //   1. The read generator checks lesson.phase and refuses to emit transliteration
  //      answer mode past Phase 2 (Plan 2 implementation)
  //   2. The ReadExercise UI component refuses to render transliteration options
  //      if answerMode doesn't match (defense in depth, Plan 3 implementation)
  // This tag-based check is the build-time layer of a three-layer guard.
  if (lesson.phase > 2) {
    const hasReadSteps = lesson.exercisePlan.some((s) => s.type === "read");
    const hasTransliterationTag = lesson.tags?.some((t) => t.includes("transliteration"));
    if (hasReadSteps && hasTransliterationTag) {
      errors.push(
        `Lesson ${lesson.id}: Phase ${lesson.phase} read steps cannot use transliteration answer mode`
      );
    }
  }

  // Rule 5: checkpoint lessons must have at least one decode step (read or check)
  const hasCheckStep = lesson.exercisePlan.some((s) => s.type === "check");
  if (hasCheckStep) {
    const hasDecodeStep = lesson.exercisePlan.some(isDecodeStep);
    if (!hasDecodeStep) {
      errors.push(
        `Lesson ${lesson.id}: checkpoint lesson (has check step) must include at least one decode step (read or check)`
      );
    }
  }

  // Rule 2: step targets must have compatible entities in scope
  for (const step of lesson.exercisePlan) {
    const requiredCap = TARGET_TO_CAPABILITY[step.target];
    if (!requiredCap) continue;

    const source = step.source;

    if (source.from === "all") {
      // Cannot validate statically — skip
      continue;
    }

    if (source.from === "explicit") {
      // Handled by Rule 6 (resolution check) — skip capability check here
      continue;
    }

    let poolIds: string[] = [];
    if (source.from === "teach") {
      poolIds = lesson.teachEntityIds;
    } else if (source.from === "review") {
      poolIds = lesson.reviewEntityIds;
    } else if (source.from === "mixed") {
      poolIds = [...lesson.teachEntityIds, ...lesson.reviewEntityIds];
    }

    let hasCompatible = false;
    for (const id of poolIds) {
      const entity = await resolveEntity(id);
      if (entity && entity.capabilities.includes(requiredCap)) {
        hasCompatible = true;
        break;
      }
    }
    if (!hasCompatible) {
      const sourceName = source.from;
      errors.push(
        `Lesson ${lesson.id}: step target "${step.target}" has no compatible entities in ${sourceName} source`
      );
    }
  }

  return { lessonId: lesson.id, valid: errors.length === 0, errors };
}

export async function validateAllLessons(lessons: LessonV2[]): Promise<ValidationResult[]> {
  return Promise.all(lessons.map(validateLesson));
}
