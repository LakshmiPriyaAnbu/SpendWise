import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthResponse } from '@spendwise/shared';
import { prisma } from '../../lib/prisma';
import { env } from '../../lib/env';
import { HttpError } from '../../lib/http';
import { messages } from '../../lib/messages';
import { JWT_EXPIRES_IN } from '../../lib/constants';
import { DEFAULT_CATEGORIES, tint } from '../categories/palette';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

function issueToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: JWT_EXPIRES_IN });
}

function toAuthResponse(user: { id: string; name: string; email: string; plan: string }): AuthResponse {
  return { token: issueToken(user.id), user: { id: user.id, name: user.name, email: user.email, plan: user.plan } };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(409, 'EMAIL_TAKEN', messages.auth.emailTaken);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 10),
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
  return toAuthResponse(user);
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, 'BAD_CREDENTIALS', messages.auth.badCredentials);
  }
  return toAuthResponse(user);
}
