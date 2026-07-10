import { describe, it, expect } from 'vitest';
import { emitPrismaModels } from '../emitters/prismaEmitter';
import { emitEntityRoute, emitStandaloneEntityRoute } from '../emitters/backendEmitter';
import { emitWebFiles } from '../emitters/webEmitter';
import { appSpecSchema } from '../schema/appSpec';
import { resolveModuleOrder, MODULE_REGISTRY } from '../modules/registry';
import { TEMPLATE_DEFAULT_ENTITIES, TEMPLATE_PRESETS } from '../templates/defaults';
import { regenerateEntity } from '../generate';

const sampleEntity = {
    name: 'Student',
    fields: [
        { name: 'name', type: 'string' as const, required: true },
        { name: 'grade', type: 'number' as const, required: true },
        { name: 'enrolled', type: 'boolean' as const, required: false },
    ],
};

describe('appSpecSchema', () => {
    it('accepts a valid spec', () => {
        const result = appSpecSchema.safeParse({
            appName: 'School Manager',
            type: 'generic_crud',
            authentication: true,
            modules: ['auth', 'crud'],
            entities: [sampleEntity],
        });
        expect(result.success).toBe(true);
    });

    it('rejects a lowercase entity name (must be PascalCase)', () => {
        const result = appSpecSchema.safeParse({
            appName: 'X',
            type: 'generic_crud',
            entities: [{ ...sampleEntity, name: 'student' }],
        });
        expect(result.success).toBe(false);
    });

    it('rejects an unknown template type', () => {
        const result = appSpecSchema.safeParse({
            appName: 'X',
            type: 'not_a_real_template',
            entities: [sampleEntity],
        });
        expect(result.success).toBe(false);
    });
});

describe('emitPrismaModels', () => {
    it('generates a valid-looking Prisma model block', () => {
        const spec = { entities: [sampleEntity] } as any;
        const output = emitPrismaModels(spec);
        expect(output).toContain('model Student {');
        expect(output).toContain('name String');
        expect(output).toContain('grade Float');
        expect(output).toContain('enrolled Boolean?'); // optional field gets the ? suffix
    });
});

describe('emitEntityRoute', () => {
    it('includes requireAuth when auth is requested', () => {
        const output = emitEntityRoute(sampleEntity, true);
        expect(output).toContain('requireAuth');
    });

    it('omits requireAuth when auth is not requested', () => {
        const output = emitEntityRoute(sampleEntity, false);
        expect(output).not.toContain('requireAuth');
    });

    it('generates all five CRUD routes', () => {
        const output = emitEntityRoute(sampleEntity, true);
        expect(output).toContain("router.get('/'");
        expect(output).toContain("router.get('/:id'");
        expect(output).toContain("router.post('/'");
        expect(output).toContain("router.put('/:id'");
        expect(output).toContain("router.delete('/:id'");
    });
});

describe('emitWebFiles', () => {
    it('generates one component file per entity', () => {
        const spec = { entities: [sampleEntity, { ...sampleEntity, name: 'Exam' }] } as any;
        const files = emitWebFiles(spec);
        expect(Object.keys(files)).toEqual([
            'src/generated/StudentList.jsx',
            'src/generated/ExamList.jsx',
        ]);
    });
});

describe('resolveModuleOrder', () => {
    it('puts a dependency before the module that needs it', () => {
        const order = resolveModuleOrder(['dashboard']); // dashboard depends on auth
        expect(order.indexOf('auth')).toBeLessThan(order.indexOf('dashboard'));
    });

    it('throws on an unknown module id', () => {
        expect(() => resolveModuleOrder(['not_a_real_module'])).toThrow();
    });

    it('every registered module has a real dependency chain (no typos in dependsOn)', () => {
        for (const mod of Object.values(MODULE_REGISTRY)) {
            for (const dep of mod.dependsOn) {
                expect(MODULE_REGISTRY[dep]).toBeDefined();
            }
        }
    });
});

describe('emitStandaloneEntityRoute', () => {
    it('produces CommonJS (require/module.exports), not ESM', () => {
        const output = emitStandaloneEntityRoute(sampleEntity, true);
        expect(output).toContain("require('express')");
        expect(output).toContain('module.exports = function(prisma)');
        expect(output).not.toContain('import ');
    });

    it('includes a self-contained JWT check when auth is requested, with no external middleware import', () => {
        const output = emitStandaloneEntityRoute(sampleEntity, true);
        expect(output).toContain('function requireAuth');
        expect(output).not.toContain('../../middleware');
    });
});

describe('template presets', () => {
    it('every preset has at least one entity with at least one field', () => {
        for (const name of TEMPLATE_PRESETS) {
            const entities = TEMPLATE_DEFAULT_ENTITIES[name];
            expect(entities.length).toBeGreaterThan(0);
            for (const entity of entities) {
                expect(entity.fields.length).toBeGreaterThan(0);
            }
        }
    });

    it('every preset entity passes the real appSpecSchema validation', () => {
        for (const name of TEMPLATE_PRESETS) {
            const result = appSpecSchema.safeParse({
                appName: `${name} test`,
                type: 'generic_crud',
                entities: TEMPLATE_DEFAULT_ENTITIES[name],
            });
            expect(result.success).toBe(true);
        }
    });
});

describe('regenerateEntity', () => {
    const twoEntitySpec = {
        appName: 'Test App',
        type: 'generic_crud' as const,
        authentication: true,
        entities: [sampleEntity, { name: 'Exam', fields: [{ name: 'subject', type: 'string' as const, required: true }] }],
    };

    it('only returns files for the requested entity, not others in the spec', () => {
        const { files } = regenerateEntity(twoEntitySpec, 'Student', 'standalone');
        const paths = Object.keys(files);
        expect(paths.some((p) => p.toLowerCase().includes('student'))).toBe(true);
        expect(paths.some((p) => p.toLowerCase().includes('exam'))).toBe(false);
    });

    it('throws a clear error for an entity name not in the spec', () => {
        expect(() => regenerateEntity(twoEntitySpec, 'NotReal', 'standalone')).toThrow(/No entity named/);
    });

    it('reflects field changes immediately (proves it re-emits, not caches)', () => {
        const withNewField = {
            ...twoEntitySpec,
            entities: [
                { ...sampleEntity, fields: [...sampleEntity.fields, { name: 'notes', type: 'text' as const, required: false }] },
                twoEntitySpec.entities[1],
            ],
        };
        const { files } = regenerateEntity(withNewField, 'Student', 'standalone');
        expect(files['backend/routes/studentRoutes.js']).toContain('notes');
    });
});
