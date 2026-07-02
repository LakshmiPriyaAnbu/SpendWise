/**
 * All user-facing response strings in one place. Wording must never change
 * casually — the web and iOS clients (and tests) match on these exact strings.
 */
export const messages = {
  auth: {
    emailTaken: 'An account with this email already exists',
    badCredentials: 'Incorrect email or password',
    missingToken: 'Missing bearer token',
    invalidToken: 'Invalid or expired token',
  },
  transactions: {
    notFound: 'Transaction not found',
    unknownCategory: 'Unknown category',
  },
  categories: {
    notFound: 'Category not found',
    notCustom: 'Default categories cannot be deleted',
    defaultMissing: 'Default category missing',
  },
  imports: {
    emptyStatement: 'Statement appears to be empty',
    missingColumns: 'CSV must have date, description and amount columns',
    unparsableRow: (row: number) => `Could not parse row ${row}`,
    unknownCategoryRow: (description: string) => `Unknown category on row "${description}"`,
  },
  validation: {
    amountNonZero: 'amount must be non-zero',
  },
  internal: 'Something went wrong',
} as const;
