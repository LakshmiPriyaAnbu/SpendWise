import type { BudgetsResponse } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';

export interface BudgetsInput {
  month: string;
  budgets: { categoryId: string; amount: number }[];
}

export async function getBudgets(userId: string, month: string): Promise<BudgetsResponse> {
  const rows = await prisma.budget.findMany({ where: { userId, month } });
  return {
    month,
    budgets: rows.map((b) => ({ categoryId: b.categoryId, amount: b.amount })),
  };
}

export async function putBudgets(userId: string, input: BudgetsInput): Promise<BudgetsResponse> {
  const owned = await prisma.category.findMany({ where: { userId }, select: { id: true } });
  const ownedIds = new Set(owned.map((c) => c.id));
  const valid = input.budgets.filter((b) => ownedIds.has(b.categoryId));
  await prisma.$transaction(
    valid.map((b) =>
      prisma.budget.upsert({
        where: { userId_categoryId_month: { userId, categoryId: b.categoryId, month: input.month } },
        create: { userId, categoryId: b.categoryId, month: input.month, amount: b.amount },
        update: { amount: b.amount },
      }),
    ),
  );
  return getBudgets(userId, input.month);
}
