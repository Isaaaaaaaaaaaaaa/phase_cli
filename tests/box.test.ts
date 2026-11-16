import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { EditorHost } from "../src/host/EditorHost.js";
import { Shape, SvgDocument, ExtensionRegistry } from "../src/api.js";
import BoxPlugin from "../src/plugins/shape-box/BoxPlugin.js";
import { BoxProvider } from "../src/plugins/shape-box/BoxProvider.js";
import { BoxShape } from "../src/plugins/shape-box/BoxShape.js";
import manifest from "../src/plugins/shape-box/package.json" with { type: "json" };

/** Plugin-independent fake; no builtin plugin imports. */
class FakePart extends Shape {
  public constructor(id: string, private readonly type: string, private attrs: Record<string, string>) { super(id); }
  public get tagName(): string { return this.type; }
  public move(dx: number, dy: number): void { this.attrs.x = String(Number(this.attrs.x) + dx); this.attrs.y = String(Number(this.attrs.y) + dy); }
  public scale(factor: number): void { for (const name of ["x", "y", "width", "height"]) if (this.attrs[name]) this.attrs[name] = String(Number(this.attrs[name]) * factor); }
  public clone(): Shape { return new FakePart(this.id, this.type, { ...this.attrs }); }
  public summary(): string { return `${this.type}#${this.id}`; }
  public geometryDetails(): string { return ""; }
  protected geometryAttributes(): Record<string, string> { return this.attrs; }
  protected getSpecificAttribute(name: string): string | undefined { return this.attrs[name]; }
  protected setSpecificAttribute(name: string, value: string): { matched: boolean; previous?: string } {
    const previous = this.attrs[name];
    this.attrs[name] = value;
    return previous === undefined ? { matched: true } : { matched: true, previous };
  }
}
describe("independent box provider and package", () => {
  it("registers three extension points without other plugins and protects required parts", () => {
    const factory = { create(type: string, id: string, args: readonly string[]) {
      return new FakePart(id, type, { x: args[0] ?? "0", y: args[1] ?? "0", text: args[2] ?? "" });
    } };
    const registry = new ExtensionRegistry();
    new BoxPlugin({ shapeFactory: factory }).activate(registry);
    expect(registry.names("shapes")).toEqual(["box"]);
    expect(registry.names("attributes")).toEqual(["box-attributes"]);
    expect(registry.names("decorators")).toEqual(["box-type-label"]);
    const box = new BoxProvider(factory).create("n", ["10", "20", "100", "60", "Start"]);
    expect(box.typeName).toBe("box");
    expect(box.clone().typeName).toBe("box");
    const document = new SvgDocument(200, 100, [box]);
    expect(registry.setAttribute(document, box, "label", "Changed")).toBe("Start");
    expect(() => document.remove("n-rect")).toThrow("cannot detach required box part: n-rect");
    expect(() => document.ungroup("n")).toThrow("cannot ungroup composite shape: n");
    expect(registry.decorate(document, box)).toBe(" (box)");
    expect(() => new BoxShape("bad", [])).toThrow("invalid box structure: bad");
  });
});
describe("box integration and handler transactions", () => {
  const host = () => {
    const value = new EditorHost();
    value.install(new BoxPlugin(value.services), manifest);
    value.run("init");
    return value;
  };
  it("supports nested creation, whole-subtree move/scale and round-trip downgrade", () => {
    const editor = host();
    editor.run('create box n 10 20 100 60 "开始"');
    expect(editor.run("tree n")[0]).toBe("g#n (box)");
    expect(editor.run("move n 0 100")).toEqual(["box#n moved by (0,100)"]);
    expect(editor.run("undo")).toEqual(["box#n moved back by (0,-100)"]);
    editor.run('create box child 1 2 30 20 "嵌套" in n');
    expect(editor.run("scale n 2")).toEqual(["box#n scaled by 2"]);
    expect(editor.run("ungroup n")).toEqual(["error: cannot ungroup composite shape: n"]);
    expect(editor.run("addto child n-rect")).toEqual(["error: cannot detach required box part: n-rect"]);
    const directory = mkdtempSync(join(tmpdir(), "svg-box-"));
    const path = join(directory, "box.svg");
    editor.run(`save "${path}"`);
    expect(editor.run(`read "${path}"`)[0]).toContain("(6 elements)");
    const downgraded = new EditorHost();
    downgraded.run(`read "${path}"`);
    expect(downgraded.editor.editorSession.requireDocument().require("n").typeName).toBe("g");
  });
  it("makes each fill/label operation one undo unit and preserves history on failures", () => {
    const editor = host();
    editor.run('create box n 1 2 100 60 "before"');
    editor.run("set n fill red");
    expect(editor.editor.editorSession.requireDocument().require("n-rect").getAttribute("fill")).toBe("red");
    editor.run("undo");
    expect(editor.editor.editorSession.requireDocument().require("n-rect").getAttribute("fill")).toBe("#4a90d9");
    editor.run("redo");
    editor.run('set n label "after"');
    editor.run("undo");
    expect(editor.editor.editorSession.requireDocument().require("n-label").getAttribute("text")).toBe("before");
    editor.run("redo");
    expect(editor.editor.editorSession.requireDocument().require("n-label").getAttribute("text")).toBe("after");
    const before = editor.run("tree");
    editor.services.extensions.registerAttribute({
      name: "throw-partway", handles: (_shape, attr) => attr === "explode",
      apply: (document) => { document.require("n-rect").setAttribute("fill", "broken"); document.require("n-label").setAttribute("text", "broken"); throw new Error("partial failure"); },
    });
    expect(editor.run("set n explode now")[0]).toContain("error:");
    expect(editor.run("tree")).toEqual(before);
    editor.run("undo");
    expect(editor.editor.editorSession.requireDocument().require("n-label").getAttribute("text")).toBe("before");
    editor.services.extensions.registerAttribute({ name: "conflict", handles: (_shape, attr) => attr === "label", apply: () => undefined });
    expect(editor.run("set n label collision")[0]).toContain("error: conflicting attribute handlers:");
    expect(editor.run("redo")[0]).toContain("after");
  });
  it("rejects derived ID collisions, invalid import and unauthorized attributes atomically", () => {
    const editor = host();
    editor.run("create rect clash-rect 0 0 1 1");
    const before = editor.run("tree");
    expect(editor.run('create box clash 0 0 1 1 "x"')).toEqual(["error: id already exists: clash-rect"]);
    expect(editor.run("tree")).toEqual(before);
    editor.run('create box n 1 2 3 4 "x"');
    expect(editor.run("delete n-label")).toEqual(["error: cannot detach required box part: n-label"]);
    expect(editor.run("group bad n-rect")).toEqual(["error: cannot detach required box part: n-rect"]);
    expect(editor.run("set clash-rect label wrong")).toEqual(["error: unknown attribute: label"]);
    const directory = mkdtempSync(join(tmpdir(), "invalid-box-"));
    const path = join(directory, "invalid.svg");
    writeFileSync(path, '<svg width="10" height="10"><g id="bad" data-kind="box"/></svg>');
    const saved = editor.run("tree");
    expect(editor.run(`read "${path}"`)[0]).toContain("error: invalid box structure:");
    expect(editor.run("tree")).toEqual(saved);
    expect(editor.run("delete n")).toEqual(["box#n deleted"]);
    editor.run("undo");
    expect(editor.editor.editorSession.requireDocument().require("n").typeName).toBe("box");
  });
});
