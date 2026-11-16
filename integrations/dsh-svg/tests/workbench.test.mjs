import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Context, Service } from "@deepseek-ai/cordis";
import { ToolsService } from "@deepseek-ai/dsh-tools";
import { apply, inject, SvgWorkbench, WorkspacePaths } from "../lib/index.js";

test("actual Cordis + DSH registry loads, calls and unloads the plugin", async () => {
  class PromptFixture extends Service {
    constructor(ctx) { super(ctx, "systemPrompt"); }
    tools() { return () => {}; }
  }
  const context = new Context();
  const prompt = await context.plugin(PromptFixture);
  const tools = await context.plugin(ToolsService);
  const root = mkdtempSync(join(tmpdir(), "dsh-svg-host-"));
  const plugin = await context.plugin({ name: "dsh-svg-workbench", inject, apply }, { root });
  assert.deepEqual(context.tools.definitions().map((tool) => tool.name).sort(), ["svg_edit", "svg_history", "svg_inspect", "svg_save"]);
  const signal = new AbortController().signal;
  const agent = {};
  const execution = { agent, signal };
  const edited = await context.tools.get("svg_edit").execute({ commands: ['create box n 10 20 100 60 "开始"', 'set n label "结束"'] }, execution);
  assert.equal(edited.elements, 3);
  assert.ok(edited.tree.some((line) => line.includes("结束")));
  const saved = await context.tools.get("svg_save").execute({ path: "demo.svg" }, execution);
  assert.equal(saved.elements, 3);
  assert.match(readFileSync(join(root, "demo.svg"), "utf8"), /data-kind="box"/);
  const inspected = await context.tools.get("svg_inspect").execute({ path: "demo.svg" }, execution);
  assert.equal(inspected.elements, 3);
  assert.equal(context.tools.get("svg_edit").output.render({}, edited)[0].type, "text");
  await assert.rejects(context.tools.get("svg_edit").execute({ commands: [42] }, execution));
  await assert.rejects(context.tools.get("svg_edit").execute({ commands: ["init"] }, { signal }), /owning agent/);
  await plugin.dispose();
  assert.equal(context.tools.get("svg_edit"), undefined);
  await tools.dispose();
  await prompt.dispose();
  console.log("REAL_DSH_REGISTRY: load + schema validation + scoped call + save + inspect + unload PASS");
});

test("agent sessions isolate state and failed batches preserve history", () => {
  const root = mkdtempSync(join(tmpdir(), "dsh-svg-isolation-"));
  const workbench = new SvgWorkbench(root);
  const a = workbench.session({});
  const b = workbench.session({});
  const signal = new AbortController().signal;
  a.edit(["create rect a 1 2 3 4"], undefined, signal);
  b.edit(["create circle b 5 6 7"], undefined, signal);
  assert.throws(() => a.edit(["move a 10 0", "delete absent"], undefined, signal));
  a.save("a.svg");
  assert.match(readFileSync(join(root, "a.svg"), "utf8"), /x="1"/);
  assert.equal(a.history("undo").elements, 0);
  assert.equal(a.history("redo").elements, 1);
  b.save("b.svg");
  assert.match(readFileSync(join(root, "b.svg"), "utf8"), /id="b"/);
  const aborted = new AbortController();
  aborted.abort();
  assert.throws(() => a.edit(["move a 5 0"], undefined, aborted.signal));
  assert.throws(() => a.edit(["save outside.svg"], undefined, signal), /dedicated tools/);
});

test("workspace paths reject traversal, external symlinks and non-SVG outputs", () => {
  const root = mkdtempSync(join(tmpdir(), "dsh-svg-paths-"));
  const outside = mkdtempSync(join(tmpdir(), "dsh-svg-outside-"));
  writeFileSync(join(outside, "outside.svg"), "<svg/>");
  symlinkSync(outside, join(root, "external"));
  const paths = new WorkspacePaths(root);
  assert.throws(() => paths.resolve("../escape.svg"), /outside/);
  assert.throws(() => paths.resolve("external/outside.svg", true), /outside/);
  assert.throws(() => paths.resolve("output.txt"), /Only .svg/);
  assert.equal(paths.resolve("new.svg"), join(paths.root, "new.svg"));
});
