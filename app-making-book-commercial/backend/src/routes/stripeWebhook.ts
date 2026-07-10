import { Router } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../prisma';

const router = Router();

const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
const stripe = stripeConfigured ? new Stripe(process.env.STRIPE_SECRET_KEY!) : null;

// Stripe requires the RAW request body (not JSON-parsed) to verify the
// webhook signature — this is why this route is mounted separately in
// server.ts, before the global express.json() middleware runs on
// everything else. Verifying the signature is what stops anyone who
// finds this URL from POSTing a fake "payment succeeded" event.
router.post(
    '/',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
            res.status(503).send('Webhook not configured');
            return;
        }

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                req.headers['stripe-signature'] as string,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            res.status(400).send(`Webhook signature verification failed`);
            return;
        }

        switch (event.type) {
            case 'checkout.session.completed':
            case 'customer.subscription.updated': {
                const customerId = (event.data.object as any).customer as string;
                await prisma.user.updateMany({ where: { stripeCustomerId: customerId }, data: { isPremium: true } });
                break;
            }
            case 'customer.subscription.deleted': {
                const customerId = (event.data.object as any).customer as string;
                await prisma.user.updateMany({ where: { stripeCustomerId: customerId }, data: { isPremium: false } });
                break;
            }
        }

        res.json({ received: true });
    }
);

export default router;
