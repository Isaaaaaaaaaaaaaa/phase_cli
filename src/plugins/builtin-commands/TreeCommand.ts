import type { EditorSession, TreeRenderer, EditorCommand } from "../../api.js";

export class TreeCommand implements EditorCommand {
  public readonly category = "query" as const;

  public constructor(
    private readonly renderer: TreeRenderer,
    private readonly rootId?: string,
  ) {}

  public execute(session: EditorSession): readonly string[] {
    return this.renderer.render(session.requireDocument(), this.rootId);
  }
}
