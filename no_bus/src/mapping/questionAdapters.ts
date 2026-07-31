export function scoreCheckboxes(
  selectedIds: string[] = [],
  options: { id: string; weight?: number }[] = []
): number {
  if (!options.length) return 0;
  const total = options.reduce((sum, option) => sum + (option.weight ?? 1), 0);
  if (total <= 0) return 0;

  const achieved = options.reduce((sum, option) => {
    if (!selectedIds.includes(option.id)) return sum;
    return sum + (option.weight ?? 1);
  }, 0);

  return (achieved / total) * 100;
}

export function scoreTableDualCheckboxes(
  rows: { id: string }[] = [],
  leftSelected: string[] = [],
  rightSelected: string[] = [],
  leftWeight = 1,
  rightWeight = 0.5
): number {
  if (!rows.length) return 0;
  const total = rows.length * (leftWeight + rightWeight);
  if (total <= 0) return 0;

  const achieved = rows.reduce((sum, row) => {
    const fromLeft = leftSelected.includes(row.id) ? leftWeight : 0;
    const fromRight = rightSelected.includes(row.id) ? rightWeight : 0;
    return sum + fromLeft + fromRight;
  }, 0);

  return (achieved / total) * 100;
}

export function scoreScaleTable(values: number[] = []): number {
  if (!values.length) return 0;
  const normalized = values.map(value => Math.max(0, Math.min(5, value)) / 5 * 100);
  const sum = normalized.reduce((total, value) => total + value, 0);
  return sum / normalized.length;
}

export function scoreTriStateTable(values: ('no' | 'partial' | 'yes')[] = []): number {
  if (!values.length) return 0;
  const map = { no: 0, partial: 0.5, yes: 1 } as const;
  const normalized = values.map(value => map[value] ?? 0);
  const sum = normalized.reduce<number>((total, value) => total + value, 0);
  return (sum / values.length) * 100;
}
