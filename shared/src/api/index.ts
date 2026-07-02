import type {
  Budget,
  BudgetStatus,
  Category,
  Insight,
  ReceiptLineItem,
  Settings,
  Transaction,
  TxType,
  User,
} from '../models';

export const API_ROUTES = {
  health: '/api/health',
  auth: { register: '/api/auth/register', login: '/api/auth/login' },
  transactions: '/api/transactions',
  categories: '/api/categories',
  budgets: '/api/budgets',
  analyticsSummary: '/api/analytics/summary',
  receiptsScan: '/api/receipts/scan',
  importsParse: '/api/imports/parse',
  importsConfirm: '/api/imports/confirm',
  reportsSummary: '/api/reports/summary',
  reportsExport: '/api/reports/export',
  reportsHistory: '/api/reports/history',
  settings: '/api/settings',
} as const;

export interface ApiError {
  error: { code: string; message: string };
}

// ---- auth ----
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}
export interface AuthResponse {
  token: string;
  user: User;
}

// ---- transactions ----
export interface TxQuery {
  /** yyyy-mm */
  month?: string;
  type?: 'all' | TxType;
  q?: string;
}
export interface CreateTxRequest {
  merchant: string;
  categoryId: string;
  /** yyyy-mm-dd */
  date: string;
  paymentMethod: string;
  /** signed paise */
  amount: number;
  notes?: string;
  lineItems?: ReceiptLineItem[];
}
export type UpdateTxRequest = Partial<CreateTxRequest>;

// ---- categories ----
export interface CreateCategoryRequest {
  name: string;
}

// ---- budgets ----
export interface BudgetsResponse {
  month: string;
  budgets: Budget[];
}
export interface PutBudgetsRequest {
  month: string;
  budgets: Budget[];
}

// ---- analytics ----
export interface CategoryBreakdown {
  category: Category;
  /** paise, positive */
  spent: number;
  /** 0-100 */
  pct: number;
}
export interface BudgetUsage {
  category: Category;
  spent: number;
  budget: number;
  pct: number;
  status: BudgetStatus;
}
export interface TrendPoint {
  /** yyyy-mm */
  month: string;
  label: string;
  /** paise, positive */
  expense: number;
}
export interface TopMerchant {
  merchant: string;
  /** paise, positive */
  spent: number;
}
export interface AnalyticsSummary {
  month: string;
  balance: number;
  income: number;
  expense: number;
  savings: number;
  budgetTotal: number;
  budgetLeft: number;
  budgetPct: number;
  overBudgetCount: number;
  breakdown: CategoryBreakdown[];
  budgetUsage: BudgetUsage[];
  trend: TrendPoint[];
  topMerchants: TopMerchant[];
  insights: Insight[];
  recentTransactions: Transaction[];
}

// ---- receipts ----
export interface ScanResult {
  merchant: string;
  /** yyyy-mm-dd */
  date: string;
  /** paise, positive */
  total: number;
  lineItems: ReceiptLineItem[];
  suggestedCategoryId: string;
  /** 0-100 */
  confidence: number;
  duplicate: { merchant: string; date: string; amount: number } | null;
}

// ---- imports ----
export interface ImportRow {
  date: string;
  description: string;
  categoryId: string;
  /** signed paise */
  amount: number;
  duplicate: boolean;
  include: boolean;
}
export interface ImportParseResult {
  bank: string;
  maskedAccount: string;
  period: string;
  rows: ImportRow[];
}
export interface ImportConfirmRequest {
  rows: Pick<ImportRow, 'date' | 'description' | 'categoryId' | 'amount'>[];
}
export interface ImportConfirmResult {
  imported: number;
}

// ---- reports ----
export type ReportRange = 'this-month' | 'last-month' | 'last-3-months' | 'this-year';
export type ReportFormat = 'csv' | 'pdf';
export interface ReportSummary {
  range: ReportRange;
  income: number;
  expense: number;
  savings: number;
  transactionCount: number;
  topCategory: { name: string; spent: number } | null;
}
export interface ExportReportRequest {
  range: ReportRange;
  format: ReportFormat;
  include: string[];
}
export interface ReportHistoryItem {
  id: string;
  name: string;
  format: ReportFormat;
  createdAt: string;
  size: string;
}

// ---- settings ----
export type UpdateSettingsRequest = Partial<Settings>;
