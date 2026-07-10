import { Router } from 'express';
import archiver from 'archiver';
import rateLimit from 'express-rate-limit';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { interpretPrompt, isInterpreterConfigured } from '../builder/interpreter/interpret';
import { generate, regenerateEntity } from '../builder/generate';
import { appSpecSchema } from '../builder/schema/appSpec';
import { prisma } from '../prisma';
import { MODULE_REGISTRY } from '../builder/modules/registry';
import { TEMPLATE_REGISTRY } from '../builder/templates/registry';
import { TEMPLATE_DEFAULT_ENTITIES, TEMPLATE_PRESETS } from '../builder/templates/defaults';
import { loadPlugins } from '../builder/plugins/loadPlugins';
import { logRateLimitHit } from '../middleware/rateLimitLogger';

const router = Router();
router.use(requireAuth);

// LLM calls are the expensive/rate-limited step — cap it separately
// and tighter than the general API limiter, since Groq's own free
// tier has its own daily cap this could otherwise exhaust quickly.
const interpretLimiter = rateLimit({ windowMs: 60_000, limit: 5, handler: logRateLimitHit });

// Loaded once at startup, not per-request — plugin files are read
// from disk once; a plugin author restarting the server picks up
// changes, same as any other code change here.
const plugins = loadPlugins();

router.get('/catalog', (_req, res) => {
    res.json({
        modules: { ...MODULE_REGISTRY, ...plugins.modules },
        templates: TEMPLATE_REGISTRY,
        presets: [...TEMPLATE_PRESETS, ...Object.keys(plugins.presets)],
    });
});

// GET /api/builder/presets/:name — returns a ready-made, valid spec
// instantly, no LLM call at all. Faster than /interpret, and doesn't
// spend any of Groq's free-tier daily quota — the right choice
// whenever the user's idea matches a known preset closely enough.
// Checks plugin-provided presets too, not just the built-in 5.
router.get(
    '/presets/:name',
    (req, res) => {
        const entities = TEMPLATE_DEFAULT_ENTITIES[req.params.name] ?? plugins.presets[req.params.name];
        if (!entities) {
            res.status(404).json({ error: `Unknown preset. Available: ${[...TEMPLATE_PRESETS, ...Object.keys(plugins.presets)].join(', ')}` });
            return;
        }
        res.json({
            spec: {
                appName: req.params.name.charAt(0).toUpperCase() + req.params.name.slice(1) + ' App',
                type: 'generic_crud',
                authentication: true,
                modules: ['auth', 'crud', 'dashboard'],
                entities,
            },
        });
    }
);

// POST /api/builder/interpret — natural language -> validated JSON spec.
// Returns the spec for the user to REVIEW before generating anything,
// per the "AI only understands intent" requirement — this step never
// writes a single file.
router.post(
    '/interpret',
    interpretLimiter,
    asyncHandler(async (req: AuthedRequest, res) => {
        const { prompt } = req.body ?? {};
        if (typeof prompt !== 'string' || prompt.trim().length < 5) {
            res.status(400).json({ error: 'prompt is required (at least 5 characters)' });
            return;
        }
        if (!isInterpreterConfigured()) {
            res.status(503).json({ error: 'Prompt interpretation is not configured — set GROQ_API_KEY (free tier available at console.groq.com)' });
            return;
        }

        try {
            const result = await interpretPrompt(prompt);
            res.json({ spec: result.spec });
        } catch (err) {
            res.status(422).json({ error: err instanceof Error ? err.message : 'Interpretation failed' });
        }
    })
);

