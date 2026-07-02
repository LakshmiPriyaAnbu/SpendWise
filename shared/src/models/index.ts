/** All money amounts are signed integers in paise. Expense < 0, income > 0. */

export type TxType = 'income' | 'expense';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
}

export interface Category {
  id: string;
  key: string;
  name: string;
  color: string;
  /** tint background used for icon tiles/chips */
  bg: string;
  icon: string;
  isCustom: boolean;
}

export interface Transaction {
  id: string;
  merchant: string;
  categoryId: string;
  /** ISO date (yyyy-mm-dd) */
  date: string;
  paymentMethod: string;
  /** signed paise */
  amount: number;
  notes: string | null;
  lineItems: ReceiptLineItem[] | null;
}

export interface ReceiptLineItem {
  name: string;
  /** paise, positive */
  amount: number;
}

export interface Budget {
  categoryId: string;
  /** paise, positive; 0 = no budget set */
  amount: number;
}

export type BudgetStatus = 'on-track' | 'close' | 'over';

export interface Settings {
  currency: string;
  budgetResetDay: number;
  theme: 'light' | 'dark' | 'auto';
  maskAccountNumbers: boolean;
  biometricLock: boolean;
  autoDeleteRawUploads: boolean;
  usageAnalytics: boolean;
}

export type InsightTag = 'watch' | 'alert' | 'great';

export interface Insight {
  tag: InsightTag;
  title: string;
  description: string;
}
