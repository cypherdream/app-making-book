# Legal documents — read this before using either draft

**These are starting-point drafts, not legal advice, and not a substitute for
review by an actual lawyer familiar with your jurisdiction and business.** I'm
an AI — I can draft reasonable, honest boilerplate that matches what this
codebase actually does, but I can't tell you what your specific legal
obligations are in Kenya, the EU, the US, or wherever your users are, and
getting this wrong has real consequences (GDPR fines, FTC actions, etc.).

## What these drafts accurately reflect about THIS codebase

- Data collected: name, email, password (hashed, never stored in plain text),
  lesson progress, notes, bookmarks, and self-hosted analytics events
  (lesson views/completions, errors) — see `backend/prisma/schema.prisma`
  for the exact fields.
- No cookies are used (auth uses `localStorage` + Bearer tokens) — so this
  project currently doesn't need a cookie-consent banner. That changes if you
  later switch to cookie-based sessions.
- Payment data: if you enable Stripe, card details never touch this backend —
  Stripe handles that directly (see `backend/src/routes/paymentRoutes.ts`).
- Data deletion: `DELETE /api/auth/account` actually deletes the rows listed in
  `backend/src/routes/authRoutes.ts` — the Privacy Policy draft's deletion
  claim is accurate to what the code does, not aspirational.

## Before you actually publish either document

1. Have a lawyer review both, especially the sections on data retention,
   third-party processors (Stripe, your hosting provider, any email service
   you add), and your users' actual jurisdictions (GDPR applies if you have
   EU users, regardless of where you're based).
2. Fill in the bracketed placeholders (`[Your Company Name]`,
   `[jurisdiction]`, `[contact email]`, etc.) — these are not optional.
3. Keep both documents in sync with what the code actually does. If you add
   a feature that collects new data, update the Privacy Policy in the same
   pull request.
