/** Magic values shared across modules. Values must not change — clients depend on them. */

export const DAY_MS = 86_400_000;

/** Duplicate-detection window (api-conventions skill): ±10 days. */
export const DUPLICATE_WINDOW_DAYS = 10;

/** JWT token lifetime. */
export const JWT_EXPIRES_IN = '7d';

/** Mock-OCR confidence reported by the receipt scan endpoint. */
export const SCAN_CONFIDENCE = 98;

/** Bank identity reported for parsed statement imports (sample/prototype value). */
export const SAMPLE_STATEMENT_BANK = 'HDFC Bank';
export const SAMPLE_STATEMENT_MASKED_ACCOUNT = '••••4821';
