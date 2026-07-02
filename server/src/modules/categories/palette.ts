/** Emerald design-system category palette (spendwise-design skill). */

export const DEFAULT_CATEGORIES = [
  { key: 'food', name: 'Food & Dining', color: '#0E7C66', icon: 'food' },
  { key: 'rent', name: 'Rent', color: '#2C6E9B', icon: 'rent' },
  { key: 'shopping', name: 'Shopping', color: '#B0679E', icon: 'shopping' },
  { key: 'travel', name: 'Travel', color: '#2F9C8F', icon: 'travel' },
  { key: 'bills', name: 'Bills & Utilities', color: '#D98A2B', icon: 'bills' },
  { key: 'subs', name: 'Subscriptions', color: '#7568C4', icon: 'subs' },
  { key: 'health', name: 'Health', color: '#D26A57', icon: 'health' },
  { key: 'other', name: 'Other', color: '#8A9691', icon: 'other' },
] as const;

/** 7-hue palette cycled for user-created categories (from the design prototype). */
export const CUSTOM_PALETTE = ['#B0679E', '#2C6E9B', '#D26A57', '#7568C4', '#2F9C8F', '#D98A2B', '#5B8A72'];

export function tint(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(255 - (255 - c) * 0.12);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
