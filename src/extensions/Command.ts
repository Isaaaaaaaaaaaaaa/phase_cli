import type { EditorCommand } from "../application/commands/EditorCommand.js";
import type { CommandToken } from "../cli/CommandTokenizer.js";

export interface Command {
  readonly name: string;
  readonly usage: string;
  readonly section: "Document" | "Edit" | "Display" | "History" | "Plugins";
  create(tokens: readonly CommandToken[]): EditorCommand;
}
