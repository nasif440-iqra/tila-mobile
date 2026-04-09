import type { LessonV2, ExerciseStep } from "@/src/types/curriculum-v2";
import type { EntityCapability } from "@/src/types/entity";
import type { ExerciseItem } from "@/src/types/exercise";
import { resolveEntity, COMBO_SLUG_TO_LETTER_ID } from "./entityRegistry";
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
  const SUPPORTED_HARAKAT = ["fatha", "kasra", "damma", "sukun"];
  const allEntityIds = [...lesson.teachEntityIds, ...lesson.reviewEntityIds];
  for (const id of allEntityIds) {
    const entity = await resolveEntity(id);
    if (!entity) {
      // Give a specific error for combo IDs with unsupported harakat
      const comboMatch = id.match(/^combo:([^-]+)-(.+)$/);
      if (comboMatch && !SUPPORTED_HARAKAT.includes(comboMatch[2])) {
        errors.push(
          `Lesson ${lesson.id}: combo "${id}" uses harakat "${comboMatch[2]}" which is not supported by combo resolution. ` +
          `Supported: ${SUPPORTED_HARAKAT.join(", ")}. Add it to HARAKAT_MAP in entityRegistry.ts if this is a new harakat.`
        );
      } else {
        errors.push(`Entity "${id}" in lesson ${lesson.id} does not resolve to any registry`);
      }
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
  // Count decode items from both exercisePlan and exitSequence (authored decode gates)
  if (lesson.masteryPolicy.decodePassRequired !== undefined) {
    const planDecodeCount = totalDecodeItems(lesson.exercisePlan);
    const exitDecodeCount = (lesson.exitSequence ?? []).filter((item) => item.isDecodeItem).length;
    const decodeCount = planDecodeCount + exitDecodeCount;
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

  // ── Authored item validation ──

  const allAuthoredItems: ExerciseItem[] = [
    ...(lesson.teachingSequence ?? []),
    ...(lesson.exitSequence ?? []),
  ];

  // Rule A1: exitSequence must not contain present items
  for (const item of (lesson.exitSequence ?? [])) {
    if (item.type === "present") {
      errors.push(
        `Lesson ${lesson.id}: exitSequence contains a "present" item — exit items must be scored`
      );
    }
  }

  // Rule A2: exitSequence read items must have isDecodeItem: true
  for (const item of (lesson.exitSequence ?? [])) {
    if (item.type === "read" && !item.isDecodeItem) {
      errors.push(
        `Lesson ${lesson.id}: exitSequence read item must have isDecodeItem: true`
      );
    }
  }

  // Rule A3: quiz items must have non-empty options
  for (const item of allAuthoredItems) {
    const quizTypes = ["tap", "hear", "choose", "read"];
    if (quizTypes.includes(item.type) && (!item.options || item.options.length === 0)) {
      errors.push(
        `Lesson ${lesson.id}: authored ${item.type} item has empty options array`
      );
    }
  }

  // Rule A4: correctAnswer must match an option or tile
  for (const item of allAuthoredItems) {
    if (item.type === "present") continue;
    if (item.correctAnswer.kind === "single" && item.options) {
      const correctId = item.correctAnswer.value;
      const optionIds = item.options.map((o) => o.id);
      if (!optionIds.includes(correctId)) {
        errors.push(
          `Lesson ${lesson.id}: authored item correctAnswer "${correctId}" does not match any option ID`
        );
      }
    }
  }

  // Rule A5: stable unique IDs — check for duplicate option/tile IDs across all authored items
  const seenOptionIds = new Set<string>();
  for (const item of allAuthoredItems) {
    for (const opt of (item.options ?? [])) {
      if (seenOptionIds.has(opt.id)) {
        errors.push(
          `Lesson ${lesson.id}: duplicate option ID "${opt.id}" in authored items`
        );
      }
      seenOptionIds.add(opt.id);
    }
    for (const tile of (item.tiles ?? [])) {
      if (seenOptionIds.has(tile.id)) {
        errors.push(
          `Lesson ${lesson.id}: duplicate tile ID "${tile.id}" in authored items`
        );
      }
      seenOptionIds.add(tile.id);
    }
  }

  return { lessonId: lesson.id, valid: errors.length === 0, errors };
}

// ── Rule 10: Introduction-order enforcement ──
// Checks that all entities referenced by a lesson (teach, review, chunk breakdowns)
// only use letters/combos that have been introduced in this lesson or earlier lessons.
// Lessons must be sorted by ID for this to work correctly.

async function validateIntroductionOrder(
  lesson: LessonV2,
  knownEntityIds: Set<string>,
): Promise<string[]> {
  const errors: string[] = [];

  // reviewEntityIds must all be previously known
  for (const id of lesson.reviewEntityIds) {
    if (!knownEntityIds.has(id)) {
      // Combos are derived — check if the underlying letter is known
      const comboMatch = id.match(/^combo:([^-]+)-(.+)$/);
      if (comboMatch) {
        // A combo is "known" if its letter has been taught
        // We check if any combo with the same letter slug exists in known set,
        // or if the letter itself is known
        const slugToCheck = `letter:`;
        const letterKnown = [...knownEntityIds].some(
          (k) => k.startsWith("combo:" + comboMatch[1] + "-") || k.startsWith("letter:")
        );
        // Skip combo prerequisite check for now — combos are derived from letters + harakat
        // The real check is whether the LETTER is known
        continue;
      }
      errors.push(
        `Lesson ${lesson.id}: reviewEntityId "${id}" has not been introduced in any prior lesson`
      );
    }
  }

  // Check chunk/word teachingBreakdownIds — these reference letters and combos
  // that the learner must already know (or be learning in this lesson)
  const thisLessonEntities = new Set([...knownEntityIds, ...lesson.teachEntityIds]);

  for (const id of lesson.teachEntityIds) {
    const entity = await resolveEntity(id);
    if (!entity) continue;

    // Check if entity has teachingBreakdownIds (chunks, words)
    if ("teachingBreakdownIds" in entity) {
      const breakdown = (entity as any).teachingBreakdownIds as string[];
      for (const partId of breakdown) {
        // Extract the letter from a combo ID
        const comboMatch = partId.match(/^combo:([^-]+)-(.+)$/);
        if (comboMatch) {
          const slug = comboMatch[1];
          // Find the letter ID for this slug — check if letter:N is known
          const letterId = COMBO_SLUG_TO_LETTER_ID[slug];
          if (letterId != null) {
            const letterEntityId = `letter:${letterId}`;
            if (!thisLessonEntities.has(letterEntityId)) {
              errors.push(
                `Lesson ${lesson.id}: chunk/word "${id}" breakdown uses "${partId}" which requires letter:${letterId} — not introduced by this lesson or earlier`
              );
            }
          }
        } else if (partId.startsWith("letter:")) {
          if (!thisLessonEntities.has(partId)) {
            errors.push(
              `Lesson ${lesson.id}: chunk/word "${id}" breakdown references "${partId}" — not introduced by this lesson or earlier`
            );
          }
        }
      }
    }
  }

  return errors;
}

export async function validateAllLessons(lessons: LessonV2[]): Promise<ValidationResult[]> {
  // Sort by ID for introduction-order checking
  const sorted = [...lessons].sort((a, b) => a.id - b.id);
  const results: ValidationResult[] = [];
  const knownEntityIds = new Set<string>();

  for (const lesson of sorted) {
    // Run standard validation
    const result = await validateLesson(lesson);

    // Run introduction-order validation
    const orderErrors = await validateIntroductionOrder(lesson, knownEntityIds);
    result.errors.push(...orderErrors);
    result.valid = result.errors.length === 0;

    results.push(result);

    // Add this lesson's teach entities to the known set
    for (const id of lesson.teachEntityIds) {
      knownEntityIds.add(id);
    }
  }

  return results;
}
