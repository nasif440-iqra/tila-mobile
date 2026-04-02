import { getLetter } from "../../data/letters.js";
import type { ArabicLetter } from "../../types/engine";
import type { QuestionOption } from "../../types/question";

export function getWrongExplanation(chosenId: number | string, correctId: number | string, mode: string): string {
  const c = getLetter(chosenId as number), t = getLetter(correctId as number);
  if (!c || !t) return "Listen carefully and try again.";
  if (mode === "sound") {
    const parts: string[] = [];
    parts.push(`You picked ${c.name} (${c.letter}) \u2014 ${c.soundHint}.`);
    parts.push(`The answer is ${t.name} (${t.letter}) \u2014 ${t.soundHint}.`);
    if (c.family === t.family) {
      if (c.dots !== t.dots) {
        parts.push(`Tip: same shape, but ${c.name} has ${c.dots === 0 ? "no dots" : c.visualRule} while ${t.name} has ${t.visualRule} \u2014 the dots tell them apart.`);
      } else {
        parts.push(`They look very alike \u2014 focus on the sound: "${c.transliteration}" vs "${t.transliteration}".`);
      }
    } else if (c.dots === t.dots && c.dotPos === t.dotPos) {
      parts.push(`Different shapes but same dot pattern \u2014 listen for "${t.transliteration}" next time.`);
    } else {
      parts.push(`${c.name} sounds like "${c.transliteration}" while ${t.name} sounds like "${t.transliteration}" \u2014 quite different once you hear it.`);
    }
    // Add articulation tip if available for the correct letter
    if (t.articulation?.tryThis) {
      parts.push(`Try this: ${t.articulation.tryThis}`);
    }
    parts.push("Listen again to hear the difference.");
    return parts.join(" ");
  }
  // Recognition mode
  if (c.family === t.family) {
    if (c.dots !== t.dots) {
      const dotTip = c.dots === 0 ? `${c.name} has no dots` : `${c.name} has ${c.visualRule}`;
      const ansTip = t.dots === 0 ? `${t.name} has no dots` : `${t.name} has ${t.visualRule}`;
      return `Close! Same shape family \u2014 but ${dotTip} and ${ansTip}. The dots are the key.`;
    }
    return `Same shape family \u2014 that's ${c.name}, not ${t.name}. Look at the overall shape carefully.`;
  }
  if (c.dots === t.dots && c.dotPos === t.dotPos) {
    return `${c.name} and ${t.name} both have ${c.dots === 0 ? "no dots" : c.visualRule}, but their shapes are different. Look at the body of the letter.`;
  }
  if (c.dots !== t.dots) {
    return `That's ${c.name} (${c.dots === 0 ? "no dots" : c.visualRule}). You need ${t.name} (${t.visualRule}) \u2014 count the dots.`;
  }
  return `That's ${c.name}, not ${t.name}. They have different shapes \u2014 look at the overall form.`;
}

export function getContrastExplanation(chosenId: number | string, correctId: number | string): string {
  const c = getLetter(chosenId as number), t = getLetter(correctId as number);
  if (!c || !t) return "Listen carefully and try again.";
  const parts: string[] = [];
  parts.push(`You picked ${c.name} (${c.letter}) \u2014 ${c.soundHint}.`);
  parts.push(`The correct answer is ${t.name} (${t.letter}) \u2014 ${t.soundHint}.`);
  if (c.family === t.family) {
    if (c.dots !== t.dots) {
      parts.push(`Same shape, but ${c.name} has ${c.dots === 0 ? "no dots" : c.visualRule} while ${t.name} has ${t.visualRule} \u2014 the dots help tell them apart visually.`);
    } else {
      parts.push(`They look the same \u2014 focus purely on the sound: "${c.transliteration}" vs "${t.transliteration}".`);
    }
  } else {
    const heavier = [14, 15, 16, 17];
    if (heavier.includes(c.id) || heavier.includes(t.id)) {
      const heavy = heavier.includes(t.id) ? t : c;
      const light = heavy.id === t.id ? c : t;
      parts.push(`${heavy.name} is the heavier sound \u2014 ${light.name} is lighter. Listen for the deeper tone.`);
    } else {
      parts.push(`"${c.transliteration}" and "${t.transliteration}" \u2014 try saying them in your head to feel the difference.`);
    }
  }
  parts.push("Listen again and compare.");
  return parts.join(" ");
}

interface HarakatQuestion {
  options: Array<{ id: string | number; label: string; isCorrect: boolean }>;
}

export function getHarakatWrongExplanation(question: HarakatQuestion, chosenId: string | number): string {
  const chosen = question.options.find(o => o.id === chosenId);
  const correct = question.options.find(o => o.isCorrect);
  if (!chosen || !correct) return "Look carefully and try again.";
  return `You picked ${chosen.label} \u2014 the correct answer is ${correct.label}. Look at the marks carefully.`;
}
