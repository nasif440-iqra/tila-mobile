// ── Greeting subtitle (dynamic, based on progress) ──

export function getGreetingSubtitle(lessonsCompleted: number, learnedCount: number): string {
  if (lessonsCompleted === 0) return "Begin your\njourney";
  if (lessonsCompleted === 1) return "You\u2019ve started\nlearning Quran";
  if (learnedCount < 10) return `${learnedCount} letters down`;
  return `${learnedCount} letters and growing`;
}

// ── Motivation to subtitle mapping (D-09) ──

export const MOTIVATION_SUBTITLES: Record<string, string> = {
  read_quran: "Reading toward the Quran",
  pray_confidently: "Building toward confident salah",
  connect_heritage: "Connecting to your heritage",
  teach_children: "Learning to teach your children",
  personal_growth: "Growing in your faith",
};

// ── Personalized greeting line 1 (D-06, D-07) ──

export function getGreetingLine1(userName: string | null): string {
  return userName ? `ASSALAMU ALAIKUM, ${userName.toUpperCase()}` : "ASSALAMU ALAIKUM";
}

// ── Motivation subtitle with fallback (D-08, D-09) ──

export function getMotivationSubtitle(
  motivation: string | null,
  lessonsCompleted: number,
  learnedCount: number
): string {
  if (motivation && MOTIVATION_SUBTITLES[motivation]) {
    return MOTIVATION_SUBTITLES[motivation];
  }
  return getGreetingSubtitle(lessonsCompleted, learnedCount);
}
