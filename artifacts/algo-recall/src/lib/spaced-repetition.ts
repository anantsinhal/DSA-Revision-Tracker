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
