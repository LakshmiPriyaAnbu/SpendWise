import { HttpErrorResponse } from '@angular/common/http';
import type { ApiError } from '@spendwise/shared';
import { COPY } from './copy';

export function errorMessage(err: unknown, fallback: string = COPY.common.genericError): string {
  if (err instanceof HttpErrorResponse) {
    const message = (err.error as ApiError | null)?.error?.message;
    if (message) return message;
  }
  return fallback;
}
