import type { Category, ReceiptLineItem, Transaction } from '@spendwise/shared';
import type { Category as DbCategory, Transaction as DbTransaction } from '@prisma/client';

export function toCategory(c: DbCategory): Category {
  return { id: c.id, key: c.key, name: c.name, color: c.color, bg: c.bg, icon: c.icon, isCustom: c.isCustom };
}

export function toTransaction(t: DbTransaction): Transaction {
  return {
    id: t.id,
    merchant: t.merchant,
    categoryId: t.categoryId,
    date: t.date.toISOString().slice(0, 10),
    paymentMethod: t.paymentMethod,
    amount: t.amount,
    notes: t.notes,
    lineItems: (t.lineItems as unknown as ReceiptLineItem[] | null) ?? null,
  };
}

/** [startInclusive, endExclusive] UTC bounds for a yyyy-mm month string. */
export function monthBounds(month: string): { start: Date; end: Date } {
  const [y, m] = month.split('-').map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** True when the value is a valid yyyy-mm month string. */
export function isMonth(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value);
}

/** The value when it is a valid yyyy-mm month string, otherwise the current month. */
export function monthOrCurrent(value: unknown): string {
  return isMonth(value) ? value : currentMonth();
}
