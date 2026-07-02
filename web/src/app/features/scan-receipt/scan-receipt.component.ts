import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import type { ApiError, ScanResult, Category } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { MoneyPipe } from '../../core/money.pipe';
import { SwIcon } from '../../shared/ui/icon.component';

type ScanStep = 'idle' | 'processing' | 'review';

/** Minimum time the scan animation stays on screen, for the visual effect. */
const MIN_SCAN_MS = 1900;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

@Component({
  selector: 'sw-scan-receipt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SwIcon, MoneyPipe],
  templateUrl: './scan-receipt.component.html',
  styleUrl: './scan-receipt.component.scss',
})
export class ScanReceiptComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly step = signal<ScanStep>('idle');
  readonly result = signal<ScanResult | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly saving = signal(false);

  // editable review fields
  readonly merchant = signal('');
  readonly date = signal('');
  readonly totalRupees = signal('');
  readonly categoryId = signal('');

  constructor() {
    void this.loadCategories();
  }

  private async loadCategories(): Promise<void> {
    try {
      this.categories.set(await this.api.categories());
    } catch {
      // categories are non-blocking; the select stays empty until retry
    }
  }

  openPicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    void this.startScan(file);
  }

  onPickerCancelled(): void {
    // backend mock works without a file — proceed anyway
    void this.startScan(null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0] ?? null;
    void this.startScan(file);
  }

  async startScan(file: File | null): Promise<void> {
    this.step.set('processing');
    try {
      const [result] = await Promise.all([this.api.scanReceipt(file), delay(MIN_SCAN_MS)]);
      this.result.set(result);
      this.merchant.set(result.merchant);
      this.date.set(result.date);
      this.totalRupees.set(this.paiseToRupees(result.total));
      this.categoryId.set(result.suggestedCategoryId);
      this.step.set('review');
    } catch (err) {
      this.toast.show(this.errorMessage(err));
      this.reset();
    }
  }

  reset(): void {
    this.result.set(null);
    this.step.set('idle');
  }

  async confirm(): Promise<void> {
    const result = this.result();
    if (!result || this.saving()) return;
    const rupees = Number.parseFloat(this.totalRupees());
    const totalPaise = Number.isFinite(rupees) ? Math.round(rupees * 100) : result.total;
    this.saving.set(true);
    try {
      await this.api.createTransaction({
        merchant: this.merchant().trim() || result.merchant,
        categoryId: this.categoryId() || result.suggestedCategoryId,
        date: this.date() || result.date,
        paymentMethod: 'Receipt scan',
        amount: -Math.abs(totalPaise),
        lineItems: result.lineItems,
      });
      this.toast.show('Receipt saved to transactions');
      void this.router.navigateByUrl('/transactions');
    } catch (err) {
      this.toast.show(this.errorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  onCategoryChange(event: Event): void {
    this.categoryId.set((event.target as HTMLSelectElement).value);
  }

  onMerchantInput(event: Event): void {
    this.merchant.set((event.target as HTMLInputElement).value);
  }

  onDateInput(event: Event): void {
    this.date.set((event.target as HTMLInputElement).value);
  }

  onTotalInput(event: Event): void {
    this.totalRupees.set((event.target as HTMLInputElement).value);
  }

  /** yyyy-mm-dd → "Jun 24" */
  shortDate(iso: string): string {
    const parsed = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return iso;
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private paiseToRupees(paise: number): string {
    const abs = Math.abs(paise);
    return abs % 100 ? (abs / 100).toFixed(2) : String(abs / 100);
  }

  private errorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const message = (err.error as ApiError | null)?.error?.message;
      if (message) return message;
    }
    return 'Something went wrong. Please try again.';
  }
}
