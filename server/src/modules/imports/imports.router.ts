import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { parseBody, wrap } from '../../lib/http';
import { messages } from '../../lib/messages';
import * as importsService from './imports.service';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const importsRouter = Router();

importsRouter.post(
  '/parse',
  upload.single('file'),
  wrap(async (req, res) => {
    const text = req.file ? req.file.buffer.toString('utf8') : undefined;
    res.json(await importsService.parseStatement(req.userId, text));
  }),
);

const confirmSchema = z.object({
  rows: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        description: z.string().trim().min(1).max(200),
        categoryId: z.string().min(1),
        amount: z.number().int().refine((n) => n !== 0, messages.validation.amountNonZero),
      }),
    )
    .max(500),
});

importsRouter.post(
  '/confirm',
  wrap(async (req, res) => {
    const body = parseBody(confirmSchema, req.body);
    res.status(201).json(await importsService.confirmImport(req.userId, body.rows));
  }),
);
