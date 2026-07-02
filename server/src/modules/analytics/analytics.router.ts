import { Router } from 'express';
import { wrap } from '../../lib/http';
import { monthOrCurrent } from '../../lib/serialize';
import * as analyticsService from './analytics.service';

export const analyticsRouter = Router();

analyticsRouter.get(
  '/summary',
  wrap(async (req, res) => {
    const month = monthOrCurrent(req.query.month);
    res.json(await analyticsService.getSummary(req.userId, month));
  }),
);
