import { Router } from 'express';
import multer from 'multer';
import type { ScanResult } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';
import { wrap } from '../../lib/http';
import { isDuplicate } from '../../lib/duplicates';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * Mock-OCR: we don't run a real OCR engine — the scan endpoint returns the
 * design prototype's sample extraction (Blue Tokai receipt) regardless of the
 * uploaded image, then runs REAL duplicate detection against the user's data.
 * Swap this for a real OCR provider later without changing the contract.
 */
const SAMPLE_EXTRACTION = {
  merchant: 'Blue Tokai Coffee',
  lineItems: [
    { name: 'Cappuccino ×2', amount: 360_00 },
    { name: 'Croissant', amount: 120_00 },
    { name: 'Cold brew', amount: 180_00 },
    { name: 'GST 5%', amount: 33_00 },
  ],
  total: 693_00,
};

const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/coffee|cafe|restaurant|swiggy|zomato|blinkit|pizza|food|kitchen|biryani|dhaba/i, 'food'],
  [/uber|ola|rapido|irctc|air india|indigo|flight|train|metro|fuel|petrol/i, 'travel'],
  [/amazon|flipkart|myntra|croma|ikea|mall|store|mart/i, 'shopping'],
  [/netflix|spotify|prime|hotstar|icloud|youtube|subscription/i, 'subs'],
  [/airtel|jio|vodafone|electricity|water|gas|bescom|broadband|bill/i, 'bills'],
  [/pharmacy|apollo|hospital|clinic|medical|1mg|practo/i, 'health'],
  [/rent|landlord/i, 'rent'],
];

export function suggestCategoryKey(merchant: string): string {
  for (const [pattern, key] of CATEGORY_KEYWORDS) if (pattern.test(merchant)) return key;
  return 'other';
}

export const receiptsRouter = Router();

receiptsRouter.post(
  '/scan',
  upload.single('file'),
  wrap(async (req, res) => {
    // date: "yesterday" relative to today, matching the prototype's sample
    const date = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const { merchant, lineItems, total } = SAMPLE_EXTRACTION;

    const suggestedKey = suggestCategoryKey(merchant);
    const category = await prisma.category.findFirst({
      where: { userId: req.userId, key: suggestedKey },
    });
    const fallback = category ?? (await prisma.category.findFirst({ where: { userId: req.userId } }));

    const windowStart = new Date(Date.now() - 40 * 86_400_000);
    const recent = await prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: windowStart } },
      select: { merchant: true, amount: true, date: true },
    });
    const dup = isDuplicate({ merchant, amount: -total, date }, recent);

    const body: ScanResult = {
      merchant,
      date,
      total,
      lineItems,
      suggestedCategoryId: fallback?.id ?? '',
      confidence: 98,
      duplicate: dup
        ? { merchant: dup.merchant, date: new Date(dup.date).toISOString().slice(0, 10), amount: dup.amount }
        : null,
    };
    res.json(body);
  }),
);
