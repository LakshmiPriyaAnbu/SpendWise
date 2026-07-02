import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import type { AnalyticsSummary, Category, Transaction } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { COPY } from '../../core/copy';
import { MoneyPipe } from '../../core/money.pipe';
import { MonthService } from '../../core/month.service';
import {
  computeExpensePct,
  computeMerchantBars,
  computeTrendAvg,
  computeTrendBars,
  type TrendBar,
} from '../../core/analytics.util';
import { SwDonutChart } from '../../shared/ui/donut-chart.component';
import { SwIcon } from '../../shared/ui/icon.component';

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
  protected readonly copy = COPY;

  readonly summary = signal<AnalyticsSummary | null>(null);
  private readonly monthTx = signal<Transaction[]>([]);
  private readonly categories = signal<Category[]>([]);

  readonly insightCards = computed(() => this.summary()?.insights.slice(0, 3) ?? []);

  readonly trendAvg = computed(() => computeTrendAvg(this.summary()?.trend ?? []));

  readonly trendBars = computed<TrendBar[]>(() => computeTrendBars(this.summary()?.trend ?? []));

  readonly segments = computed(
    () => this.summary()?.breakdown.map((b) => ({ color: b.category.color, pct: b.pct })) ?? [],
  );

  readonly expensePct = computed(() => {
    const s = this.summary();
    return s ? computeExpensePct(s.income, s.expense) : 0;
  });

  readonly merchantBars = computed(() => computeMerchantBars(this.summary()?.topMerchants ?? []));

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
