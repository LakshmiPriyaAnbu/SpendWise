import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import type { AnalyticsSummary, Category, Transaction } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { MoneyPipe } from '../../core/money.pipe';
import { MonthService } from '../../core/month.service';
import { SwDonutChart } from '../../shared/ui/donut-chart.component';
import { SwIcon } from '../../shared/ui/icon.component';

interface TrendBar {
  label: string;
  expense: number;
  /** px */
  height: number;
  current: boolean;
}

@Component({
  selector: 'sw-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyPipe, SwIcon, SwDonutChart],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent {
  private api = inject(ApiService);
  readonly monthSvc = inject(MonthService);

  readonly summary = signal<AnalyticsSummary | null>(null);
  private readonly monthTx = signal<Transaction[]>([]);
  private readonly categories = signal<Category[]>([]);

  readonly insightCards = computed(() => this.summary()?.insights.slice(0, 3) ?? []);

  readonly trendAvg = computed(() => {
    const trend = this.summary()?.trend ?? [];
    if (trend.length === 0) return 0;
    return Math.round(trend.reduce((sum, t) => sum + t.expense, 0) / trend.length);
  });

  readonly trendBars = computed<TrendBar[]>(() => {
    const trend = this.summary()?.trend ?? [];
    const max = Math.max(1, ...trend.map((t) => t.expense));
    return trend.map((t, i) => ({
      label: t.label,
      expense: t.expense,
      height: Math.round((t.expense / max) * 130),
      current: i === trend.length - 1,
    }));
  });

  readonly segments = computed(
    () => this.summary()?.breakdown.map((b) => ({ color: b.category.color, pct: b.pct })) ?? [],
  );

  readonly expensePct = computed(() => {
    const s = this.summary();
    if (!s || s.income <= 0) return s && s.expense > 0 ? 100 : 0;
    return Math.min(100, Math.round((s.expense / s.income) * 100));
  });

  readonly merchantBars = computed(() => {
    const merchants = this.summary()?.topMerchants ?? [];
    const max = Math.max(1, ...merchants.map((m) => m.spent));
    return merchants.map((m) => ({ ...m, pct: Math.round((m.spent / max) * 100) }));
  });

  private readonly subsCategory = computed(() => this.categories().find((c) => c.key === 'subs') ?? null);

  readonly subscriptions = computed(() => {
    const subsCat = this.subsCategory();
    if (!subsCat) return [];
    return this.monthTx().filter((t) => t.categoryId === subsCat.id);
  });

  readonly subsTotal = computed(() => this.subscriptions().reduce((sum, t) => sum + Math.abs(t.amount), 0));

  constructor() {
    effect(() => {
      const month = this.monthSvc.month();
      this.api.summary(month).then((s) => {
        if (this.monthSvc.month() === month) this.summary.set(s);
      });
      this.api.transactions({ month, type: 'expense' }).then((tx) => {
        if (this.monthSvc.month() === month) this.monthTx.set(tx);
      });
    });
    this.api.categories().then((cats) => this.categories.set(cats));
  }
}