// POST /api/builder/generate — validated spec -> a downloadable zip of
// real generated files. Takes a spec directly (not a prompt) so a user
// can hand-edit the reviewed JSON before generating, without needing
// to re-run the LLM step.
router.post(
    '/generate',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = appSpecSchema.safeParse(req.body?.spec);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }
        const mode = req.body?.mode === 'standalone' ? 'standalone' : 'integrate';
        const includeAndroid = req.body?.includeAndroid === true;

        let result;
        try {
            result = generate(parsed.data, { mode, includeAndroid });
        } catch (err) {
            res.status(422).json({ error: err instanceof Error ? err.message : 'Generation failed' });
            return;
        }

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${parsed.data.appName.replace(/\s+/g, '-')}.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => { throw err; });
        archive.pipe(res);

        for (const [path, content] of Object.entries(result.files)) {
            archive.append(content, { name: path });
        }
        if (result.warnings.length > 0) {
            archive.append(result.warnings.join('\n'), { name: 'GENERATION_WARNINGS.txt' });
        }

        await archive.finalize();
    })
);

// POST /api/builder/regenerate-entity — re-run the generator for ONE
// entity in an existing spec, returning just its files. This is
// "regeneration of individual features": if you added a field to
// "Student" and want fresh files for just that entity, you don't
// regenerate (and re-download/re-merge) the whole project.
router.post(
    '/regenerate-entity',
    asyncHandler(async (req: AuthedRequest, res) => {
        const specParsed = appSpecSchema.safeParse(req.body?.spec);
        if (!specParsed.success) {
            res.status(400).json({ error: specParsed.error.issues[0].message });
            return;
        }
        const { entityName, mode } = req.body ?? {};
        if (typeof entityName !== 'string') {
            res.status(400).json({ error: 'entityName is required' });
            return;
        }

        try {
            const result = regenerateEntity(specParsed.data, entityName, mode === 'standalone' ? 'standalone' : 'integrate');
            res.json(result);
        } catch (err) {
            res.status(422).json({ error: err instanceof Error ? err.message : 'Regeneration failed' });
        }
    })
);

// ---- Community templates (free sharing, NOT a paid marketplace) -------

router.post(
    '/community-templates',
    asyncHandler(async (req: AuthedRequest, res) => {
        const { name, description, isPublic } = req.body ?? {};
        const specParsed = appSpecSchema.safeParse(req.body?.spec);
        if (!specParsed.success) {
            res.status(400).json({ error: specParsed.error.issues[0].message });
            return;
        }
        if (typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ error: 'name is required' });
            return;
        }

        const template = await prisma.communityTemplate.create({
            data: {
                name: name.trim(),
                description: typeof description === 'string' ? description : '',
                spec: specParsed.data,
                authorId: req.userId!,
                isPublic: !!isPublic,
            },
        });
        res.status(201).json(template);
    })
);

router.get(
    '/community-templates',
    asyncHandler(async (_req, res) => {
        const templates = await prisma.communityTemplate.findMany({
            where: { isPublic: true },
            select: { id: true, name: true, description: true, downloadCount: true, createdAt: true },
            orderBy: { downloadCount: 'desc' },
            take: 100,
        });
        res.json(templates);
    })
);

router.get(
    '/community-templates/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
        const template = await prisma.communityTemplate.findUnique({ where: { id: Number(req.params.id) } });
        if (!template || (!template.isPublic && template.authorId !== req.userId)) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }
        await prisma.communityTemplate.update({ where: { id: template.id }, data: { downloadCount: { increment: 1 } } });
        res.json(template);
    })
);

// POST /api/builder/preview — same generation logic as /generate, but
// returns file contents as JSON instead of a zip. This is the
// "Preview Screen": see exactly what will be generated before
// committing to a download, and before pushing anything to a repo
// (which matters once Android CI is involved — you want to check the
// generated Kotlin before triggering a real build).
router.post(
    '/preview',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = appSpecSchema.safeParse(req.body?.spec);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }
        const mode = req.body?.mode === 'standalone' ? 'standalone' : 'integrate';
        const includeAndroid = req.body?.includeAndroid === true;

        try {
            const result = generate(parsed.data, { mode, includeAndroid });
            res.json({ files: result.files, warnings: result.warnings, fileCount: Object.keys(result.files).length });
        } catch (err) {
            res.status(422).json({ error: err instanceof Error ? err.message : 'Preview failed' });
        }
    })
);

export default router;
