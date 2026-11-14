import { EditorError, type Command, type EditorCommand, type CommandToken,
  type DirectoryReader, type DirectoryEntry } from "../../api.js";

export class DirCommand implements Command, EditorCommand {
  public readonly name = "dir";
  public readonly usage = "dir";
  public readonly section = "Plugins" as const;
  public readonly category = "query" as const;
  public constructor(private readonly reader: DirectoryReader) {}
  public create(tokens: readonly CommandToken[]): EditorCommand {
    if (tokens.length) throw new EditorError("usage: dir");
    return this;
  }
  public execute(): readonly string[] {
    try {
      const ranks = { directory: 0, file: 1, link: 2, other: 3 };
      const markers = { directory: "DIR", file: "FILE", link: "LINK", other: "OTHER" };
      const entries = [...this.reader.read()].filter((entry) => entry.name !== "." && entry.name !== "..");
      entries.sort((a: DirectoryEntry, b: DirectoryEntry) =>
        ranks[a.kind] - ranks[b.kind] || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
      return entries.length ? entries.map((entry) => `[${markers[entry.kind]}]  ${entry.name}`) : ["(empty directory)"];
    } catch { throw new EditorError(`cannot read directory: ${this.reader.path}`); }
  }
}
