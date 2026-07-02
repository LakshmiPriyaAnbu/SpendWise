export interface TrendBar {
  label: string;
  expense: number;
  /** px */
  height: number;
  current: boolean;
}

export function computeTrendAvg(trend: ReadonlyArray<{ expense: number }>): number {
  if (trend.length === 0) return 0;
  return Math.round(trend.reduce((sum, t) => sum + t.expense, 0) / trend.length);
}

export function computeTrendBars(trend: ReadonlyArray<{ label: string; expense: number }>): TrendBar[] {
  const max = Math.max(1, ...trend.map((t) => t.expense));
  return trend.map((t, i) => ({
    label: t.label,
    expense: t.expense,
    height: Math.round((t.expense / max) * 130),
    current: i === trend.length - 1,
  }));
}

export function computeExpensePct(income: number, expense: number): number {
  if (income <= 0) return expense > 0 ? 100 : 0;
  return Math.min(100, Math.round((expense / income) * 100));
}

export function computeMerchantBars<T extends { spent: number }>(merchants: ReadonlyArray<T>): (T & { pct: number })[] {
  const max = Math.max(1, ...merchants.map((m) => m.spent));
  return merchants.map((m) => ({ ...m, pct: Math.round((m.spent / max) * 100) }));
}
