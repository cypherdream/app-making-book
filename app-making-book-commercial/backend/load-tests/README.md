# Load testing

Uses [k6](https://k6.io) — free, open source, runs locally, no account needed.

```bash
# macOS
brew install k6
# or see https://k6.io/docs/get-started/installation/ for other OSes

k6 run basic-load.js
BASE_URL=https://your-deployed-backend.onrender.com k6 run basic-load.js
```

## Reading the results

k6 prints p95 latency and error rate at the end. The thresholds in
`basic-load.js` (`p(95)<500`, `<1%` failures) will make k6 exit non-zero if
you fail them — useful to wire into CI once you have a staging environment
to run this against (not done here, since running it against the free
Render tier's shared/sleeping instance during CI would give misleading
numbers, not real ones).

## Honest limits of this

10 concurrent users for ~2 minutes tells you whether obvious bottlenecks
exist — it does not tell you your real capacity at 1,000 or 100,000 users.
That needs a proper staging environment matching production infrastructure,
which is a cost/scale decision, not something to fake with a bigger k6 script.
