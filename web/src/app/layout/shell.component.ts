import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NavigationEnd } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { MonthService } from '../core/month.service';
import { SwIcon } from '../shared/ui/icon.component';
import { SwToast } from '../shared/ui/toast.component';
import { COPY } from '../core/copy';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: COPY.nav.dashboard, icon: 'dashboard' },
  { id: 'transactions', label: COPY.nav.transactions, icon: 'tx' },
  { id: 'add', label: COPY.nav.add, icon: 'add' },
  { id: 'scan', label: COPY.nav.scan, icon: 'scan' },
  { id: 'import', label: COPY.nav.import, icon: 'importf' },
  { id: 'budgets', label: COPY.nav.budgets, icon: 'budget' },
  { id: 'analytics', label: COPY.nav.analytics, icon: 'analytics' },
  { id: 'reports', label: COPY.nav.reports, icon: 'reports' },
  { id: 'settings', label: COPY.nav.settings, icon: 'settings' },
];

const TITLES: Record<string, { title: string; sub: string }> = {
  dashboard: { title: '', sub: COPY.shell.titles.dashboardSub },
  transactions: COPY.shell.titles.transactions,
  add: COPY.shell.titles.add,
  scan: COPY.shell.titles.scan,
  import: COPY.shell.titles.import,
  budgets: COPY.shell.titles.budgets,
  analytics: COPY.shell.titles.analytics,
  reports: COPY.shell.titles.reports,
  settings: COPY.shell.titles.settings,
};

@Component({
  selector: 'sw-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SwIcon, SwToast],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  auth = inject(AuthService);
  monthSvc = inject(MonthService);
  protected readonly copy = COPY;

  navItems = NAV_ITEMS;
  overBudgetCount = signal(0);

  private url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  screen = computed(() => this.url().split('?')[0].replace('/', '') || 'dashboard');
  pageTitle = computed(() => {
    const t = TITLES[this.screen()] ?? TITLES['dashboard'];
    const name = this.auth.user()?.name?.split(' ')[0] ?? 'there';
    return this.screen() === 'dashboard' ? { ...t, title: COPY.shell.greeting(name) } : t;
  });

  userInitial = computed(() => (this.auth.user()?.name ?? 'U').charAt(0).toUpperCase());

  constructor() {
    // refresh the Budgets badge when the selected month changes
    effect(() => {
      const month = this.monthSvc.month();
      this.api.summary(month).then((s) => this.overBudgetCount.set(s.overBudgetCount)).catch(() => {});
    });
  }

  onSearch(q: string): void {
    this.router.navigate(['/transactions'], { queryParams: q.trim() ? { q: q.trim() } : {} });
  }

  goAdd(): void {
    this.router.navigateByUrl('/add');
  }
}
