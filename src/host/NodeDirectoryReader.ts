import { readdirSync } from "node:fs";
import type { DirectoryEntry, DirectoryReader } from "../api.js";

export class NodeDirectoryReader implements DirectoryReader {
  public constructor(public readonly path = process.cwd()) {}
  public read(): readonly DirectoryEntry[] {
    return readdirSync(this.path, { withFileTypes: true }).map((entry) => ({
      name: entry.name,
      kind: entry.isDirectory() ? "directory" : entry.isFile() ? "file" : entry.isSymbolicLink() ? "link" : "other",
    }));
  }
}
