import { Injectable, computed, signal } from '@angular/core';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Selected month (yyyy-mm), shared by dashboard/budgets/analytics. */
@Injectable({ providedIn: 'root' })
export class MonthService {
  readonly month = signal(new Date().toISOString().slice(0, 7));

  readonly label = computed(() => {
    const [y, m] = this.month().split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${y}`;
  });

  shift(delta: number): void {
    const [y, m] = this.month().split('-').map(Number);
    this.month.set(new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7));
  }
}
