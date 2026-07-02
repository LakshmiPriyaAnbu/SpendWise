import type { ImportConfirmResult, ImportParseResult, ImportRow } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/http';
import { messages } from '../../lib/messages';
import { isDuplicate } from '../../lib/duplicates';
import { DAY_MS, DUPLICATE_WINDOW_DAYS, SAMPLE_STATEMENT_BANK, SAMPLE_STATEMENT_MASKED_ACCOUNT } from '../../lib/constants';
import { suggestCategoryKey } from '../receipts/receipts.service';

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
  if (lines.length < 2) throw new HttpError(400, 'BAD_CSV', messages.imports.emptyStatement);
  const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const di = header.indexOf('date');
  const ci = header.findIndex((h) => h === 'description' || h === 'narration' || h === 'details');
  const ai = header.indexOf('amount');
  if (di < 0 || ci < 0 || ai < 0) {
    throw new HttpError(400, 'BAD_CSV', messages.imports.missingColumns);
  }
  return lines.slice(1).map((line, i) => {
    const cols = line.split(',');
    const date = cols[di]?.trim();
    const description = cols[ci]?.trim();
    const amountRupees = Number(cols[ai]?.trim().replace(/[₹,\s]/g, ''));
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !description || !Number.isFinite(amountRupees)) {
      throw new HttpError(400, 'BAD_CSV', messages.imports.unparsableRow(i + 2));
    }
    return { date, description, amount: Math.round(amountRupees * 100) };
  });
}

export async function parseStatement(userId: string, text: string | undefined): Promise<ImportParseResult> {
  const parsed = parseCsv(text ?? SAMPLE_CSV);

  const categories = await prisma.category.findMany({ where: { userId } });
  const byKey = new Map(categories.map((c) => [c.key, c.id]));
  const otherId = byKey.get('other') ?? categories[0]?.id ?? '';

  const dates = parsed.map((r) => new Date(r.date).getTime());
  const windowStart = new Date(Math.min(...dates) - DUPLICATE_WINDOW_DAYS * DAY_MS);
  const windowEnd = new Date(Math.max(...dates) + DUPLICATE_WINDOW_DAYS * DAY_MS);
  const existing = await prisma.transaction.findMany({
    where: { userId, date: { gte: windowStart, lte: windowEnd } },
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
  return {
    bank: SAMPLE_STATEMENT_BANK,
    maskedAccount: SAMPLE_STATEMENT_MASKED_ACCOUNT,
    period: months.join(' – '),
    rows,
  };
}

export interface ConfirmRow {
  date: string;
  description: string;
  categoryId: string;
  amount: number;
}

export async function confirmImport(userId: string, rows: ConfirmRow[]): Promise<ImportConfirmResult> {
  const owned = await prisma.category.findMany({ where: { userId }, select: { id: true } });
  const ownedIds = new Set(owned.map((c) => c.id));
  const bad = rows.find((r) => !ownedIds.has(r.categoryId));
  if (bad) throw new HttpError(400, 'BAD_CATEGORY', messages.imports.unknownCategoryRow(bad.description));

  await prisma.transaction.createMany({
    data: rows.map((r) => ({
      userId,
      merchant: r.description,
      categoryId: r.categoryId,
      date: new Date(`${r.date}T00:00:00Z`),
      paymentMethod: 'Bank import',
      amount: r.amount,
    })),
  });
  return { imported: rows.length };
}
