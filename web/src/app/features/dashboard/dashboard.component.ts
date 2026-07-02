import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AnalyticsSummary, BudgetUsage, Category, Insight } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { MoneyPipe } from '../../core/money.pipe';
import { MonthService } from '../../core/month.service';
import { SwDonutChart } from '../../shared/ui/donut-chart.component';
import { SwEmptyState } from '../../shared/ui/empty-state.component';
import { SwIcon } from '../../shared/ui/icon.component';
import { SwProgressBar } from '../../shared/ui/progress-bar.component';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FALLBACK_CAT = { name: 'Other', icon: 'other', color: '#8A9691', bg: '#f2f5f3' };

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

  readonly summary = signal<AnalyticsSummary | null>(null);
  private readonly catMap = signal<Map<string, Category>>(new Map());

  readonly quickActions: QuickAction[] = [
    { title: 'Add Expense', sub: 'Log it in seconds', icon: 'add', bg: 'var(--sw-success-bg)', color: 'var(--sw-primary)', link: '/add' },
    { title: 'Scan Receipt', sub: 'Auto-read totals', icon: 'camera', bg: '#e6eef6', color: '#2C6E9B', link: '/scan' },
    { title: 'Import Statement', sub: 'CSV from your bank', icon: 'cloud', bg: '#eae7fa', color: '#7568C4', link: '/import' },
    { title: 'View Report', sub: 'Monthly summary', icon: 'reports', bg: '#fbeee0', color: '#D98A2B', link: '/reports' },
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
          return { usage: u, label: `Over by ${this.money.transform(u.spent - u.budget, 'abs')}`, color: '#d9503f' };
        }
        if (u.status === 'close') {
          return { usage: u, label: 'Close', color: '#d9822b' };
        }
        return { usage: u, label: `${this.money.transform(u.budget - u.spent, 'abs')} left`, color: '#16a06a' };
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
    return this.catMap().get(categoryId) ?? FALLBACK_CAT;
  }

  fmtDate(iso: string): string {
    const [, m, d] = iso.split('-').map(Number);
    return `${MONTHS_SHORT[m - 1]} ${d}`;
  }
}
