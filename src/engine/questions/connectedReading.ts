import { getLetter } from "../../data/letters.js";
import type { Lesson } from "../../types/lesson";
import type { ArabicLetter } from "../../types/engine";
import type { QuestionOption } from "../../types/question";
import { shuffle, pickRandom } from "./shared";

const VOWEL_MARKS: Record<string, string> = {
  fatha: "\u064E",
  kasra: "\u0650",
  damma: "\u064F",
};

const VOWEL_SOUNDS: Record<string, string> = {
  fatha: "a",
  kasra: "i",
  damma: "u",
};

const VOWEL_NAMES: Record<string, string> = {
  fatha: "Fatha",
  kasra: "Kasra",
  damma: "Damma",
};

interface BuildupSegment {
  arabic: string;
  sound: string;
  letterId: number;
}

interface BuildupExercise {
  type: string;
  segments: BuildupSegment[];
  fullWord: {
    arabic: string;
    transliteration: string;
    ttsText: string;
  };
  explanation: string;
}

interface ConnectedReadingExercise {
  type: string;
  prompt?: string;
  displayArabic?: string;
  targetId?: string | number;
  options?: QuestionOption[];
  segments?: BuildupSegment[];
  fullWord?: {
    arabic: string;
    transliteration: string;
    ttsText: string;
  };
  explanation?: string;
  arabic?: string;
  transliteration?: string;
  ttsText?: string;
}

function getTranslitBase(letter: ArabicLetter): string {
  let base = letter.transliteration;
  if (base === "'a") return "'";
  return base;
}

function buildBuildupPair(letterId1: number, letterId2: number, vowelId: string): BuildupExercise | null {
  const l1 = getLetter(letterId1);
  const l2 = getLetter(letterId2);
  if (!l1 || !l2) return null;

  const mark = VOWEL_MARKS[vowelId];
  const vowelSound = VOWEL_SOUNDS[vowelId];
  const base1 = getTranslitBase(l1);
  const base2 = getTranslitBase(l2);

  const arabic1 = l1.letter + mark;
  const arabic2 = l2.letter + mark;
  const sound1 = base1 + vowelSound;
  const sound2 = base2 + vowelSound;
  const combined = arabic1 + arabic2;
  const combinedTranslit = sound1 + "-" + sound2;

  return {
    type: "buildup_pair",
    segments: [
      { arabic: arabic1, sound: sound1, letterId: letterId1 },
      { arabic: arabic2, sound: sound2, letterId: letterId2 },
    ],
    fullWord: {
      arabic: combined,
      transliteration: combinedTranslit,
      ttsText: combined,
    },
    explanation: `Read right to left: ${l1.name} (${l1.letter}) with ${VOWEL_NAMES[vowelId]} connects to ${l2.name} (${l2.letter}) with ${VOWEL_NAMES[vowelId]}.`,
  };
}

function buildFreeRead(buildupExercise: BuildupExercise): ConnectedReadingExercise {
  return {
    type: "free_read",
    arabic: buildupExercise.fullWord.arabic,
    transliteration: buildupExercise.fullWord.transliteration,
    ttsText: buildupExercise.fullWord.ttsText,
    prompt: "Read this aloud",
  };
}

function buildComprehension(buildupExercise: BuildupExercise, allBuildup: BuildupExercise[]): ConnectedReadingExercise {
  const correct = buildupExercise.fullWord.transliteration;
  const distractors = allBuildup
    .filter(e => e.fullWord.transliteration !== correct)
    .map(e => e.fullWord.transliteration);
  const uniqueDistractors = [...new Set(distractors)].slice(0, 3);

  // Pad with simple fallbacks if not enough distractors
  while (uniqueDistractors.length < 3) {
    const fallback = "ba-" + Object.values(VOWEL_SOUNDS)[uniqueDistractors.length];
    if (fallback !== correct && !uniqueDistractors.includes(fallback)) {
      uniqueDistractors.push(fallback);
    } else {
      uniqueDistractors.push("ka-ma");
    }
  }

  const options = shuffle([
    { id: "correct", label: correct, isCorrect: true },
    ...uniqueDistractors.map((t, i) => ({ id: `distractor_${i}`, label: t, isCorrect: false })),
  ]);

  return {
    type: "comprehension",
    prompt: "What did you just read?",
    displayArabic: buildupExercise.fullWord.arabic,
    targetId: "correct",
    options,
  };
}

/**
 * Generate exercises for Phase 5 connected reading lessons.
 */
export function generateConnectedReadingExercises(lesson: Lesson): ConnectedReadingExercise[] {
  if (!lesson) return [];
  const teachIds = lesson.teachIds || [];
  if (teachIds.length < 2) return [];

  const allBuildup: BuildupExercise[] = [];

  // Generate buildup pairs for each adjacent pair and each vowel
  for (let i = 0; i < teachIds.length - 1; i++) {
    for (const vowelId of Object.keys(VOWEL_MARKS)) {
      const ex = buildBuildupPair(teachIds[i], teachIds[i + 1], vowelId);
      if (ex) allBuildup.push(ex);
    }
  }

  // Shuffle and limit to 4 buildup exercises
  const selectedBuildup = shuffle(allBuildup).slice(0, 4);

  // Generate 2 free_read exercises from the buildup words
  const freeReadSource = shuffle([...selectedBuildup]).slice(0, 2);
  const freeReads = freeReadSource.map(buildFreeRead);

  // Generate 1 comprehension exercise from any buildup word
  const compSource = pickRandom(selectedBuildup)!;
  const comprehension = buildComprehension(compSource, allBuildup);

  return [...selectedBuildup, ...freeReads, comprehension];
}
