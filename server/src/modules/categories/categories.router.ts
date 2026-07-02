import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { HttpError, parseBody, wrap } from '../../lib/http';
import { toCategory } from '../../lib/serialize';
import { CUSTOM_PALETTE, tint } from './palette';

const createSchema = z.object({ name: z.string().trim().min(1).max(40) });

export const categoriesRouter = Router();

categoriesRouter.get(
  '/',
  wrap(async (req, res) => {
    const rows = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: [{ isCustom: 'asc' }, { name: 'asc' }],
    });
    res.json(rows.map(toCategory));
  }),
);

categoriesRouter.post(
  '/',
  wrap(async (req, res) => {
    const body = parseBody(createSchema, req.body);
    const customCount = await prisma.category.count({ where: { userId: req.userId, isCustom: true } });
    const color = CUSTOM_PALETTE[customCount % CUSTOM_PALETTE.length];
    const key = `custom-${body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${customCount + 1}`;
    const cat = await prisma.category.create({
      data: {
        userId: req.userId,
        key,
        name: body.name,
        color,
        bg: tint(color),
        icon: 'other',
        isCustom: true,
      },
    });
    res.status(201).json(toCategory(cat));
  }),
);

categoriesRouter.delete(
  '/:id',
  wrap(async (req, res) => {
    const cat = await prisma.category.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!cat) throw new HttpError(404, 'NOT_FOUND', 'Category not found');
    if (!cat.isCustom) throw new HttpError(400, 'NOT_CUSTOM', 'Default categories cannot be deleted');
    const other = await prisma.category.findFirst({ where: { userId: req.userId, key: 'other' } });
    if (!other) throw new HttpError(500, 'INTERNAL', 'Default category missing');
    await prisma.$transaction([
      prisma.transaction.updateMany({ where: { userId: req.userId, categoryId: cat.id }, data: { categoryId: other.id } }),
      prisma.category.delete({ where: { id: cat.id } }),
    ]);
    res.status(204).end();
  }),
);
