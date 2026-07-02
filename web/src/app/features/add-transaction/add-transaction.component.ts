import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Category, TxType } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { FALLBACK_CATEGORY } from '../../core/category.util';
import { COPY } from '../../core/copy';
import { MoneyPipe } from '../../core/money.pipe';
import { parsePositiveRupees, toPaise } from '../../core/money.util';
import { ToastService } from '../../core/toast.service';
import { SwIcon } from '../../shared/ui/icon.component';

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

  protected readonly copy = COPY;

  readonly paymentMethods: readonly string[] = COPY.addTransaction.paymentMethods;

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
    const rupees = parsePositiveRupees(this.amountText());
    return rupees == null ? 0 : toPaise(rupees);
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
      this.toast.show(COPY.addTransaction.toasts.enterCategoryName);
      return;
    }
    try {
      const created = await this.api.createCategory({ name });
      this.categories.update((cats) => [...cats, created]);
      this.selectedCategoryId.set(created.id);
      this.addingCat.set(false);
      this.toast.show(COPY.addTransaction.toasts.categoryAdded);
    } catch {
      this.toast.show(COPY.addTransaction.toasts.couldNotAddCategory);
    }
  }

  async save(): Promise<void> {
    const rupees = parsePositiveRupees(this.amountText());
    if (rupees == null) {
      this.toast.show(COPY.addTransaction.toasts.enterAmount);
      return;
    }
    const merchant = this.merchant().trim();
    if (!merchant) {
      this.toast.show(COPY.addTransaction.toasts.enterMerchant);
      return;
    }
    const categoryId = this.selectedCategoryId();
    if (!categoryId) {
      this.toast.show(COPY.addTransaction.toasts.pickCategory);
      return;
    }
    const paise = toPaise(rupees);
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
      this.toast.show(COPY.addTransaction.toasts.transactionSaved);
      this.router.navigateByUrl('/transactions');
    } catch {
      this.toast.show(COPY.addTransaction.toasts.couldNotSave);
    }
  }
}
