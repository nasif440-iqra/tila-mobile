// ── Encouragement messages — randomly selected on each app open ──

const ENCOURAGEMENT_EARLY = [
  "Every letter is a step closer",
  "You're building something beautiful",
  "One letter at a time",
  "The journey of a thousand miles\nbegins with a single step",
  "Begin your journey",
];

const ENCOURAGEMENT_GROWING = [
  "Keep going — you're learning fast",
  "Masha'Allah, look how far you've come",
  "Every session makes you stronger",
  "Your effort is building something lasting",
  "Consistency is the key",
  "Small steps, big progress",
];

const ENCOURAGEMENT_STRONG = [
  "You're making real progress",
  "The Quran is getting closer",
  "Your dedication is inspiring",
  "Every letter you learn is a gift",
  "Keep this momentum going",
  "Masha'Allah — look at your growth",
];

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Personalized greeting line 1 ──

export function getGreetingLine1(userName: string | null): string {
  return userName ? `ASSALAMU ALAIKUM, ${userName.toUpperCase()}` : "ASSALAMU ALAIKUM";
}

// ── Dynamic encouragement based on progress ──

export function getMotivationSubtitle(
  _motivation: string | null,
  lessonsCompleted: number,
  learnedCount: number
): string {
  if (lessonsCompleted === 0) return pickRandom(ENCOURAGEMENT_EARLY);
  if (learnedCount < 10) return pickRandom(ENCOURAGEMENT_GROWING);
  return pickRandom(ENCOURAGEMENT_STRONG);
}
