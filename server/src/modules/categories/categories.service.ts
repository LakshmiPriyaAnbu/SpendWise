import type { Category } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/http';
import { messages } from '../../lib/messages';
import { toCategory } from '../../lib/serialize';
import { CUSTOM_PALETTE, tint } from './palette';

export async function listCategories(userId: string): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { userId },
    orderBy: [{ isCustom: 'asc' }, { name: 'asc' }],
  });
  return rows.map(toCategory);
}

export async function createCategory(userId: string, name: string): Promise<Category> {
  const customCount = await prisma.category.count({ where: { userId, isCustom: true } });
  const color = CUSTOM_PALETTE[customCount % CUSTOM_PALETTE.length];
  const key = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${customCount + 1}`;
  const cat = await prisma.category.create({
    data: {
      userId,
      key,
      name,
      color,
      bg: tint(color),
      icon: 'other',
      isCustom: true,
    },
  });
  return toCategory(cat);
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  const cat = await prisma.category.findFirst({ where: { id, userId } });
  if (!cat) throw new HttpError(404, 'NOT_FOUND', messages.categories.notFound);
  if (!cat.isCustom) throw new HttpError(400, 'NOT_CUSTOM', messages.categories.notCustom);
  const other = await prisma.category.findFirst({ where: { userId, key: 'other' } });
  if (!other) throw new HttpError(500, 'INTERNAL', messages.categories.defaultMissing);
  await prisma.$transaction([
    prisma.transaction.updateMany({ where: { userId, categoryId: cat.id }, data: { categoryId: other.id } }),
    prisma.category.delete({ where: { id: cat.id } }),
  ]);
}
