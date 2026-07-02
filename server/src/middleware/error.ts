import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http';
import { messages } from '../lib/messages';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: messages.internal } });
}
