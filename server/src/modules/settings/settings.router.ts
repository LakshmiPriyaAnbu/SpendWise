import { Router } from 'express';
import { z } from 'zod';
import { parseBody, wrap } from '../../lib/http';
import * as settingsService from './settings.service';

const updateSchema = z.object({
  currency: z.string().length(3).optional(),
  budgetResetDay: z.number().int().min(1).max(28).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  maskAccountNumbers: z.boolean().optional(),
  biometricLock: z.boolean().optional(),
  autoDeleteRawUploads: z.boolean().optional(),
  usageAnalytics: z.boolean().optional(),
});

export const settingsRouter = Router();

settingsRouter.get(
  '/',
  wrap(async (req, res) => {
    res.json(await settingsService.getSettings(req.userId));
  }),
);

settingsRouter.patch(
  '/',
  wrap(async (req, res) => {
    const body = parseBody(updateSchema, req.body);
    res.json(await settingsService.updateSettings(req.userId, body));
  }),
);
