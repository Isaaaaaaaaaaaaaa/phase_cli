import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join, isAbsolute } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { EditorError, ExtensionRegistry, type Plugin, type PluginManifest, type PluginServices } from "../../api.js";

const categories = ["shapes", "commands", "attributes", "decorators"] as const;

/** Only this outer layer resolves strings into executable modules. */
export class PluginLoader {
  public constructor(private readonly services: PluginServices) {}

  public install(plugin: Plugin, manifest: PluginManifest, options?: unknown): readonly string[] {
    const staged = new ExtensionRegistry();
    try {
      if (!manifest.name || typeof plugin.activate !== "function") throw new Error("invalid plugin contract");
      plugin.activate(staged, options);
      const declared = categories.map((category) => `${category}=${[...(manifest.contributes?.[category] ?? [])].sort().join(",")}`).join("; ");
      const registered = categories.map((category) => `${category}=${staged.names(category).join(",")}`).join("; ");
      if (declared !== registered) {
        return [`error: plugin manifest mismatch: ${manifest.name} (declared: ${declared}, registered: ${registered})`];
      }
      this.services.extensions.merge(staged);
      return [];
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message.replace(/[\r\n]+/gu, " ") : String(error);
      if (error instanceof EditorError && reason.startsWith("duplicate registration:")) return [`error: ${reason}`];
      return [`error: plugin failed to activate: ${manifest.name} (${reason})`];
    }
  }

  public async config(path: string): Promise<readonly string[]> {
    let plugins: { module: string; enabled?: boolean; options?: unknown }[];
    try {
      const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
      if (!parsed || typeof parsed !== "object" || !("plugins" in parsed) || !Array.isArray(parsed.plugins)) throw new Error();
      plugins = parsed.plugins as typeof plugins;
      if (plugins.some((entry) => typeof entry !== "object" ||
          typeof entry.module !== "string" || entry.module.length === 0 ||
          (entry.enabled !== undefined && typeof entry.enabled !== "boolean"))) throw new Error();
    } catch { return ["error: invalid plugin config"]; }
    const errors: string[] = [];
    for (const entry of plugins) {
      if (entry.enabled === false) continue;
      errors.push(...await this.module(entry.module, dirname(resolve(path)), entry.options));
    }
    return errors;
  }

  public async module(specifier: string, base: string, options?: unknown): Promise<readonly string[]> {
    const require = createRequire(join(base, "__plugin_resolver__.cjs"));
    const target = specifier.startsWith(".") || isAbsolute(specifier) ? resolve(base, specifier) : specifier;
    let entry: string;
    try { entry = require.resolve(target); }
    catch { return [`error: plugin not found: ${specifier}`]; }
    let manifest: PluginManifest = { name: specifier };
    try {
      let directory = existsSync(target) && statSync(target).isDirectory() ? target : dirname(entry);
      while (!existsSync(join(directory, "package.json"))) {
        const parent = dirname(directory);
        if (parent === directory) throw new Error("plugin package.json not found");
        directory = parent;
      }
      manifest = JSON.parse(readFileSync(join(directory, "package.json"), "utf8")) as PluginManifest;
      const loaded: unknown = await import(pathToFileURL(entry).href);
      const exports = loaded as Record<string, unknown>;
      if (exports.default === undefined) return [`error: plugin has no default export: ${specifier}`];
      const plugin = typeof exports.default === "function"
        ? new (exports.default as new (services: PluginServices) => Plugin)(this.services)
        : exports.default as Plugin;
      return this.install(plugin, manifest, options);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message.replace(/[\r\n]+/gu, " ") : String(error);
      return [`error: plugin failed to activate: ${manifest.name} (${reason})`];
    }
  }
}
