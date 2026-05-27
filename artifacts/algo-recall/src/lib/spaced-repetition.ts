export function calculateNextRevisionDate(
  lastRevisedDateStr: string,
  confidenceLevel: 1 | 2 | 3 | 4 | 5,
  revisionFrequency?: number
): string {
  const lastRevisedDate = new Date(lastRevisedDateStr);
  const nextDate = new Date(lastRevisedDate);

  if (revisionFrequency !== undefined && revisionFrequency > 0) {
    nextDate.setDate(nextDate.getDate() + revisionFrequency);
  } else {
    let daysToAdd = 0;
    switch (confidenceLevel) {
      case 1:
        daysToAdd = 1;
        break;
      case 2:
        daysToAdd = 3;
        break;
      case 3:
        daysToAdd = 7;
        break;
      case 4:
        daysToAdd = 14;
        break;
      case 5:
        daysToAdd = 30;
        break;
    }
    nextDate.setDate(nextDate.getDate() + daysToAdd);
  }

  return nextDate.toISOString().split("T")[0];
}

/**
 * Returns a 0-100 forget probability score.
 * Higher = more likely forgotten. Based on days since last revision vs the
 * expected interval, weighted by confidence level.
 */
export function getForgetProbability(
  lastRevisedDateStr: string,
  nextRevisionDateStr: string,
  confidenceLevel: 1 | 2 | 3 | 4 | 5
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastRevised = new Date(lastRevisedDateStr);
  lastRevised.setHours(0, 0, 0, 0);

  const nextRevision = new Date(nextRevisionDateStr);
  nextRevision.setHours(0, 0, 0, 0);

  const totalInterval = Math.max(
    1,
    (nextRevision.getTime() - lastRevised.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysSinceRevision =
    (today.getTime() - lastRevised.getTime()) / (1000 * 60 * 60 * 24);

  // Ebbinghaus-inspired decay: probability increases faster for low-confidence items
  const decayRate = 1.5 - confidenceLevel * 0.2; // 1.3 for conf=1, 0.5 for conf=5
  const rawDecay = Math.min(1, (daysSinceRevision / totalInterval) * decayRate);

  return Math.round(rawDecay * 100);
}

export function getRevisionStatus(nextRevisionDateStr: string): "Due" | "Due Soon" | "On Track" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextDate = new Date(nextRevisionDateStr);
  nextDate.setHours(0, 0, 0, 0);

  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "Due";
  } else if (diffDays <= 2) {
    return "Due Soon";
  } else {
    return "On Track";
  }
}
