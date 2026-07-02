import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  API_ROUTES,
  type AnalyticsSummary,
  type BudgetsResponse,
  type Category,
  type CreateCategoryRequest,
  type CreateTxRequest,
  type ExportReportRequest,
  type ImportConfirmRequest,
  type ImportConfirmResult,
  type ImportParseResult,
  type PutBudgetsRequest,
  type ReportHistoryItem,
  type ReportRange,
  type ReportSummary,
  type ScanResult,
  type Settings,
  type Transaction,
  type TxQuery,
  type UpdateSettingsRequest,
  type UpdateTxRequest,
} from '@spendwise/shared';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // transactions
  transactions(query: TxQuery = {}): Promise<Transaction[]> {
    const params: Record<string, string> = {};
    if (query.month) params['month'] = query.month;
    if (query.type && query.type !== 'all') params['type'] = query.type;
    if (query.q) params['q'] = query.q;
    return firstValueFrom(this.http.get<Transaction[]>(API_ROUTES.transactions, { params }));
  }
  createTransaction(body: CreateTxRequest): Promise<Transaction> {
    return firstValueFrom(this.http.post<Transaction>(API_ROUTES.transactions, body));
  }
  updateTransaction(id: string, body: UpdateTxRequest): Promise<Transaction> {
    return firstValueFrom(this.http.patch<Transaction>(`${API_ROUTES.transactions}/${id}`, body));
  }
  deleteTransaction(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_ROUTES.transactions}/${id}`));
  }

  // categories
  categories(): Promise<Category[]> {
    return firstValueFrom(this.http.get<Category[]>(API_ROUTES.categories));
  }
  createCategory(body: CreateCategoryRequest): Promise<Category> {
    return firstValueFrom(this.http.post<Category>(API_ROUTES.categories, body));
  }

  // budgets
  budgets(month: string): Promise<BudgetsResponse> {
    return firstValueFrom(this.http.get<BudgetsResponse>(API_ROUTES.budgets, { params: { month } }));
  }
  putBudgets(body: PutBudgetsRequest): Promise<BudgetsResponse> {
    return firstValueFrom(this.http.put<BudgetsResponse>(API_ROUTES.budgets, body));
  }

  // analytics
  summary(month: string): Promise<AnalyticsSummary> {
    return firstValueFrom(this.http.get<AnalyticsSummary>(API_ROUTES.analyticsSummary, { params: { month } }));
  }

  // receipts
  scanReceipt(file: File | null): Promise<ScanResult> {
    const form = new FormData();
    if (file) form.append('file', file);
    return firstValueFrom(this.http.post<ScanResult>(API_ROUTES.receiptsScan, form));
  }

  // imports
  parseStatement(file: File | null): Promise<ImportParseResult> {
    const form = new FormData();
    if (file) form.append('file', file);
    return firstValueFrom(this.http.post<ImportParseResult>(API_ROUTES.importsParse, form));
  }
  confirmImport(body: ImportConfirmRequest): Promise<ImportConfirmResult> {
    return firstValueFrom(this.http.post<ImportConfirmResult>(API_ROUTES.importsConfirm, body));
  }

  // reports
  reportSummary(range: ReportRange): Promise<ReportSummary> {
    return firstValueFrom(this.http.get<ReportSummary>(API_ROUTES.reportsSummary, { params: { range } }));
  }
  exportReport(body: ExportReportRequest): Promise<Blob> {
    return firstValueFrom(this.http.post(API_ROUTES.reportsExport, body, { responseType: 'blob' }));
  }
  reportHistory(): Promise<ReportHistoryItem[]> {
    return firstValueFrom(this.http.get<ReportHistoryItem[]>(API_ROUTES.reportsHistory));
  }

  // settings
  settings(): Promise<Settings> {
    return firstValueFrom(this.http.get<Settings>(API_ROUTES.settings));
  }
  updateSettings(body: UpdateSettingsRequest): Promise<Settings> {
    return firstValueFrom(this.http.patch<Settings>(API_ROUTES.settings, body));
  }
}
