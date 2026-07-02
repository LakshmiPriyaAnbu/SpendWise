import { Router } from 'express';
import { z } from 'zod';
import { parseBody, wrap } from '../../lib/http';
import { messages } from '../../lib/messages';
import * as transactionsService from './transactions.service';

const lineItemSchema = z.object({ name: z.string().min(1), amount: z.number().int().positive() });

const createSchema = z.object({
  merchant: z.string().trim().min(1).max(120),
  categoryId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.string().trim().min(1).max(60),
  amount: z
    .number()
    .int()
    .refine((n) => n !== 0, messages.validation.amountNonZero),
  notes: z.string().max(500).optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

const updateSchema = createSchema.partial();

export const transactionsRouter = Router();

transactionsRouter.get(
  '/',
  wrap(async (req, res) => {
    const { month, type, q } = req.query as { month?: string; type?: string; q?: string };
    res.json(await transactionsService.listTransactions(req.userId, { month, type, q }));
  }),
);

transactionsRouter.post(
  '/',
  wrap(async (req, res) => {
    const body = parseBody(createSchema, req.body);
    res.status(201).json(await transactionsService.createTransaction(req.userId, body));
  }),
);

transactionsRouter.patch(
  '/:id',
  wrap(async (req, res) => {
    const body = parseBody(updateSchema, req.body);
    res.json(await transactionsService.updateTransaction(req.userId, req.params.id, body));
  }),
);

transactionsRouter.delete(
  '/:id',
  wrap(async (req, res) => {
    await transactionsService.deleteTransaction(req.userId, req.params.id);
    res.status(204).end();
  }),
);
