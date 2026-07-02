import { Router } from 'express';
import { z } from 'zod';
import type { Settings } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';
import { parseBody, wrap } from '../../lib/http';

const updateSchema = z.object({
  currency: z.string().length(3).optional(),
  budgetResetDay: z.number().int().min(1).max(28).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  maskAccountNumbers: z.boolean().optional(),
  biometricLock: z.boolean().optional(),
  autoDeleteRawUploads: z.boolean().optional(),
  usageAnalytics: z.boolean().optional(),
});

function toSettings(s: {
  currency: string;
  budgetResetDay: number;
  theme: string;
  maskAccountNumbers: boolean;
  biometricLock: boolean;
  autoDeleteRawUploads: boolean;
  usageAnalytics: boolean;
}): Settings {
  return {
    currency: s.currency,
    budgetResetDay: s.budgetResetDay,
    theme: s.theme as Settings['theme'],
    maskAccountNumbers: s.maskAccountNumbers,
    biometricLock: s.biometricLock,
    autoDeleteRawUploads: s.autoDeleteRawUploads,
    usageAnalytics: s.usageAnalytics,
  };
}

export const settingsRouter = Router();

settingsRouter.get(
  '/',
  wrap(async (req, res) => {
    const s =
      (await prisma.settings.findUnique({ where: { userId: req.userId } })) ??
      (await prisma.settings.create({ data: { userId: req.userId } }));
    res.json(toSettings(s));
  }),
);

settingsRouter.patch(
  '/',
  wrap(async (req, res) => {
    const body = parseBody(updateSchema, req.body);
    const s = await prisma.settings.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, ...body },
      update: body,
    });
    res.json(toSettings(s));
  }),
);
