import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { HttpError, parseBody, wrap } from '../../lib/http';
import { monthBounds, toTransaction } from '../../lib/serialize';

const lineItemSchema = z.object({ name: z.string().min(1), amount: z.number().int().positive() });

const createSchema = z.object({
  merchant: z.string().trim().min(1).max(120),
  categoryId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.string().trim().min(1).max(60),
  amount: z
    .number()
    .int()
    .refine((n) => n !== 0, 'amount must be non-zero'),
  notes: z.string().max(500).optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

const updateSchema = createSchema.partial();

async function assertCategory(userId: string, categoryId: string) {
  const cat = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!cat) throw new HttpError(400, 'BAD_CATEGORY', 'Unknown category');
}

export const transactionsRouter = Router();

transactionsRouter.get(
  '/',
  wrap(async (req, res) => {
    const { month, type, q } = req.query as { month?: string; type?: string; q?: string };
    const where: Record<string, unknown> = { userId: req.userId };
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const { start, end } = monthBounds(month);
      where.date = { gte: start, lt: end };
    }
    if (type === 'income') where.amount = { gt: 0 };
    if (type === 'expense') where.amount = { lt: 0 };
    if (q?.trim()) where.merchant = { contains: q.trim(), mode: 'insensitive' };
    const rows = await prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(rows.map(toTransaction));
  }),
);

transactionsRouter.post(
  '/',
  wrap(async (req, res) => {
    const body = parseBody(createSchema, req.body);
    await assertCategory(req.userId, body.categoryId);
    const tx = await prisma.transaction.create({
      data: {
        userId: req.userId,
        merchant: body.merchant,
        categoryId: body.categoryId,
        date: new Date(`${body.date}T00:00:00Z`),
        paymentMethod: body.paymentMethod,
        amount: body.amount,
        notes: body.notes ?? null,
        lineItems: body.lineItems ?? undefined,
      },
    });
    res.status(201).json(toTransaction(tx));
  }),
);

transactionsRouter.patch(
  '/:id',
  wrap(async (req, res) => {
    const body = parseBody(updateSchema, req.body);
    const existing = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Transaction not found');
    if (body.categoryId) await assertCategory(req.userId, body.categoryId);
    const tx = await prisma.transaction.update({
      where: { id: existing.id },
      data: {
        merchant: body.merchant,
        categoryId: body.categoryId,
        date: body.date ? new Date(`${body.date}T00:00:00Z`) : undefined,
        paymentMethod: body.paymentMethod,
        amount: body.amount,
        notes: body.notes,
        lineItems: body.lineItems,
      },
    });
    res.json(toTransaction(tx));
  }),
);

transactionsRouter.delete(
  '/:id',
  wrap(async (req, res) => {
    const existing = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Transaction not found');
    await prisma.transaction.delete({ where: { id: existing.id } });
    res.status(204).end();
  }),
);
