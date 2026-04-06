import { getLetter } from "../../data/letters.js";
import type { Lesson } from "../../types/lesson";
import type { Question } from "../../types/question";
import type { ArabicLetter } from "../../types/engine";
import { shuffle, pickRandom, getKnownIds, getConfusionDistractors, makeOpts, makeSoundOpts, getSoundPrompt, getLetterSoundPrompt, SOUND_CONFUSION_MAP, SOUND_PROMPTS } from "./shared";

export function generateSoundQs(lesson: Lesson): Question[] {
  const known = getKnownIds(lesson.id);
  const allPool = [...new Set([...known, ...(lesson.teachIds || []), ...(lesson.reviewIds || [])])];
  const teach = (lesson.teachIds || []).map(id => getLetter(id)).filter(Boolean) as ArabicLetter[];
  const isLater = lesson.id >= 50;
  const dCount = isLater ? 2 : 1;
  const qs: Question[] = [];

  for (const t of teach) {
    const d = getConfusionDistractors(t.id, allPool, dCount);
    const hasConfusion = d.some(l => (SOUND_CONFUSION_MAP[t.id] || []).includes(l.id));
    qs.push({ type: "audio_to_letter", prompt: getSoundPrompt("audio_to_letter", hasConfusion), targetId: t.id, hasAudio: true, options: makeOpts([t, ...d], t.id) });
  }

  for (const t of teach) {
    const d = getConfusionDistractors(t.id, allPool, dCount);
    qs.push({ type: "letter_to_sound", prompt: t.letter, promptSubtext: getLetterSoundPrompt(t), targetId: t.id, optionMode: "sound", options: makeSoundOpts([t, ...d], t.id) });
  }

  if (teach.length >= 2) {
    for (const t of shuffle([...teach]).slice(0, 2)) {
      const others = teach.filter(x => x.id !== t.id);
      const hasConfusion = others.some(o => (SOUND_CONFUSION_MAP[t.id] || []).includes(o.id));
      qs.push({ type: "contrast_audio", prompt: getSoundPrompt("contrast_audio", hasConfusion), targetId: t.id, hasAudio: true, options: makeOpts(teach.length <= 3 ? teach : [t, ...shuffle(others).slice(0, 2)], t.id) });
    }
  }

  for (const t of shuffle([...teach]).slice(0, 1)) {
    const d = getConfusionDistractors(t.id, allPool, dCount);
    qs.push({ type: "letter_to_sound", prompt: t.letter, promptSubtext: `Which sound goes with ${t.name}?`, targetId: t.id, optionMode: "sound", options: makeSoundOpts([t, ...d], t.id) });
  }

  if (isLater) {
    const candidates = teach.filter(t => (SOUND_CONFUSION_MAP[t.id] || []).some(id => allPool.includes(id)));
    for (const t of shuffle(candidates).slice(0, 1)) {
      const confusionIds = (SOUND_CONFUSION_MAP[t.id] || []).filter(id => allPool.includes(id));
      const confusors = confusionIds.slice(0, 2).map(id => getLetter(id)).filter(Boolean) as ArabicLetter[];
      if (confusors.length > 0) {
        qs.push({ type: "audio_to_letter", prompt: pickRandom(SOUND_PROMPTS.confused_contrast), targetId: t.id, hasAudio: true, isConfusionQ: true, options: makeOpts([t, ...confusors], t.id) });
      }
    }
  }

  if (lesson.reviewIds?.length > 0) {
    const rid = shuffle(lesson.reviewIds)[0];
    const rev = getLetter(rid);
    if (rev) {
      const d = getConfusionDistractors(rev.id, allPool, dCount);
      qs.push({ type: "audio_to_letter", prompt: `Review: which letter is this?`, targetId: rev.id, hasAudio: true, options: makeOpts([rev, ...d], rev.id) });
    }
  }

  return qs;
}
