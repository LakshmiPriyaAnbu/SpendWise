import { Router } from 'express';
import { z } from 'zod';
import type { BudgetsResponse } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';
import { parseBody, wrap } from '../../lib/http';
import { currentMonth } from '../../lib/serialize';

const putSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  budgets: z.array(z.object({ categoryId: z.string().min(1), amount: z.number().int().min(0) })),
});

export const budgetsRouter = Router();

budgetsRouter.get(
  '/',
  wrap(async (req, res) => {
    const month = typeof req.query.month === 'string' && /^\d{4}-\d{2}$/.test(req.query.month)
      ? req.query.month
      : currentMonth();
    const rows = await prisma.budget.findMany({ where: { userId: req.userId, month } });
    const body: BudgetsResponse = {
      month,
      budgets: rows.map((b) => ({ categoryId: b.categoryId, amount: b.amount })),
    };
    res.json(body);
  }),
);

budgetsRouter.put(
  '/',
  wrap(async (req, res) => {
    const body = parseBody(putSchema, req.body);
    const owned = await prisma.category.findMany({ where: { userId: req.userId }, select: { id: true } });
    const ownedIds = new Set(owned.map((c) => c.id));
    const valid = body.budgets.filter((b) => ownedIds.has(b.categoryId));
    await prisma.$transaction(
      valid.map((b) =>
        prisma.budget.upsert({
          where: { userId_categoryId_month: { userId: req.userId, categoryId: b.categoryId, month: body.month } },
          create: { userId: req.userId, categoryId: b.categoryId, month: body.month, amount: b.amount },
          update: { amount: b.amount },
        }),
      ),
    );
    const rows = await prisma.budget.findMany({ where: { userId: req.userId, month: body.month } });
    const response: BudgetsResponse = {
      month: body.month,
      budgets: rows.map((b) => ({ categoryId: b.categoryId, amount: b.amount })),
    };
    res.json(response);
  }),
);
