import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { SvgDocument, GroupShape, TreeRenderer } from "../src/api.js";
import { ModifiedStar } from "../src/plugins/modified-star/ModifiedStar.js";
import { EditorHost } from "../src/host/EditorHost.js";
import { CodeAssembly } from "../src/host/CodeAssembly.js";

describe("independent dirty state machine", () => {
  it("compares content with the baseline, propagates ancestors, and restores on undo", () => {
    const document = new SvgDocument(100, 100, [new GroupShape("outer", [new GroupShape("inner")])]);
    const decorator = new ModifiedStar();
    decorator.observe({ kind: "baseline", document });
    expect(decorator.label(document)).toBeUndefined();
    const saved = document.clone();
    document.require("inner").setAttribute("fill", "red");
    decorator.observe({ kind: "edit", document });
    expect(decorator.label(document, document.require("inner"))).toBe("*");
    expect(decorator.label(document, document.require("outer"))).toBe("*");
    expect(decorator.label(document)).toBe("*");
    decorator.observe({ kind: "baseline", document });
    expect(decorator.label(document)).toBeUndefined();
    document.require("inner").setAttribute("fill", "blue");
    expect(decorator.label(document)).toBe("*");
    document.require("inner").setAttribute("fill", "red");
    decorator.observe({ kind: "history", document });
    expect(decorator.label(document)).toBeUndefined();
    expect(decorator.label(saved)).toBe("*");
    expect(new ModifiedStar().label(document)).toBe("*");
  });
});
describe("tree decorators with edit/save/history", () => {
  it("coexists with box annotation, updates after successful save and undo", () => {
    const host = new EditorHost();
    new CodeAssembly().install(host);
    host.run("init");
    expect(host.run("tree")).toEqual(["svg (800x600)"]);
    host.run('create box n 1 2 100 60 "before"');
    expect(host.run("tree")).toContain("└── g#n (box) *");
    const directory = mkdtempSync(join(tmpdir(), "svg-star-"));
    host.run(`save "${join(directory, "saved.svg")}"`);
    expect(host.run("tree")).toContain("└── g#n (box)");
    host.run('set n label "after"');
    expect(host.run("tree")).toContain("└── g#n (box) *");
    host.run("undo");
    expect(host.run("tree")).toContain("└── g#n (box)");
    host.run("redo");
    expect(host.run("tree")).toContain("└── g#n (box) *");
    host.run("save /missing-star-directory/saved.svg");
    expect(host.run("tree")).toContain("└── g#n (box) *");
  });
  it("preserves exact tree baseline without decorators and marks canvas changes", () => {
    const host = new EditorHost();
    host.run("init 10 10");
    host.run("create g g");
    const baseline = new TreeRenderer().render(host.editor.editorSession.requireDocument());
    expect(host.run("tree")).toEqual(baseline);
    new CodeAssembly().install(host);
    host.run("init 10 10");
    host.run("canvas 20 20");
    expect(host.run("tree")[0]).toBe("svg (20x20) *");
  });
});
