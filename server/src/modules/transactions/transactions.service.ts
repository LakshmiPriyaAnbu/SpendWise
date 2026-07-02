import type { Transaction } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/http';
import { messages } from '../../lib/messages';
import { assertCategory } from '../../lib/guards';
import { isMonth, monthBounds, toTransaction } from '../../lib/serialize';

export interface TransactionInput {
  merchant: string;
  categoryId: string;
  date: string;
  paymentMethod: string;
  amount: number;
  notes?: string;
  lineItems?: { name: string; amount: number }[];
}

export interface ListFilters {
  month?: string;
  type?: string;
  q?: string;
}

export async function listTransactions(userId: string, filters: ListFilters): Promise<Transaction[]> {
  const where: Record<string, unknown> = { userId };
  if (filters.month && isMonth(filters.month)) {
    const { start, end } = monthBounds(filters.month);
    where.date = { gte: start, lt: end };
  }
  if (filters.type === 'income') where.amount = { gt: 0 };
  if (filters.type === 'expense') where.amount = { lt: 0 };
  if (filters.q?.trim()) where.merchant = { contains: filters.q.trim(), mode: 'insensitive' };
  const rows = await prisma.transaction.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return rows.map(toTransaction);
}

export async function createTransaction(userId: string, input: TransactionInput): Promise<Transaction> {
  await assertCategory(userId, input.categoryId);
  const tx = await prisma.transaction.create({
    data: {
      userId,
      merchant: input.merchant,
      categoryId: input.categoryId,
      date: new Date(`${input.date}T00:00:00Z`),
      paymentMethod: input.paymentMethod,
      amount: input.amount,
      notes: input.notes ?? null,
      lineItems: input.lineItems ?? undefined,
    },
  });
  return toTransaction(tx);
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: Partial<TransactionInput>,
): Promise<Transaction> {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', messages.transactions.notFound);
  if (input.categoryId) await assertCategory(userId, input.categoryId);
  const tx = await prisma.transaction.update({
    where: { id: existing.id },
    data: {
      merchant: input.merchant,
      categoryId: input.categoryId,
      date: input.date ? new Date(`${input.date}T00:00:00Z`) : undefined,
      paymentMethod: input.paymentMethod,
      amount: input.amount,
      notes: input.notes,
      lineItems: input.lineItems,
    },
  });
  return toTransaction(tx);
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', messages.transactions.notFound);
  await prisma.transaction.delete({ where: { id: existing.id } });
}
