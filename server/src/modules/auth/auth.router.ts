import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { AuthResponse } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';
import { env } from '../../lib/env';
import { HttpError, parseBody, wrap } from '../../lib/http';
import { DEFAULT_CATEGORIES, tint } from '../categories/palette';

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

function issueToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '7d' });
}

function toAuthResponse(user: { id: string; name: string; email: string; plan: string }): AuthResponse {
  return { token: issueToken(user.id), user: { id: user.id, name: user.name, email: user.email, plan: user.plan } };
}

export const authRouter = Router();

authRouter.post(
  '/register',
  wrap(async (req, res) => {
    const body = parseBody(registerSchema, req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists');

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash: await bcrypt.hash(body.password, 10),
        settings: { create: {} },
        categories: {
          create: DEFAULT_CATEGORIES.map((c) => ({
            key: c.key,
            name: c.name,
            color: c.color,
            bg: tint(c.color),
            icon: c.icon,
          })),
        },
      },
    });
    res.status(201).json(toAuthResponse(user));
  }),
);

authRouter.post(
  '/login',
  wrap(async (req, res) => {
    const body = parseBody(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      throw new HttpError(401, 'BAD_CREDENTIALS', 'Incorrect email or password');
    }
    res.json(toAuthResponse(user));
  }),
);
