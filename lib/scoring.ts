import { AssessmentSpec, Question, Answer, AnswerMap, DimensionScore } from '@/types/assessment';

/**
 * Score a checkboxes question
 * Returns normalized score (0-10) based on weighted selected options
 */
function scoreCheckboxes(q: Extract<Question, { type: 'checkboxes' }>, a: Answer): number {
  const ans = a as Extract<Answer, { type: 'checkboxes' }>;
  const total = q.options.reduce((s, o) => s + (o.weight ?? 1), 0);
  const selectedSum = q.options
    .filter(o => ans.selected.includes(o.id))
    .reduce((s, o) => s + (o.weight ?? 1), 0);
  
  // Check minimum selection requirement
  const minOk = q.minSelect ? ans.selected.length >= q.minSelect : true;
  const normalizedScore = minOk && total > 0 ? selectedSum / total : 0;
  return normalizedScore * 10; // Scale to 0-10
}

/**
 * Score a dual-checkboxes question
 * Returns normalized score (0-10) based on both checkbox states
 */
function scoreDualCheckboxes(q: Extract<Question, { type: 'dual-checkboxes' }>, a: Answer): number {
  const ans = a as Extract<Answer, { type: 'dual-checkboxes' }>;
  const lw = q.options.left.weight ?? 1;
  const rw = q.options.right.weight ?? 1;
  const max = lw + rw;
  const val = (ans.left ? lw : 0) + (ans.right ? rw : 0);
  const normalizedScore = max > 0 ? val / max : 0;
  return normalizedScore * 10; // Scale to 0-10
}

/**
 * Score a 0-5 scale question
 * Returns normalized score (0-10)
 */
function scoreScale05(q: Extract<Question, { type: 'scale-0-5' }>, a: Answer): number {
  const ans = a as Extract<Answer, { type: 'scale-0-5' }>;
  const value = Math.max(0, Math.min(5, ans.value));
  return (value / 5) * 10; // Scale to 0-10
}

/**
 * Score a tri-state question (Yes/Partial/No)
 * Returns normalized score (0-10)
 */
function scoreTriState(q: Extract<Question, { type: 'tri-state' }>, a: Answer): number {
  const ans = a as Extract<Answer, { type: 'tri-state' }>;
  const map = { yes: 1, partial: 0.5, no: 0 } as const;
  return map[ans.value] * 10; // Scale to 0-10
}

/**
 * Score a table-dual-checkboxes question
 * Returns normalized score (0-10) based on all row selections
 */
function scoreTableDualCheckboxes(q: Extract<Question, { type: 'table-dual-checkboxes' }>, a: Answer): number {
  const ans = a as Extract<Answer, { type: 'table-dual-checkboxes' }>;
  const lw = q.columns.left.weight ?? 1;
  const rw = q.columns.right.weight ?? 1;
  const maxPerRow = lw + rw;
  
  let totalPossible = q.rows.length * maxPerRow;
  let totalAchieved = 0;
  
  for (const row of q.rows) {
    const rowAnswer = ans.rows[row.id];
    if (rowAnswer) {
      totalAchieved += (rowAnswer.left ? lw : 0) + (rowAnswer.right ? rw : 0);
    }
  }
  
  const normalizedScore = totalPossible > 0 ? totalAchieved / totalPossible : 0;
  return normalizedScore * 10; // Scale to 0-10
}

/**
 * Score a scale-table question
 * Returns normalized score (0-10) based on average of all row scales
 */
function scoreScaleTable(q: Extract<Question, { type: 'scale-table' }>, a: Answer): number {
  const ans = a as Extract<Answer, { type: 'scale-table' }>;
  
  let totalScore = 0;
  let rowsAnswered = 0;
  
  for (const row of q.rows) {
    const rowValue = ans.rows[row.id];
    if (rowValue !== undefined) {
      totalScore += Math.max(0, Math.min(5, rowValue));
      rowsAnswered++;
    }
  }
  
  const averageScore = rowsAnswered > 0 ? totalScore / rowsAnswered : 0;
  return (averageScore / 5) * 10; // Scale to 0-10
}

/**
 * Score a tri-state-table question
 * Returns normalized score (0-10) based on average of all row tri-states
 */
