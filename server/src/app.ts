import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth';
import { errorMiddleware } from './middleware/error';
import { authRouter } from './modules/auth/auth.router';
import { transactionsRouter } from './modules/transactions/transactions.router';
import { categoriesRouter } from './modules/categories/categories.router';
import { budgetsRouter } from './modules/budgets/budgets.router';
import { analyticsRouter } from './modules/analytics/analytics.router';
import { receiptsRouter } from './modules/receipts/receipts.router';
import { importsRouter } from './modules/imports/imports.router';
import { reportsRouter } from './modules/reports/reports.router';
import { settingsRouter } from './modules/settings/settings.router';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);

  app.use('/api', authMiddleware);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/budgets', budgetsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/receipts', receiptsRouter);
  app.use('/api/imports', importsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/settings', settingsRouter);

  app.use(errorMiddleware);
  return app;
}
