// Load test using k6 (free, open source — https://k6.io, no account
// needed to run locally). Install k6, then:
//   k6 run load-tests/basic-load.js
// Or against a deployed URL:
//   BASE_URL=https://your-backend.onrender.com k6 run load-tests/basic-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
    stages: [
        { duration: '30s', target: 10 },  // ramp up to 10 virtual users
        { duration: '1m', target: 10 },   // hold at 10 for a minute
        { duration: '20s', target: 0 },   // ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should complete under 500ms
        http_req_failed: ['rate<0.01'],   // fewer than 1% of requests should fail
    },
};

export default function () {
    const health = http.get(`${BASE_URL}/health`);
    check(health, { 'health check is 200': (r) => r.status === 200 });

    const lessons = http.get(`${BASE_URL}/api/admin/lessons`); // expect 401 without auth — that's correct
    check(lessons, { 'protected route rejects unauthenticated request': (r) => r.status === 401 });

    sleep(1);
}
