import { z } from 'zod';

// Centralizing validation in zod schemas (instead of ad-hoc if-checks
// per route) means the rules are declared once and the error messages
// are consistent. Password policy favors length over forced complexity
// (matching current NIST guidance) — an 8-character "P@ssw0rd!" is not
// meaningfully safer than a 16-character passphrase.
export const registerSchema = z.object({
    name: z.string().trim().min(1, 'name is required').max(100),
    email: z.string().trim().email('a valid email is required').max(255),
    password: z.string().min(10, 'password must be at least 10 characters').max(200),
});

export const loginSchema = z.object({
    email: z.string().trim().email('a valid email is required'),
    password: z.string().min(1, 'password is required'),
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'refreshToken is required'),
});
