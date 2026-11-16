export interface DirectoryEntry {
  readonly name: string;
  readonly kind: "directory" | "file" | "link" | "other";
}
export interface DirectoryReader {
  readonly path: string;
  read(): readonly DirectoryEntry[];
}
