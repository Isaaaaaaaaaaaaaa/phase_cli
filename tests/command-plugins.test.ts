import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { EditorSession, SvgDocument, type DirectoryReader, type DirectoryEntry } from "../src/api.js";
import { EditorHost } from "../src/host/EditorHost.js";
import { NodeDirectoryReader } from "../src/host/NodeDirectoryReader.js";
import { CodeAssembly } from "../src/host/CodeAssembly.js";
import { DirCommand } from "../src/plugins/dir/DirCommand.js";
import { StatsCommand } from "../src/plugins/stats/StatsCommand.js";

class DirectoryStub implements DirectoryReader {
  public readonly path = "/fixed-directory";
  public constructor(private readonly entries: readonly DirectoryEntry[] = [], private readonly failure = false) {}
  public read(): readonly DirectoryEntry[] {
    if (this.failure) throw new Error("access denied");
    return this.entries;
  }
}
describe("independent dir command and adapter", () => {
  it("sorts mixed and hidden entries stably without mutating its input", () => {
    const entries: DirectoryEntry[] = [
      { name: "z.svg", kind: "file" }, { name: "b", kind: "directory" },
      { name: ".hidden", kind: "file" }, { name: "a", kind: "directory" },
      { name: "shortcut", kind: "link" }, { name: "socket", kind: "other" },
    ];
    const command = new DirCommand(new DirectoryStub(entries));
    const expected = ["[DIR]  a", "[DIR]  b", "[FILE]  .hidden", "[FILE]  z.svg", "[LINK]  shortcut", "[OTHER]  socket"];
    expect(command.execute()).toEqual(expected);
    expect(command.execute()).toEqual(expected);
    expect(entries[0]?.name).toBe("z.svg");
    expect(() => command.create([{ value: "arg", quoted: false }])).toThrow("usage: dir");
    expect(new DirCommand(new DirectoryStub()).execute()).toEqual(["(empty directory)"]);
    expect(() => new DirCommand(new DirectoryStub([], true)).execute()).toThrow("cannot read directory: /fixed-directory");
  });
  it("integrates with a real temporary directory including symlinks", () => {
    const directory = mkdtempSync(join(tmpdir(), "svg-dir-"));
    mkdirSync(join(directory, "docs"));
    writeFileSync(join(directory, ".hidden"), "hidden");
    writeFileSync(join(directory, "demo.svg"), "svg");
    symlinkSync(join(directory, "demo.svg"), join(directory, "link"));
    expect(new DirCommand(new NodeDirectoryReader(directory)).execute()).toEqual([
      "[DIR]  docs", "[FILE]  .hidden", "[FILE]  demo.svg", "[LINK]  link",
    ]);
    expect(() => new DirCommand(new NodeDirectoryReader(join(directory, "absent"))).execute()).toThrow(`cannot read directory: ${join(directory, "absent")}`);
  });
  it("does not require a document, and success/failure preserves redo", () => {
    for (const failure of [false, true]) {
      const host = new EditorHost(new DirectoryStub([], failure));
      new CodeAssembly().install(host);
      expect(host.run("dir")).toEqual(failure ? ["error: cannot read directory: /fixed-directory"] : ["(empty directory)"]);
      host.run("init");
      host.run("create rect r 1 2 3 4");
      host.run("move r 10 0");
      host.run("undo");
      const before = host.run("tree");
      host.run("dir");
      expect(host.run("tree")).toEqual(before);
      expect(host.run("redo")).toEqual(["rect#r moved to (11,2)"]);
    }
  });
  it("has byte-identical code/config assembly for a fixed real directory", async () => {
    const directory = mkdtempSync(join(tmpdir(), "svg-dir-parity-"));
    writeFileSync(join(directory, "a"), "a");
    mkdirSync(join(directory, "b"));
    const a = new EditorHost(new NodeDirectoryReader(directory));
    const b = new EditorHost(new NodeDirectoryReader(directory));
    new CodeAssembly().install(a);
    expect(await b.loader.config(resolve("plugins.config.json"))).toEqual([]);
    expect(b.run("dir").join("\n")).toBe(a.run("dir").join("\n"));
    expect(new EditorHost().run("dir")).toEqual(["error: unknown command: dir"]);
    expect(a.run("help")).toContain("  dir");
  });
});
describe("independent stats command", () => {
  it("counts empty documents and rejects parameters", () => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(10, 10));
    expect(new StatsCommand().execute(session)).toEqual(["(total 0, containers 0)"]);
    expect(() => new StatsCommand().create([{ value: "arg", quoted: false }])).toThrow("usage: stats");
  });
  it("counts leaves in first-appearance DFS order, containers separately", () => {
    const host = new EditorHost();
    new CodeAssembly().install(host);
    host.run("init");
    host.run("create g outer");
    host.run("create text t 1 2 \"a\" in outer");
    host.run("create circle c 1 2 3 in outer");
    host.run("create rect r 1 2 3 4");
    host.run("create text t2 2 3 \"b\"");
    expect(host.run("stats")).toEqual(["text: 2  circle: 1  rect: 1  (total 4, containers 1)"]);
    expect(new EditorHost().run("stats")).toEqual(["error: unknown command: stats"]);
    expect(host.run("help")).toContain("  stats");
    expect(host.run("undo")).toEqual(["text#t2 creation undone"]);
  });
});
