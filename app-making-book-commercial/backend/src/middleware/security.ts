import type { Request, Response, NextFunction } from 'express';

/**
 * Forces HTTPS in production. Render (and most PaaS hosts) terminate
 * TLS at a proxy in front of your app and forward plain HTTP internally,
 * setting X-Forwarded-Proto so you can tell the difference — checking
 * req.secure alone would always be false behind such a proxy.
 */
export const enforceHttps = (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== 'production') return next();
    const proto = req.headers['x-forwarded-proto'];
    if (proto && proto !== 'https') {
        res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
        return;
    }
    next();
};
