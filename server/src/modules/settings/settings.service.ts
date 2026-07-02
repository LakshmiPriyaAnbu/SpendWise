import type { Settings } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';

export type SettingsPatch = Partial<Settings>;

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

export async function getSettings(userId: string): Promise<Settings> {
  const s =
    (await prisma.settings.findUnique({ where: { userId } })) ??
    (await prisma.settings.create({ data: { userId } }));
  return toSettings(s);
}

export async function updateSettings(userId: string, patch: SettingsPatch): Promise<Settings> {
  const s = await prisma.settings.upsert({
    where: { userId },
    create: { userId, ...patch },
    update: patch,
  });
  return toSettings(s);
}
