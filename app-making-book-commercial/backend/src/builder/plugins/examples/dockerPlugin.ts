import type { AppSpec } from '../../schema/appSpec';
import type { GenerationMode } from '../../generate';

/**
 * Example plugin proving the mechanism works end to end: adds a
 * Dockerfile + docker-compose.yml to standalone-generated projects,
 * without any change to generate.ts, scaffoldEmitter.ts, or any other
 * core engine file. This is genuinely how you'd add Kubernetes
 * manifests, a different CI provider, or anything else later, without
 * this being a "core feature" that has to be planned in advance.
 */
export default function dockerPlugin(spec: AppSpec, mode: GenerationMode): Record<string, string> {
    if (mode !== 'standalone') return {}; // this plugin only makes sense for standalone exports

    return {
        'backend/Dockerfile': `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nRUN npx prisma generate\nEXPOSE 3000\nCMD ["node", "server.js"]\n`,
        'docker-compose.yml': `version: "3.9"\nservices:\n  backend:\n    build: ./backend\n    ports:\n      - "3000:3000"\n    environment:\n      DATABASE_URL: postgresql://appuser:apppass@db:5432/${spec.appName.toLowerCase().replace(/\s+/g, '_')}\n    depends_on:\n      - db\n  db:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_USER: appuser\n      POSTGRES_PASSWORD: apppass\n      POSTGRES_DB: ${spec.appName.toLowerCase().replace(/\s+/g, '_')}\n`,
    };
}
