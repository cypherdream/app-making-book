import { appSpecSchema, type AppSpec, type GenerationMode } from './schema/appSpec';
import { resolveModuleOrder } from './modules/registry';
import { TEMPLATE_REGISTRY } from './templates/registry';
import { emitPrismaModels } from './emitters/prismaEmitter';
import { emitBackendFiles, emitStandaloneEntityRoute } from './emitters/backendEmitter';
import { emitWebFiles } from './emitters/webEmitter';
import { emitBackendScaffold, emitWebScaffold } from './emitters/scaffoldEmitter';
import { emitEntityTests } from './emitters/testEmitter';
import { emitAndroidFiles } from './emitters/androidEmitter';
import { emitAndroidCiWorkflow } from './emitters/androidCiEmitter';

export interface GenerationResult {
    files: Record<string, string>; // path -> content
    warnings: string[];
}

export interface GenerateOptions {
    mode?: GenerationMode;
    includeAndroid?: boolean; // adds real Kotlin source + a CI workflow that actually builds an APK/AAB on GitHub's free runners
}

/**
 * The Generation Engine's entry point. Everything downstream of this
 * function is pure, deterministic string templating — no LLM call
 * happens anywhere below this line. Same valid AppSpec + mode in,
 * byte-identical files out, every time.
 *
 * mode "integrate": loose files meant to be dropped into THIS backend
 *   (imports ../../prisma etc.) — useful if you're extending
 *   app-making-book itself.
 * mode "standalone": a complete, independently runnable project
 *   (its own package.json, server, minimal auth) — what most users of
 *   the App Builder actually want: something they can unzip and run.
 */
export function generate(rawSpec: unknown, options: GenerateOptions = {}): GenerationResult {
    const { mode = 'standalone', includeAndroid = false } = options;
    const spec: AppSpec = appSpecSchema.parse(rawSpec); // throws on anything the LLM got wrong — never trust the LLM's JSON blindly
    const warnings: string[] = [];

    const template = TEMPLATE_REGISTRY[spec.type];
    if (!template) throw new Error(`Unknown template: ${spec.type}`);

    const moduleOrder = resolveModuleOrder(spec.modules);
    for (const required of template.requiredModules) {
        if (!moduleOrder.includes(required)) {
            warnings.push(`Template "${template.id}" normally includes "${required}" — spec didn't request it, so it was left out. The generated app may be missing expected functionality.`);
        }
    }

    const testFiles = emitEntityTests(spec, mode);

    const files: Record<string, string> = mode === 'standalone'
        ? { ...emitBackendScaffold(spec), ...emitWebScaffold(spec), ...emitWebFiles(spec, true), ...testFiles }
        : { 'generated-schema.prisma': emitPrismaModels(spec), ...emitBackendFiles(spec), ...emitWebFiles(spec, false), ...testFiles };

    if (includeAndroid) {
        Object.assign(files, emitAndroidFiles(spec));
        files['.github/workflows/build-android.yml'] = emitAndroidCiWorkflow(spec);
        warnings.push('Android source was generated but NOT compiled — no Android SDK exists in the environment that generated it. Push this to a GitHub repo to build a real APK/AAB for free via .github/workflows/build-android.yml (GitHub-hosted runners include an Android SDK). See android/README.md.');
    }

    return { files, warnings };
}

/**
 * Regenerates files for ONE entity within an existing spec, instead
 * of the whole project. This is what "regeneration of individual
 * features" means concretely: you added a "notes" field to Student,
 * you don't want to re-download and manually re-merge every other
 * entity's files too — just the ones that changed.
 */
export function regenerateEntity(
    rawSpec: unknown,
    entityName: string,
    mode: GenerationMode = 'standalone'
): { files: Record<string, string> } {
    const spec: AppSpec = appSpecSchema.parse(rawSpec);
    const entity = spec.entities.find((e) => e.name === entityName);
    if (!entity) {
        throw new Error(`No entity named "${entityName}" in this spec. Available: ${spec.entities.map((e) => e.name).join(', ')}`);
    }

    // Reuses the exact same emitters as a full generate() call, just
    // scoped to a spec containing only the one requested entity — so
    // there's no separate "regeneration" code path to drift out of
    // sync with normal generation.
    const singleEntitySpec: AppSpec = { ...spec, entities: [entity] };
    const testFiles = emitEntityTests(singleEntitySpec, mode);

    const files = mode === 'standalone'
        ? {
            [`backend/routes/${entity.name.toLowerCase()}Routes.js`]: emitStandaloneEntityRoute(entity, spec.authentication),
            ...emitWebFiles(singleEntitySpec, true),
            ...testFiles,
        }
        : { ...emitBackendFiles(singleEntitySpec), ...emitWebFiles(singleEntitySpec, false), ...testFiles };

    return { files };
}
