import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './modules/health/health.router';
import usersRouter from './modules/users/users.router';

const app = express();

// ── Global middleware ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api', usersRouter);

// ── Test route for error handler verification (development only) ─────────────
app.get('/api/test-error', (_req, _res, next) => {
  const err = Object.assign(new Error('Intentional test error'), {
    statusCode: 422,
    code: 'TEST_ERROR',
    details: { intentional: true },
  });
  next(err);
});

// ── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;
