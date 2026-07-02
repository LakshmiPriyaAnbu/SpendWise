import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Category, TxType } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { MoneyPipe } from '../../core/money.pipe';
import { ToastService } from '../../core/toast.service';
import { SwIcon } from '../../shared/ui/icon.component';

const FALLBACK_CATEGORY: Category = {
  id: '',
  key: 'other',
  name: 'Other',
  color: '#8A9691',
  bg: '#f2f5f3',
  icon: 'other',
  isCustom: false,
};

function todayLocal(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

@Component({
  selector: 'sw-add-transaction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyPipe, RouterLink, SwIcon],
  templateUrl: './add-transaction.component.html',
  styleUrl: './add-transaction.component.scss',
})
export class AddTransactionComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly paymentMethods = ['UPI · GPay', 'UPI · PhonePe', 'Credit card', 'Debit card', 'Cash', 'Bank transfer'];

  // form state
  readonly type = signal<TxType>('expense');
  readonly amountText = signal('');
  readonly merchant = signal('');
  readonly date = signal(todayLocal());
  readonly selectedCategoryId = signal<string | null>(null);
  readonly paymentMethod = signal(this.paymentMethods[0]);
  readonly notes = signal('');

  // categories
  readonly categories = signal<Category[]>([]);
  readonly addingCat = signal(false);
  readonly newCatName = signal('');

  // live preview
  readonly previewCategory = computed(
    () => this.categories().find((c) => c.id === this.selectedCategoryId()) ?? FALLBACK_CATEGORY,
  );
  readonly previewPaise = computed(() => {
    const rupees = parseFloat(this.amountText());
    return Number.isFinite(rupees) && rupees > 0 ? Math.round(rupees * 100) : 0;
  });

  constructor() {
    this.api
      .categories()
      .then((cats) => this.categories.set(cats))
      .catch(() => {});
  }

  setType(type: TxType): void {
    this.type.set(type);
  }

  onAmount(event: Event): void {
    this.amountText.set((event.target as HTMLInputElement).value);
  }

  onMerchant(event: Event): void {
    this.merchant.set((event.target as HTMLInputElement).value);
  }

  onDate(event: Event): void {
    this.date.set((event.target as HTMLInputElement).value);
  }

  onPaymentMethod(event: Event): void {
    this.paymentMethod.set((event.target as HTMLSelectElement).value);
  }

  onNotes(event: Event): void {
    this.notes.set((event.target as HTMLInputElement).value);
  }

  selectCategory(id: string): void {
    this.selectedCategoryId.set(id);
  }

  startAddCategory(): void {
    this.addingCat.set(true);
    this.newCatName.set('');
  }

  cancelAddCategory(): void {
    this.addingCat.set(false);
  }

  onNewCatName(event: Event): void {
    this.newCatName.set((event.target as HTMLInputElement).value);
  }

  async addCategory(): Promise<void> {
    const name = this.newCatName().trim();
    if (!name) {
      this.toast.show('Enter a category name');
      return;
    }
    try {
      const created = await this.api.createCategory({ name });
      this.categories.update((cats) => [...cats, created]);
      this.selectedCategoryId.set(created.id);
      this.addingCat.set(false);
      this.toast.show('Category added');
    } catch {
      this.toast.show('Could not add category');
    }
  }

  async save(): Promise<void> {
    const rupees = parseFloat(this.amountText());
    if (!(rupees > 0)) {
      this.toast.show('Enter an amount greater than 0');
      return;
    }
    const merchant = this.merchant().trim();
    if (!merchant) {
      this.toast.show('Enter a merchant or source');
      return;
    }
    const categoryId = this.selectedCategoryId();
    if (!categoryId) {
      this.toast.show('Pick a category');
      return;
    }
    const paise = Math.round(rupees * 100);
    const amount = this.type() === 'expense' ? -paise : paise;
    try {
      await this.api.createTransaction({
        merchant,
        categoryId,
        date: this.date(),
        paymentMethod: this.paymentMethod(),
        amount,
        notes: this.notes().trim() || undefined,
      });
      this.toast.show('Transaction saved');
      this.router.navigateByUrl('/transactions');
    } catch {
      this.toast.show('Could not save transaction');
    }
  }
}
