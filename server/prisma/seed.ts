import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// The design spec's fixed category palette (spendwise-design skill)
const CATEGORIES = [
  { key: 'food', name: 'Food & Dining', color: '#0E7C66', icon: 'food', budget: 20000_00 },
  { key: 'rent', name: 'Rent', color: '#2C6E9B', icon: 'rent', budget: 28000_00 },
  { key: 'shopping', name: 'Shopping', color: '#B0679E', icon: 'shopping', budget: 8000_00 },
  { key: 'travel', name: 'Travel', color: '#2F9C8F', icon: 'travel', budget: 8000_00 },
  { key: 'bills', name: 'Bills & Utilities', color: '#D98A2B', icon: 'bills', budget: 6000_00 },
  { key: 'subs', name: 'Subscriptions', color: '#7568C4', icon: 'subs', budget: 3000_00 },
  { key: 'health', name: 'Health', color: '#D26A57', icon: 'health', budget: 5000_00 },
  { key: 'other', name: 'Other', color: '#8A9691', icon: 'other', budget: 7000_00 },
];

export function tint(hex: string): string {
  // 12% opacity tint of the category color over white, as a hex color
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(255 - (255 - c) * 0.12);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// July 2026 transactions from the design spec's txData(), amounts in paise
const JULY_TX = [
  { merchant: 'Swiggy', cat: 'food', date: '2026-07-01', method: 'UPI · GPay', amount: -420_00 },
  { merchant: 'Croma Electronics', cat: 'shopping', date: '2026-06-30', method: 'Credit card', amount: -2340_00 },
  { merchant: 'Uber', cat: 'travel', date: '2026-06-30', method: 'UPI · GPay', amount: -280_00 },
  { merchant: 'Netflix', cat: 'subs', date: '2026-06-29', method: 'Credit card', amount: -649_00 },
  { merchant: 'Acme Corp — Salary', cat: 'other', date: '2026-06-28', method: 'Bank transfer', amount: 120000_00 },
  { merchant: 'Apollo Pharmacy', cat: 'health', date: '2026-06-27', method: 'Debit card', amount: -860_00 },
  { merchant: 'Airtel Postpaid', cat: 'bills', date: '2026-06-26', method: 'UPI · GPay', amount: -999_00 },
  { merchant: 'Zomato', cat: 'food', date: '2026-06-25', method: 'UPI · GPay', amount: -560_00 },
  { merchant: 'Amazon', cat: 'shopping', date: '2026-06-24', method: 'Credit card', amount: -1499_00 },
  { merchant: 'Landlord — Rent', cat: 'rent', date: '2026-07-01', method: 'Bank transfer', amount: -28000_00 },
  { merchant: 'Blinkit', cat: 'food', date: '2026-06-23', method: 'UPI · GPay', amount: -380_00 },
  { merchant: 'Spotify', cat: 'subs', date: '2026-06-22', method: 'Credit card', amount: -119_00 },
];

// Prior months for the 6-month trend (Feb–Jun 2026): synthesize per-category spends
// so monthly expense totals roughly match the spec's trend chart.
const PRIOR_MONTHS: { month: string; spends: Record<string, number> }[] = [
  { month: '2026-02', spends: { rent: 28000_00, food: 14200_00, shopping: 6800_00, travel: 5100_00, bills: 5400_00, subs: 2100_00, health: 2600_00, other: 3800_00 } },
  { month: '2026-03', spends: { rent: 28000_00, food: 15100_00, shopping: 7300_00, travel: 6900_00, bills: 5500_00, subs: 2450_00, health: 1900_00, other: 4100_00 } },
  { month: '2026-04', spends: { rent: 28000_00, food: 13800_00, shopping: 5900_00, travel: 4700_00, bills: 5600_00, subs: 2450_00, health: 3400_00, other: 3600_00 } },
  { month: '2026-05', spends: { rent: 28000_00, food: 16400_00, shopping: 8600_00, travel: 7800_00, bills: 5700_00, subs: 2450_00, health: 2200_00, other: 4400_00 } },
  { month: '2026-06', spends: { rent: 28000_00, food: 14700_00, shopping: 7900_00, travel: 6100_00, bills: 5600_00, subs: 2450_00, health: 4200_00, other: 3900_00 } },
];

const MERCHANT_BY_CAT: Record<string, string> = {
  food: 'Swiggy', rent: 'Landlord — Rent', shopping: 'Amazon', travel: 'Uber',
  bills: 'Airtel Postpaid', subs: 'Netflix', health: 'Apollo Pharmacy', other: 'Miscellaneous',
};

async function main() {
  const email = 'lakshmi@email.com';
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      name: 'Lakshmi Priya',
      email,
      passwordHash: await bcrypt.hash('spendwise123', 10),
      settings: { create: {} },
    },
  });

  const catByKey: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.create({
      data: { userId: user.id, key: c.key, name: c.name, color: c.color, bg: tint(c.color), icon: c.icon },
    });
    catByKey[c.key] = cat.id;
  }

  // Budgets for every month Feb–Jul 2026
  const months = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];
  for (const month of months) {
    for (const c of CATEGORIES) {
      await prisma.budget.create({
        data: { userId: user.id, categoryId: catByKey[c.key], month, amount: c.budget },
      });
    }
  }

  // July 2026 transactions (spec dates span late June in the mock; normalize into July
  // so the July dashboard matches — keep day-of-month, force month to July)
  for (const t of JULY_TX) {
    const day = t.date.slice(8);
    await prisma.transaction.create({
      data: {
        userId: user.id,
        merchant: t.merchant,
        categoryId: catByKey[t.cat],
        date: new Date(`2026-07-${day}T00:00:00Z`),
        paymentMethod: t.method,
        amount: t.amount,
      },
    });
  }

  // Salary for each prior month + synthesized category spends
  for (const pm of PRIOR_MONTHS) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        merchant: 'Acme Corp — Salary',
        categoryId: catByKey.other,
        date: new Date(`${pm.month}-28T00:00:00Z`),
        paymentMethod: 'Bank transfer',
        amount: 120000_00,
      },
    });
    for (const [key, spend] of Object.entries(pm.spends)) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          merchant: MERCHANT_BY_CAT[key],
          categoryId: catByKey[key],
          date: new Date(`${pm.month}-15T00:00:00Z`),
          paymentMethod: 'UPI · GPay',
          amount: -spend,
        },
      });
    }
  }

  // A couple of report-history entries so the Reports screen isn't empty
  await prisma.reportExport.createMany({
    data: [
      { userId: user.id, name: 'SpendWise-Jun-2026.pdf', format: 'pdf', size: '182 KB', createdAt: new Date('2026-07-01T10:00:00Z') },
      { userId: user.id, name: 'transactions-q2.csv', format: 'csv', size: '24 KB', createdAt: new Date('2026-06-14T09:00:00Z') },
      { userId: user.id, name: 'SpendWise-May-2026.pdf', format: 'pdf', size: '176 KB', createdAt: new Date('2026-06-02T08:00:00Z') },
    ],
  });

  console.log(`Seeded user ${email} (password: spendwise123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
