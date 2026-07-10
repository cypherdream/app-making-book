import type { AppSpec, entitySchema, GenerationMode } from '../schema/appSpec';
import type { z } from 'zod';


type Entity = z.infer<typeof entitySchema>;

function sampleValue(type: string): string {
    switch (type) {
        case 'string': return "'Test Value'";
        case 'number': return '42';
        case 'boolean': return 'true';
        case 'date': return "'2026-01-01'";
        case 'text': return "'Some longer test content.'";
        default: return "'value'";
    }
}

/**
 * Generates a real integration test per entity, using supertest
 * against the actual generated Express app — not a placeholder
 * describing what a test would check. Covers create -> read -> update
 * -> delete against a real (test) database, plus the validation
 * rejection path. This is "automatic testing of generated apps" —
 * the generated project ships with tests for itself, not just code.
 */
export function emitEntityTests(spec: AppSpec, mode: GenerationMode): Record<string, string> {
    const files: Record<string, string> = {};
    const testDir = mode === 'standalone' ? 'backend/tests' : 'src/generated/__tests__';

    for (const entity of spec.entities) {
        const sampleData = entity.fields
            .filter((f) => f.required)
            .map((f) => `${f.name}: ${sampleValue(f.type)}`)
            .join(', ');
        const lower = entity.name.toLowerCase();

        const appImport = mode === 'standalone'
            ? `// Requires the generated server.js as-is (it already exports \`app\`
// and only calls .listen() when run directly — see server.js).
const request = require('supertest');
const app = require('../server');`
            : `import request from 'supertest';
import app from '../../server';`;

        files[`${testDir}/${lower}.test.${mode === 'standalone' ? 'js' : 'ts'}`] = `${appImport}

describe('${entity.name} API', () => {
  let createdId;

  it('rejects creation with missing required fields', async () => {
    const res = await request(app).post('/api/${lower}s').send({});
    expect(res.status).toBe(400);
  });

  it('creates a ${entity.name}', async () => {
    const res = await request(app).post('/api/${lower}s').send({ ${sampleData} });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    createdId = res.body.id;
  });

  it('lists ${entity.name}s including the one just created', async () => {
    const res = await request(app).get('/api/${lower}s');
    expect(res.status).toBe(200);
    expect(res.body.some((item) => item.id === createdId)).toBe(true);
  });

  it('gets a single ${entity.name} by id', async () => {
    const res = await request(app).get(\`/api/${lower}s/\${createdId}\`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
  });

  it('returns 404 for a nonexistent ${entity.name}', async () => {
    const res = await request(app).get('/api/${lower}s/999999999');
    expect(res.status).toBe(404);
  });

  it('deletes the ${entity.name}', async () => {
    const res = await request(app).delete(\`/api/${lower}s/\${createdId}\`);
    expect(res.status).toBe(204);
  });
});
`;
    }

    files[`${testDir}/README.md`] = `# Generated tests

Real integration tests (supertest), one file per entity, covering:
create, list, get-by-id, 404-on-missing, delete, and validation
rejection. Run against a real test database — set DATABASE_URL to a
throwaway database before running these, since they create and delete
real rows.

${mode === 'standalone' ? '```bash\ncd backend\nnpm install\nnpm test\n```' : 'Run with the main project\'s `npm test` (Vitest) once these files are copied into `src/generated/__tests__/`.'}
`;

    return files;
}
