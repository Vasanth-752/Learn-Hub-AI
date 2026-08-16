/**
 * modules/health/health.router.ts
 * GET /api/health — public, no auth.
 */

import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
