import { Router } from 'express';
import multer from 'multer';
import { wrap } from '../../lib/http';
import * as receiptsService from './receipts.service';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const receiptsRouter = Router();

receiptsRouter.post(
  '/scan',
  upload.single('file'),
  wrap(async (req, res) => {
    res.json(await receiptsService.scanReceipt(req.userId));
  }),
);
