import type { EditorSession, CommandCategory, EditorCommand } from "../../api.js";

export class CanvasCommand implements EditorCommand {
  public readonly resetsHistory = true;
  public readonly eventKind = "edit" as const;

  public constructor(
    private readonly width?: number,
    private readonly height?: number,
  ) {}

  public get category(): CommandCategory {
    return this.width === undefined ? "query" : "io";
  }

  public execute(session: EditorSession): readonly string[] {
    const document = session.requireDocument();
    if (this.width === undefined || this.height === undefined) {
      return [`canvas ${document.width}x${document.height}`];
    }
    document.resize(this.width, this.height);
    return [`canvas resized to ${this.width}x${this.height}`];
  }
}
