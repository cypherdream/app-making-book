import type { AppSpec, entitySchema } from '../schema/appSpec';
import type { z } from 'zod';

type Entity = z.infer<typeof entitySchema>;

const ZOD_TYPE_MAP: Record<string, string> = {
    string: 'z.string()',
    number: 'z.number()',
    boolean: 'z.boolean()',
    date: 'z.coerce.date()',
    text: 'z.string()',
};

function emitZodSchema(entity: Entity): string {
    const fields = entity.fields.map((f) => {
        const base = ZOD_TYPE_MAP[f.type];
        return `    ${f.name}: ${base}${f.required ? '' : '.optional()'},`;
    }).join('\n');
    return `export const ${entity.name.toLowerCase()}Schema = z.object({\n${fields}\n});`;
}

/**
 * Emits a real, complete Express router for one entity — list, get,
 * create, update, delete, each with zod validation and requireAuth,
 * following the exact same pattern as every hand-written route in
 * this backend (see routes/userRoutes.ts for the pattern this copies).
 * This variant is TypeScript/ESM, meant to be dropped into THIS
 * backend (imports ../../prisma, ../../middleware/auth directly).
 * For a standalone exported project, see emitStandaloneEntityRoute.
 */
export function emitEntityRoute(entity: Entity, useAuth: boolean): string {
    const lower = entity.name.toLowerCase();
    const authImport = useAuth ? `import { requireAuth } from '../../middleware/auth';\n` : '';
    const authMiddleware = useAuth ? 'requireAuth, ' : '';

    return `import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma';
import { asyncHandler } from '../../middleware/errorHandler';
${authImport}
const router = Router();

${emitZodSchema(entity)}

router.get('/', ${authMiddleware}asyncHandler(async (_req, res) => {
    const items = await prisma.${lower}.findMany({ orderBy: { id: 'desc' } });
    res.json(items);
}));

router.get('/:id', ${authMiddleware}asyncHandler(async (req, res) => {
    const item = await prisma.${lower}.findUnique({ where: { id: Number(req.params.id) } });
    if (!item) { res.status(404).json({ error: '${entity.name} not found' }); return; }
    res.json(item);
}));

router.post('/', ${authMiddleware}asyncHandler(async (req, res) => {
    const parsed = ${lower}Schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
    const item = await prisma.${lower}.create({ data: parsed.data });
    res.status(201).json(item);
}));

router.put('/:id', ${authMiddleware}asyncHandler(async (req, res) => {
    const parsed = ${lower}Schema.partial().safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
    const item = await prisma.${lower}.update({ where: { id: Number(req.params.id) }, data: parsed.data });
    res.json(item);
}));

router.delete('/:id', ${authMiddleware}asyncHandler(async (req, res) => {
    await prisma.${lower}.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
}));

export default router;
`;
}

/**
 * Plain CommonJS variant for the standalone project scaffold — no
 * TypeScript build step, no dependency on this backend's internal
 * middleware files (which don't exist in an exported standalone
 * project). Exports a factory function taking `prisma` as a
 * parameter, matching how scaffoldEmitter.ts's server.js mounts it:
 * `require('./routes/xRoutes')(prisma)`.
 */
export function emitStandaloneEntityRoute(entity: Entity, useAuth: boolean): string {
    const lower = entity.name.toLowerCase();
    const authMiddleware = useAuth
        ? `
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Authorization header' });
  try {
    jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
`
        : '';
    const authRequire = useAuth ? `const jwt = require('jsonwebtoken');\n` : '';
    const authMw = useAuth ? 'requireAuth, ' : '';

    return `const { Router } = require('express');
const { z } = require('zod');
${authRequire}${authMiddleware}
const ${lower}Schema = z.object({
${entity.fields.map((f) => `  ${f.name}: ${ZOD_TYPE_MAP[f.type]}${f.required ? '' : '.optional()'},`).join('\n')}
});

module.exports = function(prisma) {
  const router = Router();

  router.get('/', ${authMw}async (_req, res) => {
    const items = await prisma.${lower}.findMany({ orderBy: { id: 'desc' } });
    res.json(items);
  });

  router.get('/:id', ${authMw}async (req, res) => {
    const item = await prisma.${lower}.findUnique({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).json({ error: '${entity.name} not found' });
    res.json(item);
  });

  router.post('/', ${authMw}async (req, res) => {
    const parsed = ${lower}Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const item = await prisma.${lower}.create({ data: parsed.data });
    res.status(201).json(item);
  });

  router.put('/:id', ${authMw}async (req, res) => {
    const parsed = ${lower}Schema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const item = await prisma.${lower}.update({ where: { id: Number(req.params.id) }, data: parsed.data });
    res.json(item);
  });

  router.delete('/:id', ${authMw}async (req, res) => {
    await prisma.${lower}.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  });

  return router;
};
`;
}

export function emitBackendFiles(spec: AppSpec): Record<string, string> {
    const files: Record<string, string> = {};
    for (const entity of spec.entities) {
        files[`src/generated/routes/${entity.name.toLowerCase()}Routes.ts`] = emitEntityRoute(entity, spec.authentication);
    }
    files['src/generated/README.md'] = emitBackendReadme(spec);
    return files;
}

function emitBackendReadme(spec: AppSpec): string {
    return `# Generated routes for ${spec.appName}

These files were generated from your app spec, not written by hand or by an
LLM directly — see backend/src/builder for the deterministic engine that
produced them.

## Wiring these into your server

1. Add the Prisma models from \`generated-schema.prisma\` into
   \`prisma/schema.prisma\`, then run \`npx prisma migrate dev\`.
2. In \`src/server.ts\`, import and mount each generated route:

${spec.entities.map((e) => `   \`\`\`ts\n   import ${e.name.toLowerCase()}Routes from './generated/routes/${e.name.toLowerCase()}Routes';\n   app.use('/api/${e.name.toLowerCase()}s', ${e.name.toLowerCase()}Routes);\n   \`\`\``).join('\n\n')}

## What's NOT generated yet

- Frontend integration wiring (the React screens are generated separately —
  see \`web/\` in this export — but you still need to add routes for them in
  your app's router).
- Relationships between entities (e.g. an Order belonging to a Customer) —
  the current generator emits independent entities only. See the platform
  roadmap for planned relationship support.
`;
}
