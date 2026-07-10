/**
 * Minimal smoke test with no extra test-framework dependency (none
 * was installed, and we can't reach npm to add one offline).
 * Boots the real server, hits /health, checks the shape, exits with
 * a non-zero code on failure so `npm test` fails loudly in CI.
 */
import '../server';

const PORT = process.env.PORT ?? '3000';

const run = async () => {
    // Give the server a moment to finish binding.
    await new Promise((resolve) => setTimeout(resolve, 300));

    const res = await fetch(`http://localhost:${PORT}/health`);
    if (res.status !== 200) {
        throw new Error(`Expected 200 from /health, got ${res.status}`);
    }

    const body = (await res.json()) as { status?: string };
    if (body.status !== 'ONLINE') {
        throw new Error(`Expected status "ONLINE", got ${JSON.stringify(body)}`);
    }

    console.log('✓ /health smoke test passed');
    process.exit(0);
};

run().catch((err) => {
    console.error('✗ smoke test failed:', err.message);
    process.exit(1);
});
