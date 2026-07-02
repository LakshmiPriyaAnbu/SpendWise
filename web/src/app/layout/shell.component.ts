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

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'transactions', label: 'Transactions', icon: 'tx' },
  { id: 'add', label: 'Add Transaction', icon: 'add' },
  { id: 'scan', label: 'Scan Receipt', icon: 'scan' },
  { id: 'import', label: 'Import Statement', icon: 'importf' },
  { id: 'budgets', label: 'Budgets', icon: 'budget' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const TITLES: Record<string, { title: string; sub: string }> = {
  dashboard: { title: 'Good morning, Lakshmi 👋', sub: 'Your money at a glance' },
  transactions: { title: 'Transactions', sub: 'Every rupee, accounted for' },
  add: { title: 'Add transaction', sub: 'Log an expense or income in seconds' },
  scan: { title: "Snap it, we'll do the typing", sub: 'Scan a receipt to auto-fill a transaction' },
  import: { title: 'Bring in your bank data securely', sub: 'Import a statement export from your bank' },
  budgets: { title: 'Budgets', sub: 'Keep every category on track' },
  analytics: { title: 'Analytics', sub: 'Where your money really goes' },
  reports: { title: 'Reports', sub: 'Export clean summaries of your finances' },
  settings: { title: 'Settings', sub: 'Profile, preferences and privacy' },
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
    return this.screen() === 'dashboard' ? { ...t, title: `Good morning, ${name} 👋` } : t;
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
