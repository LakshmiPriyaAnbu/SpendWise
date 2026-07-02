import type { BudgetStatus } from '@spendwise/shared';
import { COPY } from './copy';

const LABEL_KEY: Record<BudgetStatus, keyof typeof COPY.budgets.status> = {
  'on-track': 'onTrack',
  close: 'close',
  over: 'over',
};

const STATUS_COLOR: Record<BudgetStatus, string> = {
  'on-track': 'var(--sw-success)',
  close: 'var(--sw-warn)',
  over: 'var(--sw-danger)',
};

const BAR_COLOR: Record<BudgetStatus, string> = {
  'on-track': 'var(--sw-gradient-h)',
  close: 'var(--sw-warn)',
  over: 'var(--sw-danger)',
};

export function budgetStatusLabel(status: BudgetStatus): string {
  return COPY.budgets.status[LABEL_KEY[status]];
}

export function budgetStatusColor(status: BudgetStatus): string {
  return STATUS_COLOR[status];
}

export function budgetBarColor(status: BudgetStatus): string {
  return BAR_COLOR[status];
}
