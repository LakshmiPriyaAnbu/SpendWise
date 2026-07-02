import { Router } from 'express';
import { z } from 'zod';
import { parseBody, wrap } from '../../lib/http';
import * as categoriesService from './categories.service';

const createSchema = z.object({ name: z.string().trim().min(1).max(40) });

export const categoriesRouter = Router();

categoriesRouter.get(
  '/',
  wrap(async (req, res) => {
    res.json(await categoriesService.listCategories(req.userId));
  }),
);

categoriesRouter.post(
  '/',
  wrap(async (req, res) => {
    const body = parseBody(createSchema, req.body);
    res.status(201).json(await categoriesService.createCategory(req.userId, body.name));
  }),
);

categoriesRouter.delete(
  '/:id',
  wrap(async (req, res) => {
    await categoriesService.deleteCategory(req.userId, req.params.id);
    res.status(204).end();
  }),
);
