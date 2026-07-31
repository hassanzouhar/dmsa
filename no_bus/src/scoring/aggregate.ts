export type QuestionScore = { id: string; score: number; weight?: number };

export function aggregateDimension(questions: QuestionScore[]): number {
  if (!questions.length) return 0;
  const totals = questions.reduce(
    (acc, question) => {
      const weight = question.weight ?? 1;
      acc.weightedSum += question.score * weight;
      acc.weightTotal += weight;
      return acc;
    },
    { weightedSum: 0, weightTotal: 0 }
  );

  if (totals.weightTotal <= 0) return 0;
  return totals.weightedSum / totals.weightTotal;
}
