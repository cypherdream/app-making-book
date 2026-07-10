import { z } from 'zod';

/**
 * The ONLY thing the LLM is allowed to produce. Every field is
 * constrained (enums, not free text) specifically so the Generation
 * Engine never has to interpret ambiguous natural language — by the
 * time a spec reaches the engine, every decision has already been
 * reduced to a closed set of choices the engine knows how to build.
 *
 * This is the entire contract between "AI understands intent" and
 * "deterministic engineering builds the app" — the spec is the wall
 * between them.
 */
export const entitySchema = z.object({
    // e.g. "Student", "Teacher", "Invoice" — becomes a Prisma model,
    // a CRUD API, and a list/detail/create/edit screen set.
    name: z.string().regex(/^[A-Z][a-zA-Z]*$/, 'Entity names must be PascalCase, e.g. "Student"'),
    fields: z.array(z.object({
        name: z.string().regex(/^[a-z][a-zA-Z]*$/, 'Field names must be camelCase'),
        type: z.enum(['string', 'number', 'boolean', 'date', 'text']),
        required: z.boolean().default(true),
    })).min(1).max(20),
});

export const appSpecSchema = z.object({
    appName: z.string().min(1).max(60),
    // "type" selects a template — see templates/registry.ts. Kept as
    // a closed enum (not free text) so an unrecognized template can
    // never reach the generation engine.
    type: z.enum(['generic_crud']), // more templates added to this enum as they're built — see roadmap
    authentication: z.boolean().default(true),
    modules: z.array(z.enum(['auth', 'crud', 'dashboard'])).default(['auth', 'crud', 'dashboard']),
    entities: z.array(entitySchema).min(1).max(10),
});

export type AppSpec = z.infer<typeof appSpecSchema>;

export type GenerationMode = 'integrate' | 'standalone';
