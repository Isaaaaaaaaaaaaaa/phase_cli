import type { EditorCommand, ExtensionRegistry } from "../../api.js";

export class HelpCommand implements EditorCommand {
  public readonly category = "query" as const;
  public constructor(private readonly extensions: ExtensionRegistry) {}

  public execute(): readonly string[] {
    const lines: string[] = [];
    for (const section of ["Document", "Edit", "Display", "History", "Plugins"] as const) {
      const commands = this.extensions.commands().filter((command) => command.section === section);
      if (!commands.length) continue;
      lines.push(`${section}:`, ...commands.map((command) => `  ${command.usage}`));
    }
    return lines;
  }
}
