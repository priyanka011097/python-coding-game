/* =====================================================================
   readiness.ts — difficulty ladder and the "am I ready?" score. Pure.

   Readiness rewards acing HARD questions: each of the last few answers
   per topic contributes (score / 10) × (level / 10). A perfect answer at
   level 10 counts fully; a perfect answer at level 5 counts half. Missing
   answers count as zero, so readiness cannot be won with two lucky tries.
   ===================================================================== */

import type { HistoryItem, Level } from "./types";

export const WINDOW = 5;
export const READY_AT = 70;
const PASS = 7;
const FAIL = 3;

const clampLevel = (n: number): Level => Math.min(10, Math.max(1, Math.round(n))) as Level;

/** Score ≥ 7 climbs a level, ≤ 3 drops one, anything between holds. */
export function nextLevel(level: Level, score: number): Level {
  if (score >= PASS) return clampLevel(level + 1);
  if (score <= FAIL) return clampLevel(level - 1);
  return level;
}

export function topicReadiness(history: readonly HistoryItem[], topicId: string): number {
  const recent = history.filter((h) => h.question.topicId === topicId).slice(-WINDOW);
  const sum = recent.reduce(
    (n, h) => n + (h.evaluation.score / 10) * (h.question.level / 10),
    0,
  );
  return Math.round((sum / WINDOW) * 100);
}

export function overallReadiness(history: readonly HistoryItem[], topicIds: readonly string[]): number {
  if (topicIds.length === 0) return 0;
  const total = topicIds.reduce((n, id) => n + topicReadiness(history, id), 0);
  return Math.round(total / topicIds.length);
}

export function readinessLabel(pct: number): string {
  if (pct >= READY_AT) return "Interview ready";
  if (pct >= 40) return "Getting there";
  return "Not ready yet";
}
