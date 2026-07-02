import type { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Wrap an async handler so rejections reach the error middleware. */
export const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

/** Parse and return req.body through a zod schema, 400 on failure. */
export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.join('.');
    throw new HttpError(400, 'VALIDATION', path ? `${path}: ${issue.message}` : issue.message);
  }
  return result.data;
}
