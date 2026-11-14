import type { Command, CommandToken, EditorCommand } from "../../api.js";

export class CommandDefinition implements Command {
  public constructor(
    public readonly name: string,
    public readonly usage: string,
    public readonly section: Command["section"],
    private readonly builder: (tokens: readonly CommandToken[]) => EditorCommand,
  ) {}
  public create(tokens: readonly CommandToken[]): EditorCommand { return this.builder(tokens); }
}
