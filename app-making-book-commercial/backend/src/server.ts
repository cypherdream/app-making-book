import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import { createServer } from 'http';
import { initSocket } from './socket';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { enforceHttps } from './middleware/security';
import userRoutes from './routes/userRoutes';
import logRoutes from './routes/logRoutes';
import authRoutes from './routes/authRoutes';
import verificationRoutes from './routes/verificationRoutes';
import progressRoutes from './routes/progressRoutes';
import adminRoutes from './routes/adminRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import pushRoutes from './routes/pushRoutes';
import paymentRoutes from './routes/paymentRoutes';
import metricsRoutes from './routes/metricsRoutes';
import builderRoutes from './routes/builderRoutes';
import stripeWebhook from './routes/stripeWebhook';
import { prisma } from './prisma';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = express();
const httpServer = createServer(app);

initSocket(httpServer);

app.use(enforceHttps);
// helmet sets a batch of security headers in one call: HSTS (forces
// browsers to remember to use HTTPS), X-Content-Type-Options (stops
// browsers guessing a file's type in a way that can enable XSS),
// X-Frame-Options (blocks clickjacking via iframe embedding), and more.
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? '*' }));

// The Stripe webhook needs the RAW request body to verify signatures,
// so it's mounted here, before express.json() parses everything else.
app.use('/api/payments/webhook', stripeWebhook);

app.use(express.json({ limit: '100kb' })); // caps request body size — a basic defense against oversized-payload abuse
// hpp strips duplicate query-string parameters (e.g. ?id=1&id=2), which
// otherwise some frameworks resolve inconsistently and attackers can
// exploit to bypass validation that only checked the first/last value.
app.use(hpp());
app.use(requestLogger);

app.get('/health', (_req, res) => {
    res.json({ status: 'ONLINE', backend: 'Node.js + Express + Prisma + Socket.io' });
});

app.use('/metrics', metricsRoutes);

// Interactive API docs at /api/docs, generated from docs/openapi.yaml —
// a real spec you can execute requests against, not just a README table.
try {
    const openapiSpec = YAML.parse(readFileSync(join(__dirname, '..', 'docs', 'openapi.yaml'), 'utf-8'));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
} catch (err) {
    console.error('[docs] Failed to load OpenAPI spec:', err instanceof Error ? err.message : err);
}

// Versioned as /api/v1/* — the unversioned /api/* paths below stay
// mounted too, as aliases, so anything already built against them
// (the Android app, the web app, this very pass) doesn't break. New
// clients should prefer /api/v1/*; if a v2 ever introduces a breaking
// change, it gets its own prefix instead of breaking v1 callers.
const v1Router = express.Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/auth', verificationRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/logs', logRoutes);
v1Router.use('/progress', progressRoutes);
v1Router.use('/admin', adminRoutes);
v1Router.use('/analytics', analyticsRoutes);
v1Router.use('/push', pushRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/builder', builderRoutes);
app.use('/api/v1', v1Router);
app.use('/api', v1Router); // unversioned alias — same handlers, not a duplicate implementation

// Must be registered after all routes.
app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 3000);
httpServer.listen(PORT, () => {
    console.log(`Backend & sockets listening on port ${PORT}`);
});

// Self-hosted monitoring: checks the database is actually reachable
// every 5 minutes and records the result. This is what the admin
// dashboard's "uptime" figure is built from — no paid uptime service
// needed. It only catches DB-down scenarios, not "the whole process
// crashed" (see MONITORING.md for the external-ping complement to this).
const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;
setInterval(async () => {
    const start = Date.now();
    let ok = true;
    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch {
        ok = false;
    }
    await prisma.healthCheck.create({ data: { ok, latencyMs: Date.now() - start } }).catch(() => {});
}, HEALTH_CHECK_INTERVAL_MS);

export default app;
