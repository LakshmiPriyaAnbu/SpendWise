import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AnalyticsSummary, BudgetUsage, Category, Insight } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { budgetStatusColor } from '../../core/budget-status.util';
import { FALLBACK_CATEGORY } from '../../core/category.util';
import { COPY } from '../../core/copy';
import { shortDate } from '../../core/date.util';
import { MoneyPipe } from '../../core/money.pipe';
import { MonthService } from '../../core/month.service';
import { SwDonutChart } from '../../shared/ui/donut-chart.component';
import { SwEmptyState } from '../../shared/ui/empty-state.component';
import { SwIcon } from '../../shared/ui/icon.component';
import { SwProgressBar } from '../../shared/ui/progress-bar.component';

interface QuickAction {
  title: string;
  sub: string;
  icon: string;
  bg: string;
  color: string;
  link: string;
}

interface BudgetMiniRow {
  usage: BudgetUsage;
  label: string;
  color: string;
}

@Component({
  selector: 'sw-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MoneyPipe, SwIcon, SwDonutChart, SwProgressBar, SwEmptyState],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private money = new MoneyPipe();
  readonly monthSvc = inject(MonthService);

  protected readonly copy = COPY;
  protected readonly shortDate = shortDate;

  readonly summary = signal<AnalyticsSummary | null>(null);
  private readonly catMap = signal<Map<string, Category>>(new Map());

  readonly quickActions: QuickAction[] = [
    { ...COPY.dashboard.quickActions.addExpense, icon: 'add', bg: 'var(--sw-success-bg)', color: 'var(--sw-primary)', link: '/add' },
    { ...COPY.dashboard.quickActions.scanReceipt, icon: 'camera', bg: 'var(--sw-info-bg)', color: 'var(--sw-info)', link: '/scan' },
    { ...COPY.dashboard.quickActions.importStatement, icon: 'cloud', bg: 'var(--sw-purple-bg)', color: 'var(--sw-purple)', link: '/import' },
    { ...COPY.dashboard.quickActions.viewReport, icon: 'reports', bg: 'var(--sw-warn-bg-alt)', color: 'var(--sw-warn)', link: '/reports' },
  ];

  readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? 'there');

  readonly savedPct = computed(() => {
    const s = this.summary();
    if (!s || s.income <= 0) return 0;
    return Math.round((s.savings / s.income) * 100);
  });

  readonly segments = computed(
    () => this.summary()?.breakdown.map((b) => ({ color: b.category.color, pct: b.pct })) ?? [],
  );

  readonly topCats = computed(() => this.summary()?.breakdown.slice(0, 5) ?? []);

  readonly budgetMini = computed<BudgetMiniRow[]>(() => {
    const usage = this.summary()?.budgetUsage ?? [];
    return [...usage]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3)
      .map((u) => {
        if (u.status === 'over') {
          return {
            usage: u,
            label: `${COPY.budgets.overByPrefix} ${this.money.transform(u.spent - u.budget, 'abs')}`,
            color: budgetStatusColor(u.status),
          };
        }
        if (u.status === 'close') {
          return { usage: u, label: COPY.budgets.status.close, color: budgetStatusColor(u.status) };
        }
        return {
          usage: u,
          label: `${this.money.transform(u.budget - u.spent, 'abs')} ${COPY.budgets.leftSuffix}`,
          color: budgetStatusColor(u.status),
        };
      });
  });

  readonly insight = computed<Insight | null>(() => this.summary()?.insights[0] ?? null);

  constructor() {
    effect(() => {
      const month = this.monthSvc.month();
      this.api.summary(month).then((s) => {
        if (this.monthSvc.month() === month) this.summary.set(s);
      });
    });
    this.api.categories().then((cats) => this.catMap.set(new Map(cats.map((c) => [c.id, c]))));
  }

  catFor(categoryId: string): { name: string; icon: string; color: string; bg: string } {
    return this.catMap().get(categoryId) ?? FALLBACK_CATEGORY;
  }
}
