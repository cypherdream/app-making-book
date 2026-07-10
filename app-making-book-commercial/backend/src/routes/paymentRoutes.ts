import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../prisma';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logAdminAction } from '../utils/audit';

const router = Router();

// Real Stripe integration, wired to a test-mode key by default. To
// activate: create a free Stripe account, grab your keys from the
// Dashboard (test mode requires no business verification), and set
// STRIPE_SECRET_KEY + STRIPE_PRICE_ID + STRIPE_WEBHOOK_SECRET in .env.
// Nothing here works without those — this is the code half of the
// integration, not a working payment flow without your own account.
const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
const stripe = stripeConfigured ? new Stripe(process.env.STRIPE_SECRET_KEY!) : null;

router.use(requireAuth);

// POST /api/payments/create-checkout-session — starts a Stripe
// Checkout flow for the premium subscription. Creates (or reuses) a
// Stripe Customer tied to this user, so repeat purchases/subscription
// management stay linked to one account instead of duplicating customers.
router.post(
    '/create-checkout-session',
    asyncHandler(async (req: AuthedRequest, res) => {
        if (!stripe) {
            res.status(503).json({ error: 'Payments are not configured on this server yet' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: req.userId! } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({ email: user.email, name: user.name });
            customerId = customer.id;
            await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
            success_url: `${process.env.CLIENT_ORIGIN}/premium/success`,
            cancel_url: `${process.env.CLIENT_ORIGIN}/premium/cancelled`,
        });

        res.json({ url: session.url });
    })
);

router.post(
    '/create-portal-session',
    asyncHandler(async (req: AuthedRequest, res) => {
        if (!stripe) {
            res.status(503).json({ error: 'Payments are not configured on this server yet' });
            return;
        }
        const user = await prisma.user.findUnique({ where: { id: req.userId! } });
        if (!user?.stripeCustomerId) {
            res.status(400).json({ error: 'No billing account on file yet' });
            return;
        }
        const portal = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: process.env.CLIENT_ORIGIN ?? '/',
        });
        res.json({ url: portal.url });
    })
);

export default router;
