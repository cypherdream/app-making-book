import type { AppSpec } from '../schema/appSpec';
import type { GenerationMode } from '../generate';
import { readdirSync } from 'fs';
import { join } from 'path';

/**
 * A plugin is a file in plugins/ (any name ending in Plugin.ts)
 * exporting a default function with this signature. It receives the
 * validated spec and the generation mode, and returns extra files to
 * merge into the output — WITHOUT modifying any core engine code.
 *
 * This is the actual "add templates/modules without touching core"
 * requirement — deliberately much simpler than a versioned public SDK
 * (see builder/README.md for why a full SDK is a later-phase item):
 * no API stability guarantees, no sandboxing, no marketplace
 * distribution — just "drop a file in this folder and it runs." That
 * scope is honest about what it is: a real mechanism, not a polished
 * product yet.
 */
export type BuilderPlugin = (spec: AppSpec, mode: GenerationMode) => Record<string, string>;

export function getPluginContributions(spec: AppSpec, mode: GenerationMode): Record<string, string> {
    const pluginsDir = join(__dirname, 'examples');
    let files: string[] = [];
    try {
        files = readdirSync(pluginsDir).filter((f) => f.endsWith('Plugin.js') || f.endsWith('Plugin.ts'));
    } catch {
        return {}; // no plugins directory yet, or empty — not an error
    }

    const contributions: Record<string, string> = {};
    for (const file of files) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const plugin: BuilderPlugin = require(join(pluginsDir, file)).default;
            Object.assign(contributions, plugin(spec, mode));
        } catch (err) {
            console.error(`[builder-plugin] "${file}" threw and was skipped:`, err instanceof Error ? err.message : err);
        }
    }
    return contributions;
}
