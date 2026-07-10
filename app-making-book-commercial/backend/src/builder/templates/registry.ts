/**
 * One template exists right now: generic_crud. This deliberately
 * doesn't try to be "School" or "Hospital" or "Restaurant" yet —
 * those are really just generic_crud with different default entities
 * (a School template pre-fills Teacher/Student/Exam; a Restaurant
 * template pre-fills MenuItem/Order/Table). That's the actual
 * architecture insight worth building on: most of the 20 templates in
 * the original spec are the SAME generation engine with different
 * default entity sets, not 20 separate code paths. Once generic_crud
 * is solid, adding "School" is writing a default-entities file, not a
 * new emitter.
 */
export interface TemplateDefinition {
    id: string;
    name: string;
    description: string;
    requiredModules: string[];
}

export const TEMPLATE_REGISTRY: Record<string, TemplateDefinition> = {
    generic_crud: {
        id: 'generic_crud',
        name: 'Generic CRUD App',
        description: 'Any app that\'s fundamentally "manage records of a few entity types, with login." Covers a surprising amount of the original 20-template list before those templates need anything template-specific.',
        requiredModules: ['auth', 'crud', 'dashboard'],
    },
};
