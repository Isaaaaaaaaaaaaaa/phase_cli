import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { EditorHost } from "../src/host/EditorHost.js";
import type { PluginContext, Command, EditorCommand, Plugin } from "../src/api.js";

class QueryCommand implements EditorCommand {
  public readonly category = "query" as const;
  public execute(): readonly string[] { return ["query result"]; }
}
class QueryContribution implements Command {
  public readonly usage = "sample";
  public readonly section = "Plugins" as const;
  public constructor(public readonly name = "sample") {}
  public create(): EditorCommand { return new QueryCommand(); }
}
class SamplePlugin implements Plugin {
  public activate(context: PluginContext): void { context.registerCommand(new QueryContribution()); }
}

describe("plugin registration transaction", () => {
  it("validates code activation against manifest and commits only matches", () => {
    const host = new EditorHost();
    expect(host.loader.install(new SamplePlugin(), { name: "sample-package", contributes: { commands: ["sample"] } })).toEqual([]);
    expect(host.run("sample")).toEqual(["query result"]);
    expect(host.run("help")).toContain("  sample");
  });
  it("rolls back manifest mismatch and partial throwing activation", () => {
    const host = new EditorHost();
    const mismatch = host.loader.install(new SamplePlugin(), { name: "bad", contributes: { commands: ["wrong"] } });
    expect(mismatch[0]).toContain("error: plugin manifest mismatch: bad (declared:");
    expect(host.run("sample")).toEqual(["error: unknown command: sample"]);
    const throwing: Plugin = { activate(context) {
      context.registerCommand(new QueryContribution());
      throw new Error("partially failed");
    } };
    expect(host.loader.install(throwing, { name: "throws" })).toEqual(["error: plugin failed to activate: throws (partially failed)"]);
    expect(host.services.extensions.command("sample")).toBeUndefined();
    expect(host.run("init")).toEqual(["canvas 800x600 created"]);
  });
  it("rejects duplicate registration against committed and staged entries", () => {
    const host = new EditorHost();
    const existing: Plugin = { activate(context) {
      context.registerCommand(new QueryContribution("sample"));
      context.registerCommand(new QueryContribution("init"));
    } };
    expect(host.loader.install(existing, { name: "duplicate", contributes: { commands: ["sample", "init"] } })).toEqual(["error: duplicate registration: commands/init"]);
    expect(host.services.extensions.command("sample")).toBeUndefined();
    const staged: Plugin = { activate(context) {
      context.registerCommand(new QueryContribution());
      context.registerCommand(new QueryContribution());
    } };
    expect(host.loader.install(staged, { name: "stage" })).toEqual(["error: duplicate registration: commands/sample"]);
  });
  it("rejects async activation without publishing registrations or an unhandled rejection", async () => {
    const host = new EditorHost();
    const asynchronous = { async activate(context: PluginContext) {
      context.registerCommand(new QueryContribution());
      await Promise.resolve();
      throw new Error("async failure");
    } };
    expect(host.loader.install(asynchronous as unknown as Plugin, { name: "async-plugin" })).toEqual(["error: plugin failed to activate: async-plugin (activate must be synchronous)"]);
    await Promise.resolve();
    expect(host.services.extensions.command("sample")).toBeUndefined();
  });
});

describe("generic configuration loader", () => {
  it("reports missing/no-default/evaluation failures and continues later entries", async () => {
    const base = mkdtempSync(join(tmpdir(), "svg-plugins-"));
    const module = (name: string, source: string, commands: string[] = []) => {
      const directory = join(base, name);
      mkdirSync(directory);
      writeFileSync(join(directory, "package.json"), JSON.stringify({ name, type: "module", main: "index.mjs", contributes: { commands } }));
      writeFileSync(join(directory, "index.mjs"), source);
      return `./${name}`;
    };
    const noDefault = module("no-default", "export const name = 'no-default';");
    const evaluation = module("evaluation", "import './missing-dependency.mjs'; export default {};");
    const activates = module("activate-error", "export default class { activate(ctx) { ctx.registerCommand({name:'ghost',create(){return {category:'query',execute(){return []}}}}); throw new Error('boom'); } }");
    const mismatch = module("mismatch", "export default class { activate() {} }", ["declared"]);
    const good = module("good", "export default class { activate(ctx, options) { ctx.registerCommand({name:'sample', usage:'sample', section:'Plugins', create(){ return {category:'query', execute(){return [options.value]}} }}) } }", ["sample"]);
    const config = join(base, "plugins.config.json");
    writeFileSync(config, JSON.stringify({ plugins: [
      { module: "./absent" }, { module: noDefault }, { module: evaluation },
      { module: activates }, { module: mismatch },
      { module: "./skipped", enabled: false },
      { module: good, options: { value: "configured" } },
    ] }));
    const host = new EditorHost();
    const errors = await host.loader.config(config);
    expect(errors[0]).toBe("error: plugin not found: ./absent");
    expect(errors[1]).toBe("error: plugin has no default export: ./no-default");
    expect(errors[2]).toContain("error: plugin failed to activate: evaluation");
    expect(errors[3]).toBe("error: plugin failed to activate: activate-error (boom)");
    expect(errors[4]).toContain("error: plugin manifest mismatch: mismatch");
    expect(errors).toHaveLength(5);
    expect(host.services.extensions.command("ghost")).toBeUndefined();
    expect(host.run("sample")).toEqual(["configured"]);
  });
  it("starts with defaults on invalid JSON/structure/missing config", async () => {
    const base = mkdtempSync(join(tmpdir(), "svg-config-"));
    const config = join(base, "config.json");
    const host = new EditorHost();
    for (const source of ["{broken", "null", "[]", '{"plugins":[{}]}', '{"plugins":[null]}', '{"plugins":{}}']) {
      writeFileSync(config, source);
      expect(await host.loader.config(config)).toEqual(["error: invalid plugin config"]);
    }
    expect(await host.loader.config(join(base, "missing"))).toEqual(["error: invalid plugin config"]);
    expect(host.run("create rect a 0 0 1 1")).toEqual(["error: no document. use 'init' or 'read' first"]);
    expect(host.run("help")).toContain("  undo");
  });
});
