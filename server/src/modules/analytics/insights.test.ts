import { describe, expect, it } from 'vitest';
import { computeInsights } from './insights';
import { budgetStatus } from './analytics.service';

const flatTotals = { income: 0, expense: 0, prevIncome: 0, prevExpense: 0 };

describe('computeInsights', () => {
  it('emits watch when a category rises ≥20% month over month', () => {
    const insights = computeInsights(
      [{ name: 'Food & Dining', spent: 18200_00, prevSpent: 14700_00, budget: 20000_00 }],
      flatTotals,
    );
    const watch = insights.find((i) => i.tag === 'watch');
    expect(watch?.title).toContain('Food & Dining');
    expect(watch?.title).toContain('24%');
  });

  it('does not emit watch below the 20% threshold', () => {
    const insights = computeInsights(
      [{ name: 'Food', spent: 110_00, prevSpent: 100_00, budget: 0 }],
      flatTotals,
    );
    expect(insights.find((i) => i.tag === 'watch')).toBeUndefined();
  });

  it('emits alert with the over-amount when over budget', () => {
    const insights = computeInsights(
      [{ name: 'Shopping', spent: 9800_00, prevSpent: 9800_00, budget: 8000_00 }],
      flatTotals,
    );
    const alert = insights.find((i) => i.tag === 'alert');
    expect(alert?.title).toContain('₹1,800');
  });

  it('emits great when savings rate improves', () => {
    const insights = computeInsights([], {
      income: 120000_00,
      expense: 60000_00, // 50% rate
      prevIncome: 120000_00,
      prevExpense: 80000_00, // 33% rate
    });
    const great = insights.find((i) => i.tag === 'great');
    expect(great).toBeTruthy();
  });

  it('formats amounts with Indian digit grouping', () => {
    const insights = computeInsights(
      [{ name: 'Rent', spent: 128000_00, prevSpent: 100000_00, budget: 0 }],
      flatTotals,
    );
    expect(insights[0].description).toContain('₹1,28,000');
  });
});

describe('budgetStatus', () => {
  it('classifies on-track / close / over', () => {
    expect(budgetStatus(50_00, 100_00)).toBe('on-track');
    expect(budgetStatus(85_00, 100_00)).toBe('close');
    expect(budgetStatus(101_00, 100_00)).toBe('over');
    expect(budgetStatus(100_00, 100_00)).toBe('close'); // exactly at limit = close, not over
    expect(budgetStatus(500_00, 0)).toBe('on-track'); // no budget set
  });
});
