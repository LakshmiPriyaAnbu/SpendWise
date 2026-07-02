import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import type { ApiError, Category, ImportParseResult, ImportRow } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { MoneyPipe } from '../../core/money.pipe';
import { SwIcon } from '../../shared/ui/icon.component';
import { SwCategoryChip } from '../../shared/ui/category-chip.component';

type ImportStep = 'idle' | 'processing' | 'preview';

/** Minimum time the processing state stays on screen, for the visual effect. */
const MIN_PROCESS_MS = 1900;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

@Component({
  selector: 'sw-import-statement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SwIcon, SwCategoryChip, MoneyPipe],
  templateUrl: './import-statement.component.html',
  styleUrl: './import-statement.component.scss',
})
export class ImportStatementComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly step = signal<ImportStep>('idle');
  readonly result = signal<ImportParseResult | null>(null);
  readonly rows = signal<ImportRow[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly importing = signal(false);

  readonly categoryMap = computed(() => new Map(this.categories().map((c) => [c.id, c])));
  readonly includedRows = computed(() => this.rows().filter((r) => r.include));
  readonly includedCount = computed(() => this.includedRows().length);
  readonly duplicateCount = computed(() => this.rows().filter((r) => r.duplicate).length);
  readonly skippedDuplicates = computed(() => this.rows().filter((r) => r.duplicate && !r.include).length);

  constructor() {
    void this.loadCategories();
  }

  private async loadCategories(): Promise<void> {
    try {
      this.categories.set(await this.api.categories());
    } catch {
      // non-blocking; chips simply won't render until categories load
    }
  }

  openPicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    void this.startImport(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0] ?? null;
    void this.startImport(file);
  }

  async startImport(file: File | null): Promise<void> {
    this.step.set('processing');
    try {
      const [result] = await Promise.all([this.api.parseStatement(file), delay(MIN_PROCESS_MS)]);
      this.result.set(result);
      this.rows.set(result.rows.map((row) => ({ ...row })));
      this.step.set('preview');
    } catch (err) {
      this.toast.show(this.errorMessage(err));
      this.reset();
    }
  }

  toggleRow(index: number): void {
    this.rows.update((rows) => rows.map((row, i) => (i === index ? { ...row, include: !row.include } : row)));
  }

  reset(): void {
    this.result.set(null);
    this.rows.set([]);
    this.step.set('idle');
  }

  async confirm(): Promise<void> {
    const included = this.includedRows();
    if (!included.length || this.importing()) return;
    this.importing.set(true);
    try {
      await this.api.confirmImport({
        rows: included.map(({ date, description, categoryId, amount }) => ({
          date,
          description,
          categoryId,
          amount,
        })),
      });
      this.toast.show(`${included.length} transactions imported`);
      void this.router.navigateByUrl('/transactions');
    } catch (err) {
      this.toast.show(this.errorMessage(err));
    } finally {
      this.importing.set(false);
    }
  }

  private errorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const message = (err.error as ApiError | null)?.error?.message;
      if (message) return message;
    }
    return 'Something went wrong. Please try again.';
  }
}
