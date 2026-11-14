import type { Command, EditorCommand, EditorSession, CommandToken } from "../../api.js";
import { EditorError } from "../../api.js";

export class StatsCommand implements Command, EditorCommand {
  public readonly name = "stats";
  public readonly usage = "stats";
  public readonly section = "Plugins" as const;
  public readonly category = "query" as const;
  public create(tokens: readonly CommandToken[]): EditorCommand {
    if (tokens.length) throw new EditorError("usage: stats");
    return this;
  }
  public execute(session: EditorSession): readonly string[] {
    const counts = new Map<string, number>();
    let total = 0;
    let containers = 0;
    for (const shape of session.requireDocument().walk()) {
      if (shape.isContainer) containers++;
      else {
        counts.set(shape.typeName, (counts.get(shape.typeName) ?? 0) + 1);
        total++;
      }
    }
    const types = [...counts].map(([type, count]) => `${type}: ${count}`).join("  ");
    return [`${types ? `${types}  ` : ""}(total ${total}, containers ${containers})`];
  }
}
