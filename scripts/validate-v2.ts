// scripts/validate-v2.ts
// Run with: npm run validate-v2

import { LESSONS_V2 } from "../src/data/curriculum-v2/lessons";
import { CHUNKS, WORDS, PATTERNS, RULES, ORTHOGRAPHY, ASSESSMENT_PROFILES } from "../src/data/curriculum-v2";
import { validateAllLessons } from "../src/engine/v2/validation";

async function main() {
  console.log("=== Curriculum V2 Validation ===\n");

  // 1. Run schema validation on all lessons
  const results = await validateAllLessons(LESSONS_V2);

  let errors = 0;
  for (const result of results) {
    if (!result.valid) {
      console.log(`❌ Lesson ${result.lessonId}:`);
      result.errors.forEach(e => console.log(`   ${e}`));
      errors++;
    }
  }

  if (errors === 0) {
    console.log(`✅ All ${LESSONS_V2.length} lessons pass validation\n`);
  } else {
    console.log(`\n❌ ${errors} lesson(s) have errors\n`);
  }

  // 2. Check for duplicate lesson IDs
  const ids = LESSONS_V2.map(l => l.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    console.log(`❌ Duplicate lesson IDs: ${dupes.join(", ")}`);
  }

  // 3. Check lesson ID continuity (gaps are OK but flag them)
  const sorted = [...ids].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] > 1) {
      for (let g = sorted[i - 1] + 1; g < sorted[i]; g++) {
        gaps.push(g);
      }
    }
  }
  if (gaps.length > 0) {
    console.log(`⚠️  Missing lesson IDs (gaps): ${gaps.join(", ")}`);
  }

  // 4. Check phases covered
  const phasesInLessons = new Set(LESSONS_V2.map(l => l.phase));
  console.log(`Phases with lessons: ${[...phasesInLessons].sort().join(", ")}`);

  // 5. Check each phase has a checkpoint (last lesson with a check step)
  for (let p = 1; p <= 6; p++) {
    const phaseLessons = LESSONS_V2.filter(l => l.phase === p);
    const hasCheckpoint = phaseLessons.some(l => l.exercisePlan.some(s => s.type === "check"));
    if (phaseLessons.length > 0 && !hasCheckpoint) {
      console.log(`⚠️  Phase ${p} has ${phaseLessons.length} lessons but no checkpoint`);
    }
  }

  // 6. Registry stats
  console.log(`\n=== Registry Status ===`);
  console.log(`Chunks:      ${CHUNKS.length}`);
  console.log(`Words:       ${WORDS.length}`);
  console.log(`Patterns:    ${PATTERNS.length}`);
  console.log(`Rules:       ${RULES.length}`);
  console.log(`Orthography: ${ORTHOGRAPHY.length}`);
  console.log(`Profiles:    ${ASSESSMENT_PROFILES.length}`);

  // 7. Summary
  console.log(`\n=== Summary ===`);
  console.log(`Total lessons: ${LESSONS_V2.length} / 62`);
  console.log(`Phases covered: ${phasesInLessons.size} / 6`);
  console.log(`Validation: ${errors === 0 ? "PASS" : "FAIL"}`);

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
