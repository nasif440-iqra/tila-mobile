import type { ScoredItem } from "@/src/types/exercise";
import type { MasteryPolicy } from "@/src/types/curriculum-v2";

// ── Types ──

export type LessonFailureReason =
  | { reason: "below-pass-threshold"; actual: number; required: number }
  | { reason: "decode-streak-broken"; required: number; achieved: number }
  | { reason: "decode-percent-low"; actual: number; required: number }
  | { reason: "bucket-weakness"; bucket: string; score: number };

export interface LessonResult {
  lessonId: number;
  totalItems: number;
  correctItems: number;
  overallPercent: number;
  decodeItems: number;
  decodeCorrect: number;
  decodePercent: number;
  finalDecodeStreak: number;
  bucketScores: Record<string, { correct: number; total: number }>;
  passed: boolean;
  failureReasons: LessonFailureReason[];
}

// ── Core function ──

export function evaluateLesson(
  lessonId: number,
  scoredItems: ScoredItem[],
  policy: MasteryPolicy,
  bucketThresholds?: Record<string, number>,
): LessonResult {
  // Filter out present items — they are not scored
  const scorableItems = scoredItems.filter((s) => s.item.type !== "present");

  // ── Overall counts ──
  const totalItems = scorableItems.length;
  const correctItems = scorableItems.filter((s) => s.correct).length;
  const overallPercent = totalItems === 0 ? 0 : correctItems / totalItems;

  // ── Decode counts ──
  const decodeOnly = scorableItems.filter((s) => s.item.isDecodeItem);
  const decodeItems = decodeOnly.length;
  const decodeCorrect = decodeOnly.filter((s) => s.correct).length;
  const decodePercent = decodeItems === 0 ? 0 : decodeCorrect / decodeItems;

  // ── Final decode streak (walk backwards through ALL scorable items, counting consecutive correct decode items) ──
  let finalDecodeStreak = 0;
  for (let i = scorableItems.length - 1; i >= 0; i--) {
    const s = scorableItems[i];
    if (!s.item.isDecodeItem) continue; // skip non-decode items
    if (!s.correct) break; // incorrect decode item ends the streak
    finalDecodeStreak++;
  }

  // ── Bucket scores (items with an assessmentBucket only) ──
  const bucketScores: Record<string, { correct: number; total: number }> = {};
  for (const s of scorableItems) {
    const bucket = s.assessmentBucket ?? s.item.assessmentBucket;
    if (!bucket) continue;
    if (!bucketScores[bucket]) {
      bucketScores[bucket] = { correct: 0, total: 0 };
    }
    bucketScores[bucket].total++;
    if (s.correct) bucketScores[bucket].correct++;
  }

  // ── Evaluate pass conditions ──
  const failureReasons: LessonFailureReason[] = [];

  if (overallPercent < policy.passThreshold) {
    failureReasons.push({
      reason: "below-pass-threshold",
      actual: overallPercent,
      required: policy.passThreshold,
    });
  }

  if (policy.decodePassRequired !== undefined) {
    if (finalDecodeStreak < policy.decodePassRequired) {
      failureReasons.push({
        reason: "decode-streak-broken",
        required: policy.decodePassRequired,
        achieved: finalDecodeStreak,
      });
    }
  }

  if (policy.decodeMinPercent !== undefined) {
    if (decodePercent < policy.decodeMinPercent) {
      failureReasons.push({
        reason: "decode-percent-low",
        actual: decodePercent,
        required: policy.decodeMinPercent,
      });
    }
  }

  if (bucketThresholds !== undefined) {
    for (const [bucket, threshold] of Object.entries(bucketThresholds)) {
      const bucketScore = bucketScores[bucket];
      if (!bucketScore || bucketScore.total === 0) continue;
      const score = bucketScore.correct / bucketScore.total;
      if (score < threshold) {
        failureReasons.push({ reason: "bucket-weakness", bucket, score });
      }
    }
  }

  const passed = failureReasons.length === 0;

  return {
    lessonId,
    totalItems,
    correctItems,
    overallPercent,
    decodeItems,
    decodeCorrect,
    decodePercent,
    finalDecodeStreak,
    bucketScores,
    passed,
    failureReasons,
  };
}
