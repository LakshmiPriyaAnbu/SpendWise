import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { ReportFormat, ReportHistoryItem, ReportRange, ReportSummary } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { MoneyPipe } from '../../core/money.pipe';
import { SwIcon } from '../../shared/ui/icon.component';

interface RangePreset {
  id: ReportRange;
  label: string;
}

interface FormatOption {
  id: ReportFormat;
  label: string;
  sub: string;
  icon: string;
}

@Component({
  selector: 'sw-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MoneyPipe, SwIcon],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly presets: RangePreset[] = [
    { id: 'this-month', label: 'This month' },
    { id: 'last-month', label: 'Last month' },
    { id: 'last-3-months', label: 'Last 3 months' },
    { id: 'this-year', label: 'This year' },
  ];

  readonly formats: FormatOption[] = [
    { id: 'pdf', label: 'PDF', sub: 'Formatted report', icon: 'reports' },
    { id: 'csv', label: 'CSV', sub: 'Raw spreadsheet', icon: 'download' },
  ];

  readonly includeOptions = ['Transaction list', 'Category summary', 'Budget vs actual', 'Charts & insights'];

  readonly range = signal<ReportRange>('this-month');
  readonly format = signal<ReportFormat>('pdf');
  readonly include = signal<ReadonlySet<string>>(
    new Set(['Transaction list', 'Category summary', 'Budget vs actual']),
  );
  readonly summary = signal<ReportSummary | null>(null);
  readonly history = signal<ReportHistoryItem[]>([]);
  readonly exporting = signal(false);

  readonly rangeLabel = computed(
    () => this.presets.find((p) => p.id === this.range())?.label ?? 'This month',
  );

  constructor() {
    effect(() => {
      const range = this.range();
      void this.loadSummary(range);
    });
    void this.loadHistory();
  }

  private async loadSummary(range: ReportRange): Promise<void> {
    try {
      const s = await this.api.reportSummary(range);
      if (this.range() === range) this.summary.set(s);
    } catch {
      this.toast.show('Could not load report summary');
    }
  }

  private async loadHistory(): Promise<void> {
    try {
      this.history.set(await this.api.reportHistory());
    } catch {
      // non-critical; leave list empty
    }
  }

  toggleInclude(item: string): void {
    this.include.update((set) => {
      const next = new Set(set);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  historyIcon(format: ReportFormat): string {
    return format === 'pdf' ? 'reports' : 'download';
  }

  historyRowClick(): void {
    this.toast.show('Saved to downloads history only');
  }

  async exportReport(): Promise<void> {
    if (this.exporting()) return;
    this.exporting.set(true);
    try {
      const format = this.format();
      const blob = await this.api.exportReport({
        range: this.range(),
        format,
        include: [...this.include()],
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SpendWise-report.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      this.toast.show('Report exported · check downloads');
      await this.loadHistory();
    } catch {
      this.toast.show('Export failed');
    } finally {
      this.exporting.set(false);
    }
  }
}
