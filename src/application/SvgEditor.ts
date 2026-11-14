import type {
  EditorCommand,
  IoCommand,
  ReversibleCommand,
} from "./commands/EditorCommand.js";
import { EditorSession } from "./EditorSession.js";
import { HistoryManager } from "./HistoryManager.js";
import type { ExtensionRegistry } from "../extensions/ExtensionRegistry.js";

export class SvgEditor {
  public constructor(
    private readonly session = new EditorSession(),
    private readonly history = new HistoryManager(),
    private readonly extensions?: ExtensionRegistry,
  ) {}

  public execute(command: EditorCommand): readonly string[] {
    if (command.category === "edit") {
      const output = this.history.execute(command as ReversibleCommand, this.session);
      this.extensions?.observe({ kind: "edit", document: this.session.requireDocument() });
      return output;
    }
    const output = command.execute(this.session);
    if (command.category === "io") {
      this.history.block((command as IoCommand).resetsHistory);
      this.extensions?.observe({ kind: command.eventKind ?? "baseline", document: this.session.requireDocument() });
    }
    if (command.category === "history") this.extensions?.observe({ kind: "history", document: this.session.requireDocument() });
    return output;
  }

  public get historyManager(): HistoryManager {
    return this.history;
  }
  public get editorSession(): EditorSession { return this.session; }
}
