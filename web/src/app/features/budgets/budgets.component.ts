import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import type { AnalyticsSummary, BudgetStatus } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { MonthService } from '../../core/month.service';
import { ToastService } from '../../core/toast.service';
import { MoneyPipe } from '../../core/money.pipe';
import { SwIcon } from '../../shared/ui/icon.component';
import { SwDonutChart, type DonutSegment } from '../../shared/ui/donut-chart.component';
import { SwProgressBar } from '../../shared/ui/progress-bar.component';
import { SwEmptyState } from '../../shared/ui/empty-state.component';

const CHIP_LABELS: Record<BudgetStatus, string> = {
  'on-track': 'On track',
  close: 'Close',
  over: 'Over',
};

const STATUS_COLORS: Record<BudgetStatus, string> = {
  'on-track': '#16a06a',
  close: '#d9822b',
  over: '#d9503f',
};

const BAR_COLORS: Record<BudgetStatus, string> = {
  'on-track': 'linear-gradient(90deg,#18b184,#0e7c66)',
  close: '#d9822b',
  over: '#d9503f',
};

@Component({
  selector: 'sw-budgets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyPipe, SwIcon, SwDonutChart, SwProgressBar, SwEmptyState],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.scss',
})
export class BudgetsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly monthSvc = inject(MonthService);

  readonly summary = signal<AnalyticsSummary | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  /** draft budget amounts in rupees, keyed by categoryId (edit mode) */
  readonly drafts = signal<Record<string, number>>({});

  readonly heroSegments = computed<DonutSegment[]>(() => {
    const s = this.summary();
    return [{ color: '#fff', pct: Math.min(100, s?.budgetPct ?? 0) }];
  });

  constructor() {
    effect(() => {
      const month = this.monthSvc.month();
      void this.load(month);
    });
  }

  private async load(month: string): Promise<void> {
    try {
      const s = await this.api.summary(month);
      // only apply if the selected month hasn't changed while loading
      if (this.monthSvc.month() === month) this.summary.set(s);
    } catch {
      this.toast.show('Could not load budgets');
    }
  }

  chipLabel(status: BudgetStatus): string {
    return CHIP_LABELS[status];
  }

  statusColor(status: BudgetStatus): string {
    return STATUS_COLORS[status];
  }

  barColor(status: BudgetStatus): string {
    return BAR_COLORS[status];
  }

  remaining(spent: number, budget: number): number {
    return budget - spent;
  }

  toggleEdit(): void {
    if (this.editing()) {
      this.editing.set(false);
      return;
    }
    const s = this.summary();
    if (!s) return;
    const drafts: Record<string, number> = {};
    for (const u of s.budgetUsage) drafts[u.category.id] = Math.round(u.budget / 100);
    this.drafts.set(drafts);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  updateDraft(categoryId: string, event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.drafts.update((d) => ({ ...d, [categoryId]: Number.isFinite(value) ? value : 0 }));
  }

  async save(): Promise<void> {
    const s = this.summary();
    if (!s || this.saving()) return;
    this.saving.set(true);
    const month = this.monthSvc.month();
    try {
      const drafts = this.drafts();
      const budgets = s.budgetUsage.map((u) => ({
        categoryId: u.category.id,
        amount: Math.max(0, Math.round((drafts[u.category.id] ?? u.budget / 100) * 100)),
      }));
      await this.api.putBudgets({ month, budgets });
      this.toast.show('Budgets updated');
      this.editing.set(false);
      await this.load(month);
    } catch {
      this.toast.show('Could not save budgets');
    } finally {
      this.saving.set(false);
    }
  }
}
