import type { EditorCommand } from "../application/commands/EditorCommand.js";
export interface CommandToken {
  readonly value: string;
  readonly quoted: boolean;
}

export interface Command {
  readonly name: string;
  readonly usage: string;
  readonly section: "Document" | "Edit" | "Display" | "History" | "Plugins";
  create(tokens: readonly CommandToken[]): EditorCommand;
}
