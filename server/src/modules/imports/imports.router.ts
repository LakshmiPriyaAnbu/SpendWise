import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import type { ImportConfirmResult, ImportParseResult, ImportRow } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';
import { HttpError, parseBody, wrap } from '../../lib/http';
import { isDuplicate } from '../../lib/duplicates';
import { suggestCategoryKey } from '../receipts/receipts.router';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/** Sample statement used when no file is uploaded ("Use a sample statement"). */
const SAMPLE_CSV = `date,description,amount
2026-07-01,UPI/SWIGGY BANGALORE,-420
2026-06-29,NETFLIX.COM,-649
2026-06-28,ACME CORP SALARY,120000
2026-06-27,APOLLO PHARMACY,-860
2026-06-26,AIRTEL POSTPAID,-999
2026-06-24,AMZN MKTP IN,-1499
2026-06-30,UBER INDIA,-280`;

export function parseCsv(text: string): { date: string; description: string; amount: number }[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new HttpError(400, 'BAD_CSV', 'Statement appears to be empty');
  const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const di = header.indexOf('date');
  const ci = header.findIndex((h) => h === 'description' || h === 'narration' || h === 'details');
  const ai = header.indexOf('amount');
  if (di < 0 || ci < 0 || ai < 0) {
    throw new HttpError(400, 'BAD_CSV', 'CSV must have date, description and amount columns');
  }
  return lines.slice(1).map((line, i) => {
    const cols = line.split(',');
    const date = cols[di]?.trim();
    const description = cols[ci]?.trim();
    const amountRupees = Number(cols[ai]?.trim().replace(/[₹,\s]/g, ''));
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !description || !Number.isFinite(amountRupees)) {
      throw new HttpError(400, 'BAD_CSV', `Could not parse row ${i + 2}`);
    }
    return { date, description, amount: Math.round(amountRupees * 100) };
  });
}

export const importsRouter = Router();

importsRouter.post(
  '/parse',
  upload.single('file'),
  wrap(async (req, res) => {
    const text = req.file ? req.file.buffer.toString('utf8') : SAMPLE_CSV;
    const parsed = parseCsv(text);

    const categories = await prisma.category.findMany({ where: { userId: req.userId } });
    const byKey = new Map(categories.map((c) => [c.key, c.id]));
    const otherId = byKey.get('other') ?? categories[0]?.id ?? '';

    const dates = parsed.map((r) => new Date(r.date).getTime());
    const windowStart = new Date(Math.min(...dates) - 10 * 86_400_000);
    const windowEnd = new Date(Math.max(...dates) + 10 * 86_400_000);
    const existing = await prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: windowStart, lte: windowEnd } },
      select: { merchant: true, amount: true, date: true },
    });

    const rows: ImportRow[] = parsed.map((r) => {
      const duplicate = !!isDuplicate({ merchant: r.description, amount: r.amount, date: r.date }, existing);
      return {
        date: r.date,
        description: r.description,
        categoryId: byKey.get(suggestCategoryKey(r.description)) ?? otherId,
        amount: r.amount,
        duplicate,
        include: !duplicate,
      };
    });

    const months = [...new Set(parsed.map((r) => r.date.slice(0, 7)))].sort();
    const body: ImportParseResult = {
      bank: 'HDFC Bank',
      maskedAccount: '••••4821',
      period: months.join(' – '),
      rows,
    };
    res.json(body);
  }),
);

const confirmSchema = z.object({
  rows: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        description: z.string().trim().min(1).max(200),
        categoryId: z.string().min(1),
        amount: z.number().int().refine((n) => n !== 0, 'amount must be non-zero'),
      }),
    )
    .max(500),
});

importsRouter.post(
  '/confirm',
  wrap(async (req, res) => {
    const body = parseBody(confirmSchema, req.body);
    const owned = await prisma.category.findMany({ where: { userId: req.userId }, select: { id: true } });
    const ownedIds = new Set(owned.map((c) => c.id));
    const bad = body.rows.find((r) => !ownedIds.has(r.categoryId));
    if (bad) throw new HttpError(400, 'BAD_CATEGORY', `Unknown category on row "${bad.description}"`);

    await prisma.transaction.createMany({
      data: body.rows.map((r) => ({
        userId: req.userId,
        merchant: r.description,
        categoryId: r.categoryId,
        date: new Date(`${r.date}T00:00:00Z`),
        paymentMethod: 'Bank import',
        amount: r.amount,
      })),
    });
    const result: ImportConfirmResult = { imported: body.rows.length };
    res.status(201).json(result);
  }),
);
