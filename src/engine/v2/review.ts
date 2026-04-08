import type { EntityMastery } from "./mastery";

// ── Constants ──

const INTERVAL_LEVELS = [0, 1, 3, 7, 14, 30] as const;

// ── Helpers ──

function dateStringFromISO(iso: string): string {
  return iso.slice(0, 10);
}

function addDaysToToday(days: number, from?: string): string {
  const base = from ? new Date(from) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString();
}

function stateWeakness(state: EntityMastery["state"]): number {
  // Lower number = weaker = higher priority
  switch (state) {
    case "introduced": return 0;
    case "unstable":   return 1;
    case "accurate":   return 2;
    case "retained":   return 3;
    default:           return 4;
  }
}

function hasTwoConsecutiveFailures(attempts: EntityMastery["recentAttempts"]): boolean {
  if (attempts.length < 2) return false;
  const last = attempts[attempts.length - 1];
  const secondLast = attempts[attempts.length - 2];
  return !last.correct && !secondLast.correct;
}

// ── Public API ──

/**
 * Get all entities that are due for review today.
 * Only returns entities with nextReview set and nextReview <= today.
 * Excludes not_started entities.
 */
export function getDueEntities(
  allMastery: EntityMastery[],
  today: string,
): EntityMastery[] {
  return allMastery.filter((m) => {
    if (m.state === "not_started") return false;
    if (!m.nextReview) return false;
    return dateStringFromISO(m.nextReview) <= today;
  });
}

/**
 * Sort due entities by priority and cap at maxPerSession.
 * Priority: days overdue (desc) → state weakness (weakest first) → confusion pairs (desc)
 */
export function prioritizeForReview(
  due: EntityMastery[],
  maxPerSession: number,
): EntityMastery[] {
  const today = new Date().toISOString().slice(0, 10);

  const sorted = [...due].sort((a, b) => {
    // Days overdue descending
    const aDue = dateStringFromISO(a.nextReview);
    const bDue = dateStringFromISO(b.nextReview);
    const aDaysOverdue = aDue <= today ? (new Date(today).getTime() - new Date(aDue).getTime()) / 86400000 : 0;
    const bDaysOverdue = bDue <= today ? (new Date(today).getTime() - new Date(bDue).getTime()) / 86400000 : 0;
    if (bDaysOverdue !== aDaysOverdue) return bDaysOverdue - aDaysOverdue;

    // State weakness ascending (weaker = higher priority)
    const aWeak = stateWeakness(a.state);
    const bWeak = stateWeakness(b.state);
    if (aWeak !== bWeak) return aWeak - bWeak;

    // Confusion pairs descending
    return b.confusionPairs.length - a.confusionPairs.length;
  });

  return sorted.slice(0, maxPerSession);
}

/**
 * Advance interval after correct review answer.
 * Moves to the next level in INTERVAL_LEVELS; stays at 30 if already at max.
 */
export function advanceInterval(mastery: EntityMastery): EntityMastery {
  const currentIdx = INTERVAL_LEVELS.indexOf(mastery.intervalDays as (typeof INTERVAL_LEVELS)[number]);
  let newIntervalDays: number;

  if (currentIdx >= 0 && currentIdx < INTERVAL_LEVELS.length - 1) {
    newIntervalDays = INTERVAL_LEVELS[currentIdx + 1];
  } else {
    // Already at max or not a standard level — stay at 30
    newIntervalDays = 30;
  }

  return {
    ...mastery,
    intervalDays: newIntervalDays,
    nextReview: addDaysToToday(newIntervalDays),
  };
}

/**
 * Step back interval after incorrect review answer (graduated reset).
 * - introduced/unstable: reset to 1
 * - accurate: step back one level
 * - retained: step back two levels
 * - 2+ consecutive failures: full reset to 1 (takes priority)
 */
export function stepBackInterval(mastery: EntityMastery): EntityMastery {
  // Full reset takes priority over graduated demotion
  if (hasTwoConsecutiveFailures(mastery.recentAttempts)) {
    return {
      ...mastery,
      intervalDays: 1,
      nextReview: addDaysToToday(1),
    };
  }

  let intervalDays: number;
  const currentIdx = INTERVAL_LEVELS.indexOf(mastery.intervalDays as (typeof INTERVAL_LEVELS)[number]);

  switch (mastery.state) {
    case "not_started":
    case "introduced":
    case "unstable":
      intervalDays = 1;
      break;

    case "accurate": {
      // Step back one level
      if (currentIdx <= 0) {
        intervalDays = 1;
      } else {
        intervalDays = INTERVAL_LEVELS[Math.max(0, currentIdx - 1)];
      }
      break;
    }

    case "retained": {
      // Step back two levels
      if (currentIdx <= 0) {
        intervalDays = 1;
      } else {
        intervalDays = INTERVAL_LEVELS[Math.max(0, currentIdx - 2)];
      }
      break;
    }
  }

  return {
    ...mastery,
    intervalDays,
    nextReview: addDaysToToday(intervalDays),
  };
}
