import { Pipe, type PipeTransform } from '@angular/core';

/**
 * Indian lakh/crore digit grouping (spendwise-design skill): ₹1,20,000.
 * Input is integer paise; output shows whole rupees (paise shown only if non-zero).
 * mode 'signed' prefixes +/-, 'abs' drops the sign, 'plain' keeps - only.
 */
@Pipe({ name: 'swMoney' })
export class MoneyPipe implements PipeTransform {
  transform(paise: number | null | undefined, mode: 'plain' | 'signed' | 'abs' = 'plain'): string {
    if (paise == null) return '—';
    const neg = paise < 0;
    const abs = Math.abs(paise);
    const rupees = Math.floor(abs / 100);
    const rem = abs % 100;
    const s = String(rupees);
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
    const frac = rem ? `.${String(rem).padStart(2, '0')}` : '';
    const sign = mode === 'abs' ? '' : neg ? '-' : mode === 'signed' ? '+' : '';
    return `${sign}₹${grouped}${frac}`;
  }
}
