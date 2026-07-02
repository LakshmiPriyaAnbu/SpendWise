import { describe, expect, it } from 'vitest';
import { isDuplicate, similarMerchant } from './duplicates';

describe('similarMerchant', () => {
  it('matches normalized containment', () => {
    expect(similarMerchant('UPI/SWIGGY BANGALORE', 'Swiggy')).toBe(true);
    expect(similarMerchant('AMZN MKTP IN', 'Amazon')).toBe(false);
    expect(similarMerchant('Netflix', 'NETFLIX.COM')).toBe(true);
  });

  it('rejects empty strings', () => {
    expect(similarMerchant('', 'Swiggy')).toBe(false);
    expect(similarMerchant('···', 'Swiggy')).toBe(false);
  });
});

describe('isDuplicate', () => {
  const existing = [{ merchant: 'Swiggy', amount: -420_00, date: '2026-07-01' }];

  it('flags same amount + similar merchant within 10 days', () => {
    expect(isDuplicate({ merchant: 'UPI/SWIGGY BANGALORE', amount: -420_00, date: '2026-07-05' }, existing)).toBeTruthy();
  });

  it('ignores sign differences (abs amount match)', () => {
    expect(isDuplicate({ merchant: 'Swiggy', amount: 420_00, date: '2026-07-05' }, existing)).toBeTruthy();
  });

  it('rejects outside the 10-day window', () => {
    expect(isDuplicate({ merchant: 'Swiggy', amount: -420_00, date: '2026-07-20' }, existing)).toBeNull();
  });

  it('rejects different amounts', () => {
    expect(isDuplicate({ merchant: 'Swiggy', amount: -421_00, date: '2026-07-02' }, existing)).toBeNull();
  });

  it('rejects dissimilar merchants', () => {
    expect(isDuplicate({ merchant: 'Zomato', amount: -420_00, date: '2026-07-02' }, existing)).toBeNull();
  });
});
