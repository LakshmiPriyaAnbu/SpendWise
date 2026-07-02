import { Router } from 'express';
import { z } from 'zod';
import { parseBody, wrap } from '../../lib/http';
import { monthOrCurrent } from '../../lib/serialize';
import * as budgetsService from './budgets.service';

const putSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  budgets: z.array(z.object({ categoryId: z.string().min(1), amount: z.number().int().min(0) })),
});

export const budgetsRouter = Router();

budgetsRouter.get(
  '/',
  wrap(async (req, res) => {
    const month = monthOrCurrent(req.query.month);
    res.json(await budgetsService.getBudgets(req.userId, month));
  }),
);

budgetsRouter.put(
  '/',
  wrap(async (req, res) => {
    const body = parseBody(putSchema, req.body);
    res.json(await budgetsService.putBudgets(req.userId, body));
  }),
);
