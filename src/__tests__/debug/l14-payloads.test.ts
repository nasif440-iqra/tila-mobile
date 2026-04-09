import { describe, it, expect } from "vitest";
import { LESSONS_V2 } from "@/src/data/curriculum-v2/lessons";
import { generateV2Exercises } from "@/src/engine/questions-v2/index";
import { resolveAll } from "@/src/engine/v2/entityRegistry";
import type { MasterySnapshot } from "@/src/types/exercise";

describe("L14 payload debug", () => {
  it("dumps all L14 exercise payloads and checks for issues", async () => {
    const lesson = LESSONS_V2.find(l => l.id === 14)!;

    // Replicate useLessonQuizV2 pool construction (must stay in sync with hook)
    const priorLessons = LESSONS_V2.filter(l => l.id <= lesson.id);
    const allPriorEntityIds = new Set<string>();
    for (const l of priorLessons) {
      l.teachEntityIds.forEach(id => allPriorEntityIds.add(id));
      l.reviewEntityIds.forEach(id => allPriorEntityIds.add(id));
    }
    const priorLetterIds = Array.from(allPriorEntityIds).filter(id => id.startsWith("letter:"));
    const allLetters = await resolveAll(priorLetterIds);

    const comboSlugs = [
      "alif", "ba", "ta", "tha", "jeem", "haa", "khaa",
      "daal", "dhaal", "ra", "zay", "seen", "sheen",
      "saad", "daad", "taa", "dhaa", "ain", "ghain",
      "fa", "qaf", "kaf", "la", "ma", "noon", "ha", "waw", "ya",
    ];
    const harakatNames = ["fatha", "kasra", "damma"];
    const comboIds = comboSlugs.flatMap(s => harakatNames.map(h => `combo:${s}-${h}`));
    const priorComboIds = Array.from(allPriorEntityIds).filter(id => id.startsWith("combo:"));
    const priorComboSet = new Set(priorComboIds);
    const allCombos = (await resolveAll(comboIds)).filter(combo => priorComboSet.has(combo.id));

    const lessonEntityIds = [...lesson.teachEntityIds, ...lesson.reviewEntityIds];
    const lessonEntities = await resolveAll(lessonEntityIds);
    const allUnlocked = [
      ...allLetters,
      ...allCombos,
      ...lessonEntities.filter(e => !e.id.startsWith("letter:") && !e.id.startsWith("combo:")),
    ];

    const emptySnapshot: MasterySnapshot = { entityStates: new Map(), confusionPairs: new Map() };
    const items = await generateV2Exercises(lesson, allUnlocked, emptySnapshot);

    console.log(`\n=== L14: ${items.length} items ===\n`);

    const issues: string[] = [];

    items.forEach((item, i) => {
      console.log(`--- Q${i+1} (${item.type}) ---`);
      console.log(`  prompt: "${item.prompt.text}" arabic: "${item.prompt.arabicDisplay}" hint: "${item.prompt.hintText ?? "none"}"`);
      console.log(`  answerMode: ${item.answerMode} target: ${item.targetEntityId}`);

      if (item.options) {
        item.options.forEach((opt, j) => {
          const label = opt.displayArabic ?? opt.displayText ?? "";
          console.log(`  opt${j}: id=${opt.id} label="${label}" audio="${opt.audioKey ?? ""}" correct=${opt.isCorrect}`);
          if (!label && !opt.audioKey) issues.push(`Q${i+1} opt${j}: empty label AND no audioKey (id=${opt.id})`);
        });
      }

      if (item.tiles) {
        item.tiles.forEach((tile, j) => {
          console.log(`  tile${j}: id=${tile.id} arabic="${tile.displayArabic}" distractor=${tile.isDistractor}`);
          if (tile.displayArabic.includes(":")) issues.push(`Q${i+1} tile${j}: raw entity ID "${tile.displayArabic}"`);
        });
        const tileIds = item.tiles.map(t => t.id);
        const dupes = tileIds.filter((id, idx) => tileIds.indexOf(id) !== idx);
        if (dupes.length) issues.push(`Q${i+1}: duplicate tile keys: ${dupes.join(", ")}`);
      }

      if (item.fixSegments) {
        item.fixSegments.forEach((seg, j) => {
          console.log(`  seg${j}: id=${seg.segmentId} text="${seg.displayText}" error=${seg.isErrorLocation}`);
        });
      }
      console.log();
    });

    // Check: combo:alif-fatha in pool?
    const hasAlif = allUnlocked.some(e => e.id === "combo:alif-fatha");
    console.log(`combo:alif-fatha in pool: ${hasAlif}`);

    // Check: untaught letter distractors
    const taughtLetterIds = new Set(["letter:1", "letter:2", "letter:23", "letter:24", "letter:25", "letter:26", "letter:28", "letter:12", "letter:8"]);
    items.filter(i => i.options).forEach((item, qi) => {
      item.options!.forEach(opt => {
        if (opt.id.startsWith("letter:") && !opt.isCorrect && !taughtLetterIds.has(opt.id)) {
          issues.push(`Q${qi+1}: untaught distractor ${opt.id}`);
        }
      });
    });

    console.log("\n=== ISSUES FOUND ===");
    issues.forEach(i => console.log(`❌ ${i}`));
    if (!issues.length) console.log("✅ No issues");

    // Don't fail the test — this is diagnostic
    expect(items.length).toBeGreaterThan(0);
  });
});
