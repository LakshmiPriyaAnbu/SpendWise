import { Router } from 'express';
import { z } from 'zod';
import type { ReportHistoryItem, ReportRange, ReportSummary } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';
import { parseBody, wrap } from '../../lib/http';
import { monthBounds, currentMonth } from '../../lib/serialize';

function rangeBounds(range: ReportRange): { start: Date; end: Date; label: string } {
  const now = currentMonth();
  const [y, m] = now.split('-').map(Number);
  switch (range) {
    case 'this-month': {
      const { start, end } = monthBounds(now);
      return { start, end, label: now };
    }
    case 'last-month': {
      const prev = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
      const { start, end } = monthBounds(prev);
      return { start, end, label: prev };
    }
    case 'last-3-months': {
      const from = new Date(Date.UTC(y, m - 3, 1));
      const { end } = monthBounds(now);
      return { start: from, end, label: 'last-3-months' };
    }
    case 'this-year': {
      return { start: new Date(Date.UTC(y, 0, 1)), end: new Date(Date.UTC(y + 1, 0, 1)), label: String(y) };
    }
  }
}

const rangeSchema = z.enum(['this-month', 'last-month', 'last-3-months', 'this-year']);

export const reportsRouter = Router();

reportsRouter.get(
  '/summary',
  wrap(async (req, res) => {
    const range = rangeSchema.catch('this-month').parse(req.query.range);
    const { start, end } = rangeBounds(range);
    const tx = await prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: start, lt: end } },
      include: { category: true },
    });
    const income = tx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = -tx.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
    const byCat = new Map<string, number>();
    for (const t of tx) if (t.amount < 0) byCat.set(t.category.name, (byCat.get(t.category.name) ?? 0) - t.amount);
    const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
    const body: ReportSummary = {
      range,
      income,
      expense,
      savings: income - expense,
      transactionCount: tx.length,
      topCategory: top ? { name: top[0], spent: top[1] } : null,
    };
    res.json(body);
  }),
);

const exportSchema = z.object({
  range: rangeSchema,
  format: z.enum(['csv', 'pdf']),
  include: z.array(z.string()).default([]),
});

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Minimal single-page PDF with monospaced text lines — no external deps. */
function textToPdf(lines: string[]): Buffer {
  const content = [
    'BT /F1 10 Tf 40 800 Td 14 TL',
    ...lines.slice(0, 54).map((l) => `(${l.replace(/[\\()]/g, (c) => '\\' + c)}) Tj T*`),
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

reportsRouter.post(
  '/export',
  wrap(async (req, res) => {
    const body = parseBody(exportSchema, req.body);
    const { start, end, label } = rangeBounds(body.range);
    const tx = await prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: start, lt: end } },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    const name = `SpendWise-${label}.${body.format}`;
    let file: Buffer;
    if (body.format === 'csv') {
      const rows = [
        'date,merchant,category,payment_method,amount_inr',
        ...tx.map((t) =>
          [
            t.date.toISOString().slice(0, 10),
            csvEscape(t.merchant),
            csvEscape(t.category.name),
            csvEscape(t.paymentMethod),
            (t.amount / 100).toFixed(2),
          ].join(','),
        ),
      ];
      file = Buffer.from(rows.join('\n'), 'utf8');
      res.type('text/csv');
    } else {
      const income = tx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expense = -tx.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
      const lines = [
        `SpendWise report — ${label}`,
        `Income: INR ${(income / 100).toFixed(2)}   Expenses: INR ${(expense / 100).toFixed(2)}   Net: INR ${((income - expense) / 100).toFixed(2)}`,
        `${tx.length} transactions`,
        '',
        ...tx.map(
          (t) =>
            `${t.date.toISOString().slice(0, 10)}  ${t.merchant.slice(0, 34).padEnd(36)} ${t.category.name.slice(0, 16).padEnd(18)} ${(t.amount / 100).toFixed(2).padStart(12)}`,
        ),
      ];
      file = textToPdf(lines);
      res.type('application/pdf');
    }

    const size = file.length >= 1024 ? `${Math.round(file.length / 1024)} KB` : `${file.length} B`;
    await prisma.reportExport.create({
      data: { userId: req.userId, name, format: body.format, size },
    });

    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.send(file);
  }),
);

reportsRouter.get(
  '/history',
  wrap(async (req, res) => {
    const rows = await prisma.reportExport.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const body: ReportHistoryItem[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      format: r.format as ReportHistoryItem['format'],
      createdAt: r.createdAt.toISOString(),
      size: r.size,
    }));
    res.json(body);
  }),
);
