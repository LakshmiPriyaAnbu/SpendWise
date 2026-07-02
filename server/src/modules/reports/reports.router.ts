import { Router } from 'express';
import { z } from 'zod';
import { parseBody, wrap } from '../../lib/http';
import * as reportsService from './reports.service';

const rangeSchema = z.enum(['this-month', 'last-month', 'last-3-months', 'this-year']);

const exportSchema = z.object({
  range: rangeSchema,
  format: z.enum(['csv', 'pdf']),
  include: z.array(z.string()).default([]),
});

export const reportsRouter = Router();

reportsRouter.get(
  '/summary',
  wrap(async (req, res) => {
    const range = rangeSchema.catch('this-month').parse(req.query.range);
    res.json(await reportsService.getSummary(req.userId, range));
  }),
);

reportsRouter.post(
  '/export',
  wrap(async (req, res) => {
    const body = parseBody(exportSchema, req.body);
    const { name, file, contentType } = await reportsService.exportReport(req.userId, body);
    res.type(contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.send(file);
  }),
);

reportsRouter.get(
  '/history',
  wrap(async (req, res) => {
    res.json(await reportsService.getHistory(req.userId));
  }),
);