function scoreTriStateTable(q: Extract<Question, { type: 'tri-state-table' }>, a: Answer): number {
  const ans = a as Extract<Answer, { type: 'tri-state-table' }>;
  const map = { yes: 1, partial: 0.5, no: 0 } as const;
  
  let totalScore = 0;
  let rowsAnswered = 0;
  
  for (const row of q.rows) {
    const rowValue = ans.rows[row.id];
    if (rowValue) {
      totalScore += map[rowValue];
      rowsAnswered++;
    }
  }
  
  const averageScore = rowsAnswered > 0 ? totalScore / rowsAnswered : 0;
  return averageScore * 10; // Scale to 0-10
}

/**
 * Score a single question based on its type
 * Returns normalized score (0-10)
 */
export function scoreQuestion(question: Question, answer: Answer): number {
  switch (question.type) {
    case 'checkboxes':
      return scoreCheckboxes(question as Extract<Question, { type: 'checkboxes' }>, answer);
    case 'dual-checkboxes':
      return scoreDualCheckboxes(question as Extract<Question, { type: 'dual-checkboxes' }>, answer);
    case 'scale-0-5':
      return scoreScale05(question as Extract<Question, { type: 'scale-0-5' }>, answer);
    case 'tri-state':
      return scoreTriState(question as Extract<Question, { type: 'tri-state' }>, answer);
    case 'table-dual-checkboxes':
      return scoreTableDualCheckboxes(question as Extract<Question, { type: 'table-dual-checkboxes' }>, answer);
    case 'scale-table':
      return scoreScaleTable(question as Extract<Question, { type: 'scale-table' }>, answer);
    case 'tri-state-table':
      return scoreTriStateTable(question as Extract<Question, { type: 'tri-state-table' }>, answer);
    default:
      return 0;
  }
}

/**
 * Compute dimension scores from answers
 * Returns array of dimension scores (0-100) with targets and gaps
 */
export function computeDimensionScores(spec: AssessmentSpec, answers: AnswerMap): DimensionScore[] {
  const byDimension: Record<string, { weightedSum: number; totalWeight: number }> = {};

  // Calculate weighted sums for each dimension
  for (const question of spec.questions) {
    const answer = answers[question.id];
    if (!answer) continue; // Skip unanswered questions

    const questionScore = scoreQuestion(question, answer); // This is now 0-10
    const questionWeight = question.weight ?? 1;

    if (!byDimension[question.dimensionId]) {
      byDimension[question.dimensionId] = { weightedSum: 0, totalWeight: 0 };
    }

    byDimension[question.dimensionId].weightedSum += questionScore * questionWeight;
    byDimension[question.dimensionId].totalWeight += questionWeight;
  }

  // Map dimensions to scores (0-100 scale)
  return spec.dimensions.map(dimension => {
    const aggregation = byDimension[dimension.id] ?? { weightedSum: 0, totalWeight: 0 };
    const avgQuestionScore = aggregation.totalWeight > 0 ? aggregation.weightedSum / aggregation.totalWeight : 0;
    const dimensionScore = (avgQuestionScore / 10) * 100; // Convert from 0-10 to 0-100
    const target = (dimension.targetLevel ?? 1) * 100; // Convert target to 0-100 scale
    const gap = Math.max(0, target - dimensionScore);

    return {
      id: dimension.id,
      score: dimensionScore,
      target: target,
      gap: gap,
      weight: dimension.weight ?? 1,
    };
  });
}

/**
 * Compute overall assessment score from dimension scores
 * Returns weighted average (0-100)
 */
export function computeOverallScore(dimensionScores: DimensionScore[]): number {
  const totalWeight = dimensionScores.reduce((sum, dim) => sum + dim.weight, 0) || 1;
  const weightedSum = dimensionScores.reduce((sum, dim) => sum + dim.score * dim.weight, 0);
  return weightedSum / totalWeight; // Dimension scores are already 0-100
}

/**
 * Calculate completion percentage for progress tracking
 * Returns percentage (0-100) of answered questions
 */
export function calculateProgress(spec: AssessmentSpec, answers: AnswerMap): number {
  const totalQuestions = spec.questions.length;
  const answeredQuestions = spec.questions.filter(q => answers[q.id]).length;
  return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
}

/**
 * Validate answers for required questions
 * Returns array of missing required question IDs
 */
export function validateAnswers(spec: AssessmentSpec, answers: AnswerMap): string[] {
  return spec.questions
    .filter(q => (q.required ?? true) && !answers[q.id])
    .map(q => q.id);
}