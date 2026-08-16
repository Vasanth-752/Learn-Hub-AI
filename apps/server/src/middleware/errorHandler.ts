/**
 * middleware/errorHandler.ts
 * Global Express error-handling middleware.
 * Must be registered LAST after all routes (four-argument signature required by Express).
 *
 * Standardized JSON error shape: { error: string, code?: string, details?: unknown }
 */

import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;

  // Log the full error server-side (replace with structured logger in Phase 8)
  console.error('[ERROR]', {
    status: statusCode,
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(err.code && { code: err.code }),
    ...(err.details !== undefined && { details: err.details }),
  });
}
