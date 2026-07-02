import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { Category, Transaction, TxType } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { MoneyPipe } from '../../core/money.pipe';
import { MonthService } from '../../core/month.service';
import { ToastService } from '../../core/toast.service';
import { SwCategoryChip } from '../../shared/ui/category-chip.component';
import { SwEmptyState } from '../../shared/ui/empty-state.component';
import { SwIcon } from '../../shared/ui/icon.component';
import { SwSegmentedTabs, type SegTab } from '../../shared/ui/segmented-tabs.component';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FALLBACK_CATEGORY: Category = {
  id: '',
  key: 'other',
  name: 'Other',
  color: '#8A9691',
  bg: '#f2f5f3',
  icon: 'other',
  isCustom: false,
};

@Component({
  selector: 'sw-transactions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyPipe, SwCategoryChip, SwEmptyState, SwIcon, SwSegmentedTabs],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  readonly month = inject(MonthService);

  readonly tabs: SegTab[] = [
    { id: 'all', label: 'All' },
    { id: 'income', label: 'Income' },
    { id: 'expense', label: 'Expenses' },
  ];

  readonly searchText = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  readonly tab = signal<'all' | TxType>('all');
  readonly transactions = signal<Transaction[]>([]);
  readonly categoryMap = signal<Map<string, Category>>(new Map());

  // inline editing
  readonly editingId = signal<string | null>(null);
  readonly editMerchant = signal('');
  readonly editAmount = signal('');

  /** debounced copy of searchText that drives reloads */
  private readonly query = signal(this.searchText().trim());
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.api
      .categories()
      .then((cats) => this.categoryMap.set(new Map(cats.map((c) => [c.id, c]))))
      .catch(() => {});

    effect(() => {
      const month = this.month.month();
      const type = this.tab();
      const q = this.query();
      this.load(month, type, q);
    });
  }

  private load(month: string, type: 'all' | TxType, q: string): void {
    this.api
      .transactions({ month, type, q: q || undefined })
      .then((list) => this.transactions.set(list))
      .catch(() => {});
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchText.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.query.set(value.trim()), 250);
  }

  setTab(id: string): void {
    this.tab.set(id as 'all' | TxType);
  }

  catFor(categoryId: string): Category {
    return this.categoryMap().get(categoryId) ?? FALLBACK_CATEGORY;
  }

  shortDate(iso: string): string {
    const [, m, d] = iso.split('-').map(Number);
    return `${MONTHS_SHORT[(m ?? 1) - 1]} ${d ?? 1}`;
  }

  startEdit(tx: Transaction): void {
    this.editingId.set(tx.id);
    this.editMerchant.set(tx.merchant);
    const rupees = Math.abs(tx.amount) / 100;
    this.editAmount.set(Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2));
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  onEditMerchant(event: Event): void {
    this.editMerchant.set((event.target as HTMLInputElement).value);
  }

  onEditAmount(event: Event): void {
    this.editAmount.set((event.target as HTMLInputElement).value);
  }

  async saveEdit(tx: Transaction): Promise<void> {
    const merchant = this.editMerchant().trim();
    const rupees = parseFloat(this.editAmount());
    if (!merchant) {
      this.toast.show('Merchant cannot be empty');
      return;
    }
    if (!(rupees > 0)) {
      this.toast.show('Enter a valid amount');
      return;
    }
    const paise = Math.round(rupees * 100);
    const amount = tx.amount < 0 ? -paise : paise;
    try {
      const updated = await this.api.updateTransaction(tx.id, { merchant, amount });
      this.transactions.update((list) => list.map((t) => (t.id === tx.id ? updated : t)));
      this.editingId.set(null);
      this.toast.show('Transaction updated');
    } catch {
      this.toast.show('Could not update transaction');
    }
  }

  async remove(tx: Transaction): Promise<void> {
    if (!confirm(`Delete "${tx.merchant}"? This can't be undone.`)) return;
    try {
      await this.api.deleteTransaction(tx.id);
      this.transactions.update((list) => list.filter((t) => t.id !== tx.id));
      this.toast.show('Transaction deleted');
    } catch {
      this.toast.show('Could not delete transaction');
    }
  }
}
