import { describe, expect, it } from 'vitest';
import { parseCsv } from './imports.service';
import { HttpError } from '../../lib/http';

describe('parseCsv', () => {
  it('parses valid rows into paise', () => {
    const rows = parseCsv('date,description,amount\n2026-07-01,UPI/SWIGGY,-420\n2026-06-28,SALARY,120000');
    expect(rows).toEqual([
      { date: '2026-07-01', description: 'UPI/SWIGGY', amount: -420_00 },
      { date: '2026-06-28', description: 'SALARY', amount: 120000_00 },
    ]);
  });

  it('accepts narration header and ₹/comma amounts', () => {
    const rows = parseCsv('Date,Narration,Amount\n2026-07-01,RENT,₹-28000');
    expect(rows[0].amount).toBe(-28000_00);
  });

  it('rejects missing columns', () => {
    expect(() => parseCsv('a,b\n1,2')).toThrow(HttpError);
  });

  it('rejects malformed rows with the row number', () => {
    expect(() => parseCsv('date,description,amount\nbad-date,X,10')).toThrow(/row 2/);
  });
});
