/** Companion to money.pipe.ts (paise→display): parsing rupee input back to paise. */

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupeeString(paise: number): string {
  const abs = Math.abs(paise);
  return abs % 100 ? (abs / 100).toFixed(2) : String(abs / 100);
}

/** Parses a rupee amount typed by the user; returns null unless it's a finite value > 0. */
export function parsePositiveRupees(input: string): number | null {
  const rupees = parseFloat(input);
  return Number.isFinite(rupees) && rupees > 0 ? rupees : null;
}

/** Parses a rupee amount typed by the user; returns null unless it's finite (sign not checked). */
export function parseFiniteRupees(input: string): number | null {
  const rupees = Number.parseFloat(input);
  return Number.isFinite(rupees) ? rupees : null;
}
