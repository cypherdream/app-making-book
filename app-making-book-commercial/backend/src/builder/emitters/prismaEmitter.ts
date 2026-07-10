import type { AppSpec } from '../schema/appSpec';

const FIELD_TYPE_MAP: Record<string, string> = {
    string: 'String',
    number: 'Float',
    boolean: 'Boolean',
    date: 'DateTime',
    text: 'String', // Prisma has no separate "long text" scalar for Postgres by default — @db.Text could be added here later if needed
};

/**
 * Turns entities from the spec into real Prisma model blocks. This is
 * string templating, not an LLM call — same entity spec always
 * produces byte-identical output, which is the entire point of
 * "deterministic engineering" from the original brief.
 *
 * includeUserModel: true adds a minimal User model, used by the
 * standalone project scaffold's own auth (see scaffoldEmitter.ts) —
 * the "integrate into the main backend" mode doesn't need this since
 * a User model already exists there.
 */
export function emitPrismaModels(spec: AppSpec, includeUserModel = false): string {
    const entityModels = spec.entities.map((entity) => {
        const fields = entity.fields.map((f) => {
            const prismaType = FIELD_TYPE_MAP[f.type];
            const optional = f.required ? '' : '?';
            return `  ${f.name} ${prismaType}${optional}`;
        }).join('\n');

        return `model ${entity.name} {\n  id Int @id @default(autoincrement())\n${fields}\n  createdAt DateTime @default(now())\n}`;
    }).join('\n\n');

    if (!includeUserModel) return entityModels;

    const userModel = `model User {\n  id Int @id @default(autoincrement())\n  email String @unique\n  passwordHash String\n  createdAt DateTime @default(now())\n}`;
    return `${userModel}\n\n${entityModels}`;
}
