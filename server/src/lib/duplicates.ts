/**
 * Shared duplicate-detection rule (api-conventions skill):
 * same absolute amount + similar merchant (normalized containment) within ±10 days.
 */

export function normalizeMerchant(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function similarMerchant(a: string, b: string): boolean {
  const na = normalizeMerchant(a);
  const nb = normalizeMerchant(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

export interface DupCandidate {
  merchant: string;
  /** signed paise */
  amount: number;
  /** ISO date */
  date: string | Date;
}

const DAY_MS = 86_400_000;

export function isDuplicate(candidate: DupCandidate, existing: DupCandidate[]): DupCandidate | null {
  const cDate = new Date(candidate.date).getTime();
  for (const e of existing) {
    if (Math.abs(e.amount) !== Math.abs(candidate.amount)) continue;
    if (!similarMerchant(e.merchant, candidate.merchant)) continue;
    if (Math.abs(new Date(e.date).getTime() - cDate) <= 10 * DAY_MS) return e;
  }
  return null;
}
