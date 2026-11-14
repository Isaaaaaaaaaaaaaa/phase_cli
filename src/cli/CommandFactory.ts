import { CommandTokenizer } from "./CommandTokenizer.js";
import { EditorError } from "../domain/EditorError.js";
import type { EditorCommand } from "../application/commands/EditorCommand.js";
import type { ExtensionRegistry } from "../extensions/ExtensionRegistry.js";

export class CommandFactory {
  private readonly tokenizer = new CommandTokenizer();
  public constructor(private readonly extensions: ExtensionRegistry) {}
  public fromLine(input: string): EditorCommand | undefined {
    const tokens = this.tokenizer.tokenize(input);
    const name = tokens[0]?.value;
    if (name === undefined) return undefined;
    const command = this.extensions.command(name);
    if (!command) throw new EditorError(`unknown command: ${name}`);
    return command.create(tokens.slice(1));
  }
}
