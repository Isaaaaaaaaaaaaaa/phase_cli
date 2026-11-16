import { mkdtempSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect } from "vitest";
import { EditorHost } from "../src/host/EditorHost.js";
import { CodeAssembly } from "../src/host/CodeAssembly.js";
import type { Plugin } from "../src/api.js";

describe("assignment acceptance boundaries", () => {
  it("can enable stats and dir separately with matching help and no document requirement for dir", async () => {
    const directory = mkdtempSync(join(tmpdir(), "svg-independent-command-"));
    for (const name of ["stats", "dir"] as const) {
      const other = name === "stats" ? "dir" : "stats";
      const config = join(directory, `${name}.json`);
      writeFileSync(config, JSON.stringify({ plugins: [
        { module: resolve(`src/plugins/${other}`), enabled: false },
        { module: resolve(`src/plugins/${name}`) },
      ] }));
      const host = new EditorHost({ path: directory, read: () => [] });
      expect(await host.loader.config(config)).toEqual([]);
      expect(host.run("help")).toContain(`  ${name}`);
      expect(host.run("help")).not.toContain(`  ${other}`);
      expect(host.run(other)).toEqual([`error: unknown command: ${other}`]);
      if (name === "dir") expect(host.run(name)).toEqual(["(empty directory)"]);
      else {
        host.run("init");
        expect(host.run(name)).toEqual(["(total 0, containers 0)"]);
      }
    }
  });

  it("counts all box leaves and nested containers without counting the SVG root", () => {
    const host = new EditorHost();
    new CodeAssembly().install(host);
    host.run("init");
    host.run('create box parent 0 0 100 60 "父"');
    host.run('create box child 10 10 50 30 "子" in parent');
    host.run("create circle c 1 2 3 in child");
    expect(host.run("stats")).toEqual(["rect: 2  text: 2  circle: 1  (total 5, containers 2)"]);
  });

  it("undoes and redoes a successful multi-part set as exactly one history unit", () => {
    const host = new EditorHost();
    new CodeAssembly().install(host);
    host.run("init");
    host.run('create box n 0 0 100 60 "before"');
    host.services.extensions.registerAttribute({
      name: "two-parts",
      handles: (shape, attr) => shape.typeName === "box" && attr === "both",
      apply(document, _shape, _attr, value) {
        document.require("n-rect").setAttribute("fill", value);
        return document.require("n-label").setAttribute("text", value);
      },
    });
    host.run("set n both red");
    const changed = host.run("tree");
    host.run("undo");
    expect(host.editor.editorSession.requireDocument().require("n-rect").getAttribute("fill")).toBe("#4a90d9");
    expect(host.editor.editorSession.requireDocument().require("n-label").getAttribute("text")).toBe("before");
    host.run("redo");
    expect(host.run("tree")).toEqual(changed);
    host.run("undo");
    host.run("undo");
    expect(host.editor.editorSession.requireDocument().count()).toBe(0);
  });

  it("rejects a handles callback that changes canvas size and preserves redo", () => {
    const host = new EditorHost();
    host.run("init 100 100");
    host.run("create rect r 1 2 3 4");
    host.run("move r 10 0");
    host.run("undo");
    host.services.extensions.registerAttribute({
      name: "resize-during-query",
      handles() { host.editor.editorSession.requireDocument().resize(20, 20); return true; },
      apply: () => undefined,
    });
    expect(host.run("set r fill red")).toEqual(["error: attribute handler violated handles contract: resize-during-query"]);
    expect(host.editor.editorSession.requireDocument().width).toBe(100);
    expect(host.editor.editorSession.requireDocument().height).toBe(100);
    expect(host.run("redo")).toEqual(["rect#r moved to (11,2)"]);
  });

  it("rejects a wrong required box-part type and duplicate IDs with or without the box plugin", () => {
    const directory = mkdtempSync(join(tmpdir(), "svg-box-import-boundary-"));
    const wrong = join(directory, "wrong.svg");
    const duplicate = join(directory, "duplicate.svg");
    writeFileSync(wrong, '<svg width="100" height="100"><g id="n" data-kind="box"><circle id="n-rect" cx="1" cy="2" r="3"/><text id="n-label" x="0" y="0">x</text></g></svg>');
    writeFileSync(duplicate, '<svg width="100" height="100"><g id="n" data-kind="box"><rect id="n-rect" x="0" y="0" width="1" height="1"/><text id="n-label" x="0" y="0">x</text></g><rect id="n-rect" x="0" y="0" width="1" height="1"/></svg>');
    for (const enabled of [false, true]) {
      const host = new EditorHost();
      if (enabled) new CodeAssembly().install(host);
      host.run("init");
      host.run("create rect preserved 1 2 3 4");
      const before = host.run("tree");
      expect(host.run(`read "${duplicate}"`)).toEqual(["error: id already exists: n-rect"]);
      expect(host.run("tree")).toEqual(before);
      const output = host.run(`read "${wrong}"`);
      if (enabled) {
        expect(output[0]).toContain("error: invalid box structure: n");
        expect(host.run("tree")).toEqual(before);
      } else {
        expect(host.editor.editorSession.requireDocument().require("n").typeName).toBe("g");
      }
    }
  });

  it("rolls back all categories on duplicate registration and retains earlier plugins", () => {
    const host = new EditorHost();
    const rect = host.services.extensions.shape("rect");
    if (!rect) throw new Error("default rect provider missing");
    const plugin: Plugin = { activate(context) {
      context.registerCommand({ name: "ghost", usage: "ghost", section: "Plugins",
        create: () => ({ category: "query", execute: () => ["ghost"] }) });
      context.registerDecorator({ name: "ghost-label", label: () => "*" });
      context.registerAttribute({ name: "ghost-attr", handles: () => true, apply: () => undefined });
      context.registerShape(rect);
    } };
    expect(host.loader.install(plugin, { name: "cross-category", contributes: {
      shapes: ["rect"], commands: ["ghost"], decorators: ["ghost-label"], attributes: ["ghost-attr"],
    } })).toEqual(["error: duplicate registration: shapes/rect"]);
    expect(host.services.extensions.command("ghost")).toBeUndefined();
    expect(host.services.extensions.names("decorators")).toEqual([]);
    expect(host.services.extensions.names("attributes")).toEqual([]);
    expect(host.run("help")).toContain("  init [w] [h]");
  });

  it("keeps dir outside the I/O history barrier and keeps its directory independent of SVG paths", () => {
    const directory = mkdtempSync(join(tmpdir(), "svg-dir-document-path-"));
    const svg = join(directory, "document.svg");
    const host = new EditorHost({ path: "/fixed-cli-cwd", read: () => [{ name: ".hidden", kind: "file" }] });
    new CodeAssembly().install(host);
    host.run("init");
    host.run("create rect r 1 2 3 4");
    host.run(`save "${svg}"`);
    expect(host.run("dir")).toEqual(["[FILE]  .hidden"]);
    expect(host.run("undo")).toEqual(["error: undo not allowed after io command"]);
    host.run(`read "${svg}"`);
    expect(host.services.directory.path).toBe("/fixed-cli-cwd");
    host.run("move r 10 0");
    host.run("dir");
    expect(host.run("undo")).toEqual(["rect#r moved back to (1,2)"]);
  });
});
