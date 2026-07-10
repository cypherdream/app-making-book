import { Resend } from 'resend';

/**
 * Email service with a real no-op fallback, same pattern as
 * cache.ts/pushRoutes.ts. Without RESEND_API_KEY set, calls log to
 * the console instead of sending — so email verification and password
 * reset routes below don't crash in local dev before you've set this up,
 * they just print the link/code you'd otherwise have emailed.
 *
 * Free option: Resend gives 3,000 emails/month free (capped at 100/day),
 * no credit card — verified against Resend's current pricing page, not
 * assumed. The 100/day cap matters if you expect a busy signup day.
 */
const resendConfigured = !!process.env.RESEND_API_KEY;
const resend = resendConfigured ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'; // Resend's shared sandbox sender, works with no domain setup

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!resend) {
        console.log(`[email:not-configured] Would send to ${to}: "${subject}"\n${html}`);
        return;
    }
    try {
        await resend.emails.send({ from: FROM, to, subject, html });
    } catch (err) {
        // Email failing shouldn't crash the request that triggered it
        // (e.g. registration should still succeed even if the
        // verification email fails to send) — log it, don't throw.
        console.error('[email] send failed:', err instanceof Error ? err.message : err);
    }
}

export function isEmailConfigured(): boolean {
    return resendConfigured;
}
