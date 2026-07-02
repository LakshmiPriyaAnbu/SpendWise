import { Router } from 'express';
import { z } from 'zod';
import { parseBody, wrap } from '../../lib/http';
import * as authService from './auth.service';

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post(
  '/register',
  wrap(async (req, res) => {
    const body = parseBody(registerSchema, req.body);
    res.status(201).json(await authService.register(body));
  }),
);

authRouter.post(
  '/login',
  wrap(async (req, res) => {
    const body = parseBody(loginSchema, req.body);
    res.json(await authService.login(body));
  }),
);
