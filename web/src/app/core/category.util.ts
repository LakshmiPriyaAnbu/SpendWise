import type { Category } from '@spendwise/shared';

/** Shown when a transaction/row references a category id we don't have loaded yet. */
export const FALLBACK_CATEGORY: Category = {
  id: '',
  key: 'other',
  name: 'Other',
  color: 'var(--sw-muted-icon)',
  bg: 'var(--sw-muted-icon-bg)',
  icon: 'other',
  isCustom: false,
};
