import { Router } from 'express';
import type { AnalyticsSummary, BudgetStatus, BudgetUsage, CategoryBreakdown, TopMerchant, TrendPoint } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';
import { wrap } from '../../lib/http';
import { currentMonth, monthBounds, toCategory, toTransaction } from '../../lib/serialize';
import { computeInsights } from './insights';

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function budgetStatus(spent: number, budget: number): BudgetStatus {
  if (budget > 0 && spent > budget) return 'over';
  if (budget > 0 && spent / budget >= 0.85) return 'close';
  return 'on-track';
}

export const analyticsRouter = Router();

analyticsRouter.get(
  '/summary',
  wrap(async (req, res) => {
    const month = typeof req.query.month === 'string' && /^\d{4}-\d{2}$/.test(req.query.month)
      ? req.query.month
      : currentMonth();
    const prev = shiftMonth(month, -1);
    const { start, end } = monthBounds(month);
    const { start: prevStart } = monthBounds(prev);
    const { start: trendStart } = monthBounds(shiftMonth(month, -5));

    const [categories, monthTx, prevTx, budgets, allUpToEnd, trendTx] = await Promise.all([
      prisma.category.findMany({ where: { userId: req.userId } }),
      prisma.transaction.findMany({ where: { userId: req.userId, date: { gte: start, lt: end } }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] }),
      prisma.transaction.findMany({ where: { userId: req.userId, date: { gte: prevStart, lt: start } } }),
      prisma.budget.findMany({ where: { userId: req.userId, month } }),
      prisma.transaction.aggregate({ where: { userId: req.userId, date: { lt: end } }, _sum: { amount: true } }),
      prisma.transaction.findMany({ where: { userId: req.userId, date: { gte: trendStart, lt: end }, amount: { lt: 0 } }, select: { date: true, amount: true } }),
    ]);

    const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = -monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
    const prevIncome = prevTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const prevExpense = -prevTx.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);

    const spentByCat = new Map<string, number>();
    for (const t of monthTx) if (t.amount < 0) spentByCat.set(t.categoryId, (spentByCat.get(t.categoryId) ?? 0) - t.amount);
    const prevSpentByCat = new Map<string, number>();
    for (const t of prevTx) if (t.amount < 0) prevSpentByCat.set(t.categoryId, (prevSpentByCat.get(t.categoryId) ?? 0) - t.amount);
    const budgetByCat = new Map(budgets.map((b) => [b.categoryId, b.amount]));

    const breakdown: CategoryBreakdown[] = categories
      .map((c) => ({
        category: toCategory(c),
        spent: spentByCat.get(c.id) ?? 0,
        pct: expense > 0 ? Math.round(((spentByCat.get(c.id) ?? 0) / expense) * 100) : 0,
      }))
      .filter((b) => b.spent > 0)
      .sort((a, b) => b.spent - a.spent);

    const budgetUsage: BudgetUsage[] = categories
      .map((c) => {
        const spent = spentByCat.get(c.id) ?? 0;
        const budget = budgetByCat.get(c.id) ?? 0;
        return {
          category: toCategory(c),
          spent,
          budget,
          pct: budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0,
          status: budgetStatus(spent, budget),
        };
      })
      .filter((u) => u.budget > 0 || u.spent > 0)
      .sort((a, b) => b.spent - a.spent);

    const budgetTotal = budgets.reduce((s, b) => s + b.amount, 0);
    const overBudgetCount = budgetUsage.filter((u) => u.status === 'over').length;

    const trendMap = new Map<string, number>();
    for (const t of trendTx) {
      const key = t.date.toISOString().slice(0, 7);
      trendMap.set(key, (trendMap.get(key) ?? 0) - t.amount);
    }
    const trend: TrendPoint[] = Array.from({ length: 6 }, (_, i) => {
      const m = shiftMonth(month, i - 5);
      return { month: m, label: MONTH_LABELS[Number(m.slice(5)) - 1], expense: trendMap.get(m) ?? 0 };
    });

    const merchantMap = new Map<string, number>();
    for (const t of monthTx) if (t.amount < 0) merchantMap.set(t.merchant, (merchantMap.get(t.merchant) ?? 0) - t.amount);
    const topMerchants: TopMerchant[] = [...merchantMap.entries()]
      .map(([merchant, spent]) => ({ merchant, spent }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    const insights = computeInsights(
      categories.map((c) => ({
        name: c.name,
        spent: spentByCat.get(c.id) ?? 0,
        budget: budgetByCat.get(c.id) ?? 0,
        prevSpent: prevSpentByCat.get(c.id) ?? 0,
      })),
      { income, expense, prevIncome, prevExpense },
    );

    const body: AnalyticsSummary = {
      month,
      balance: allUpToEnd._sum.amount ?? 0,
      income,
      expense,
      savings: income - expense,
      budgetTotal,
      budgetLeft: Math.max(0, budgetTotal - expense),
      budgetPct: budgetTotal > 0 ? Math.min(100, Math.round((expense / budgetTotal) * 100)) : 0,
      overBudgetCount,
      breakdown,
      budgetUsage,
      trend,
      topMerchants,
      insights,
      recentTransactions: monthTx.slice(0, 6).map(toTransaction),
    };
    res.json(body);
  }),
);
