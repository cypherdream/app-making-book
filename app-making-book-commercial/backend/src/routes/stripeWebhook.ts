import { Router } from 'express';
import express from 'express';

const router = Router();

// Stripe webhook is DISABLED - payments are not configured
// This is a FREE app with no credit card integration

router.post(
    '/',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        res.status(200).json({ received: true, message: 'Payments disabled - no webhook processing' });
    }
);

export default router;
