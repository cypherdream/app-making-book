import type { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handler. Express only recognizes this as an
 * error-handling middleware because it has 4 parameters — that arity
 * matters, don't drop the unused `_next` parameter.
 *
 * Route handlers should call next(err) (or use asyncHandler below)
 * instead of doing their own try/catch + res.status(...).json(...).
 */
export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error('[error]', err.message);

    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    // Monitoring hook: if SENTRY_DSN is set, this is where you'd call
    // Sentry.captureException(err) after `npm install @sentry/node` and
    // initializing it near the top of server.ts. Left as a no-op here
    // rather than a fake call, since claiming monitoring works without
    // an actual account connected would be dishonest.
    if (process.env.SENTRY_DSN) {
        console.error('[monitoring] SENTRY_DSN is set but the SDK is not installed yet — see errorHandler.ts');
    }

    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
};

/**
 * Wraps an async route handler so thrown errors / rejected promises
 * are forwarded to errorHandler instead of crashing the process or
 * hanging the request.
 */
export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
