import fs from 'fs';
import path from 'path';
import type { ModuleDefinition } from '../modules/registry';
import type { AppSpec } from '../schema/appSpec';

/**
 * Minimal plugin system: drop a .js file in this folder, it gets
 * loaded and merged into the module registry — no core files touched.
 * This is deliberately NOT the full "Plugin SDK" from the original
 * spec (no versioning guarantees, no sandboxing, no marketplace
 * distribution) — it's the honest first step: third parties CAN
 * extend the registry without editing modules/registry.ts, which is
 * the actual core requirement ("without modifying the core").
 *
 * A plugin file must export:
 *   module.exports = { id: 'my_module', name: '...', description: '...', dependsOn: [] }
 * for a module plugin, or:
 *   module.exports = { presetName: 'my_preset', entities: [...] }
 * for a template preset plugin.
 */
export interface LoadedPlugins {
    modules: Record<string, ModuleDefinition>;
    presets: Record<string, AppSpec['entities']>;
}

export function loadPlugins(pluginsDir = path.join(__dirname, 'installed')): LoadedPlugins {
    const modules: Record<string, ModuleDefinition> = {};
    const presets: Record<string, AppSpec['entities']> = {};

    if (!fs.existsSync(pluginsDir)) {
        return { modules, presets }; // no plugins installed — normal, not an error
    }

    const files = fs.readdirSync(pluginsDir).filter((f) => f.endsWith('.js'));
    for (const file of files) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const plugin = require(path.join(pluginsDir, file));
            if (plugin.id && plugin.name) {
                modules[plugin.id] = { id: plugin.id, name: plugin.name, description: plugin.description ?? '', dependsOn: plugin.dependsOn ?? [] };
            } else if (plugin.presetName && plugin.entities) {
                presets[plugin.presetName] = plugin.entities;
            } else {
                console.warn(`[plugins] ${file} doesn't match the expected module or preset shape — skipped`);
            }
        } catch (err) {
            // One bad plugin must never take down the whole builder engine.
            console.error(`[plugins] Failed to load ${file}:`, err instanceof Error ? err.message : err);
        }
    }

    return { modules, presets };
}
