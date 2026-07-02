import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env';
import { HttpError } from '../lib/http';
import { messages } from '../lib/messages';

declare module 'express-serve-static-core' {
  interface Request {
    userId: string;
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'UNAUTHORIZED', messages.auth.missingToken));
  }
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as { sub?: string };
    if (!payload.sub) throw new Error('no sub');
    req.userId = payload.sub;
    next();
  } catch {
    next(new HttpError(401, 'UNAUTHORIZED', messages.auth.invalidToken));
  }
}
