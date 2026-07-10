import { Router } from 'express';
import webpush from 'web-push';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// VAPID keys are generated once, locally, for free — no Firebase
// project or paid push service needed. Run:
//   npm run generate-vapid-keys
// and put the output in .env as VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY.
const vapidConfigured = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (vapidConfigured) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
    );
}

const subscribeSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

router.use(requireAuth);

// GET /api/push/vapid-public-key — the frontend needs this to call
// PushManager.subscribe(). Public key only; the private key never
// leaves the server.
router.get('/vapid-public-key', (_req, res) => {
    if (!vapidConfigured) {
        res.status(503).json({ error: 'Push notifications are not configured on this server yet' });
        return;
    }
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post(
    '/subscribe',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = subscribeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }
        const { endpoint, keys } = parsed.data;
        await prisma.pushSubscription.upsert({
            where: { endpoint },
            update: { userId: req.userId!, p256dh: keys.p256dh, auth: keys.auth },
            create: { userId: req.userId!, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        });
        res.status(201).json({ ok: true });
    })
);

router.post(
    '/unsubscribe',
    asyncHandler(async (req, res) => {
        const { endpoint } = req.body ?? {};
        if (typeof endpoint === 'string') {
            await prisma.pushSubscription.deleteMany({ where: { endpoint } });
        }
        res.json({ ok: true });
    })
);

/**
 * Sends a push notification to every device a user has subscribed on.
 * Not exposed as a route directly — called from server-side code
 * (e.g. a daily-reminder cron, or an admin action), never from a
 * client request, since anyone able to call this could spam users.
 */
export async function sendPushToUser(userId: number, title: string, body: string) {
    if (!vapidConfigured) return;
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    await Promise.allSettled(
        subs.map((sub) =>
            webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                JSON.stringify({ title, body })
            ).catch(async (err) => {
                // 410 Gone means the browser unsubscribed on its end —
                // clean up the dead subscription instead of retrying it forever.
                if (err.statusCode === 410) {
                    await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
                }
            })
        )
    );
}

export default router;
