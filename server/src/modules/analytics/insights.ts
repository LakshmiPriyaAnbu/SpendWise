import type { Insight } from '@spendwise/shared';

export interface CategorySpend {
  name: string;
  spent: number; // paise, positive
  budget: number; // paise, positive, 0 = unset
  prevSpent: number; // paise, positive
}

function rupees(paise: number): string {
  const n = Math.round(paise / 100);
  const s = String(Math.abs(n));
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return `₹${grouped}`;
}

/**
 * Insight rules (api-conventions skill):
 * watch — category spend ≥20% above previous month
 * alert — category over budget
 * great — savings rate improved vs previous month, or ≥30%
 */
export function computeInsights(
  categories: CategorySpend[],
  totals: { income: number; expense: number; prevIncome: number; prevExpense: number },
): Insight[] {
  const insights: Insight[] = [];

  for (const c of categories) {
    if (c.prevSpent > 0 && c.spent >= c.prevSpent * 1.2) {
      const pct = Math.round(((c.spent - c.prevSpent) / c.prevSpent) * 100);
      insights.push({
        tag: 'watch',
        title: `${c.name} spending is ${pct}% higher than last month`,
        description: `You've spent ${rupees(c.spent)} on ${c.name} — ${rupees(c.spent - c.prevSpent)} more than last month. Consider setting a weekly cap.`,
      });
    }
  }

  for (const c of categories) {
    if (c.budget > 0 && c.spent > c.budget) {
      insights.push({
        tag: 'alert',
        title: `${c.name} is over budget by ${rupees(c.spent - c.budget)}`,
        description: `You've spent ${rupees(c.spent)} of your ${rupees(c.budget)} ${c.name} budget this month.`,
      });
    }
  }

  const rate = totals.income > 0 ? (totals.income - totals.expense) / totals.income : 0;
  const prevRate = totals.prevIncome > 0 ? (totals.prevIncome - totals.prevExpense) / totals.prevIncome : 0;
  if (totals.income > 0 && (rate > prevRate || rate >= 0.3)) {
    const pts = Math.round((rate - prevRate) * 100);
    insights.push({
      tag: 'great',
      title:
        rate > prevRate && pts > 0
          ? `Savings rate up ${pts} points vs last month`
          : `You're saving ${Math.round(rate * 100)}% of your income`,
      description: `You saved ${rupees(totals.income - totals.expense)} this month. Keep it up!`,
    });
  }

  // watch → alert → great, most severe categories first
  const order: Record<Insight['tag'], number> = { watch: 0, alert: 1, great: 2 };
  return insights.sort((a, b) => order[a.tag] - order[b.tag]);
}
