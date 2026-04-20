import type { RefScreen } from "./types";

export const referenceLessonScreens: RefScreen[] = [
  {
    type: "teach",
    title: "Arabic reads right to left",
    body: "Arabic is read from right to left — the opposite of English. Every word starts on the right.",
    arabicDisplay: "\u2190",
  },
  {
    type: "teach",
    title: "This is Alif",
    body: "Alif is the first letter of the Arabic alphabet. It makes a long 'aa' sound, like the 'a' in 'father'.",
    arabicDisplay: "\u0627",
    audioKey: "letter_1",
  },
  {
    type: "check",
    prompt: "Which letter is Alif?",
    options: ["\u0627", "\u0628", "\u062A", "\u062B"],
    correctIndex: 0,
  },
];
