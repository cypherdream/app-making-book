import jwt from 'jsonwebtoken';

/**
 * Secret rotation without forcing every logged-in user to re-login.
 *
 * JWT_SECRET is the CURRENT signing secret — all new tokens use it.
 * JWT_SECRET_PREVIOUS is optional — if set, tokens signed with it are
 * still accepted as valid during a rotation window.
 *
 * Rotation procedure:
 *   1. Set JWT_SECRET_PREVIOUS to the current JWT_SECRET's value.
 *   2. Set JWT_SECRET to a newly generated random value.
 *   3. Deploy. Existing tokens keep working (checked against PREVIOUS);
 *      new tokens use the new secret.
 *   4. After the longest token lifetime has passed (30 days, matching
 *      the refresh token TTL), remove JWT_SECRET_PREVIOUS entirely.
 *
 * Without this, "rotate the secret" and "log out every single user
 * immediately" were the same operation — which is why rotation tends
 * to never actually happen in practice.
 */
const CURRENT = process.env.JWT_SECRET ?? '';
const PREVIOUS = process.env.JWT_SECRET_PREVIOUS || null;

export function signToken(payload: object, options: jwt.SignOptions) {
    return jwt.sign(payload, CURRENT, options);
}

export function verifyToken<T>(token: string): T {
    try {
        return jwt.verify(token, CURRENT) as T;
    } catch (err) {
        if (PREVIOUS) {
            return jwt.verify(token, PREVIOUS) as T; // throws its own error if this also fails
        }
        throw err;
    }
}

export function hasSecret(): boolean {
    return !!CURRENT;
}
