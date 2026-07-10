/**
 * Every module the Generation Engine currently knows how to emit.
 * This list is intentionally short and honest — 3 modules, not the
 * 14 in the original spec. Each entry here has a real emitter behind
 * it (see ../emitters/). Adding a module means: write the emitter,
 * then add it here — the registry is the single source of truth the
 * rest of the engine reads from, so there's no risk of a module being
 * "supported" in one place and not another.
 */
export interface ModuleDefinition {
    id: string;
    name: string;
    description: string;
    // Which other modules must be present for this one to work —
    // e.g. "dashboard" needs "auth" to know who's logged in.
    dependsOn: string[];
}

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
    auth: {
        id: 'auth',
        name: 'Authentication',
        description: 'Registration, login, JWT sessions — reuses the exact auth system already built in this backend (src/routes/authRoutes.ts), not a reimplementation.',
        dependsOn: [],
    },
    crud: {
        id: 'crud',
        name: 'CRUD entities',
        description: 'For each entity in the spec: a Prisma model, REST routes (list/get/create/update/delete), and matching React screens.',
        dependsOn: [],
    },
    dashboard: {
        id: 'dashboard',
        name: 'Dashboard',
        description: 'A landing screen listing all generated entities with counts, linking to each CRUD screen.',
        dependsOn: ['auth'],
    },
};

export function resolveModuleOrder(moduleIds: string[]): string[] {
    // Simple dependency resolution — dependsOn modules always emit
    // first. Fine for 3 modules with shallow dependencies; a real
    // topological sort is the correct approach once the registry
    // grows deep dependency chains (noted, not built prematurely).
    const resolved: string[] = [];
    const visit = (id: string) => {
        if (resolved.includes(id)) return;
        const mod = MODULE_REGISTRY[id];
        if (!mod) throw new Error(`Unknown module: ${id}`);
        mod.dependsOn.forEach(visit);
        resolved.push(id);
    };
    moduleIds.forEach(visit);
    return resolved;
}
