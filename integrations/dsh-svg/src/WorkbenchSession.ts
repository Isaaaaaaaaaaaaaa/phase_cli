import { EditorHost, CodeAssembly } from "../../../src/host/api.js";
import { SvgDocument, TreeRenderer } from "../../../src/api.js";
import { WorkspacePaths } from "./WorkspacePaths.js";

export type WorkbenchResult = {
  output: string[];
  tree: string[];
  elements: number;
};

/** Each agent owns this state; one tool batch commits once or changes nothing. */
export class WorkbenchSession {
  private document: SvgDocument | undefined;
  private saved: SvgDocument | undefined;
  private readonly undoStack: (SvgDocument | undefined)[] = [];
  private readonly redoStack: (SvgDocument | undefined)[] = [];
  public constructor(private readonly paths: WorkspacePaths) {}

  private host(): EditorHost {
    const host = new EditorHost();
    new CodeAssembly().install(host);
    if (this.document) host.editor.editorSession.replaceDocument(this.document.clone());
    return host;
  }
  public inspect(path: string): WorkbenchResult {
    const host = this.host();
    const result = host.services.repository.read(this.paths.resolve(path, true));
    return { output: [...result.warnings], tree: [...new TreeRenderer().render(result.document)], elements: result.document.count() };
  }
  public edit(commands: readonly string[], source: string | undefined, signal: AbortSignal): WorkbenchResult {
    signal.throwIfAborted();
    if (commands.length === 0 || commands.length > 100) throw new Error("Provide between 1 and 100 editing commands.");
    const host = this.host();
    let baseline = this.saved?.clone();
    if (source !== undefined) {
      const document = host.services.repository.read(this.paths.resolve(source, true)).document;
      host.editor.editorSession.replaceDocument(document);
      baseline = document.clone();
    } else if (!host.editor.editorSession.currentDocument) {
      host.run("init");
      baseline = host.editor.editorSession.requireDocument().clone();
    }
    host.services.extensions.observe({ kind: "baseline", document: baseline ?? host.editor.editorSession.requireDocument() });
    const allowed = new Set(["init", "create", "delete", "move", "scale", "set", "group", "ungroup", "addto", "front", "back"]);
    const output: string[] = [];
    for (const command of commands) {
      signal.throwIfAborted();
      if (command.length > 2048 || /[\r\n]/u.test(command) || !allowed.has(command.trim().split(/\s+/u)[0] ?? "")) throw new Error("Only single-line editing commands are accepted; use dedicated tools for file access and history.");
      const lines = host.run(command);
      const error = lines.find((line) => line.startsWith("error:"));
      if (error) throw new Error(error);
      output.push(...lines);
      if (command.trim().split(/\s+/u)[0] === "init") baseline = host.editor.editorSession.requireDocument().clone();
    }
    signal.throwIfAborted();
    const document = host.editor.editorSession.requireDocument().clone();
    this.undoStack.push(this.document?.clone());
    this.redoStack.length = 0;
    this.document = document;
    this.saved = baseline;
    return { output, tree: [...host.run("tree")], elements: document.count() };
  }
  public history(action: "undo" | "redo"): WorkbenchResult {
    const from = action === "undo" ? this.undoStack : this.redoStack;
    const to = action === "undo" ? this.redoStack : this.undoStack;
    if (from.length === 0) throw new Error(`Nothing to ${action}.`);
    to.push(this.document?.clone());
    this.document = from.pop()?.clone();
    const host = this.host();
    if (!this.document) return { output: [action], tree: [], elements: 0 };
    host.services.extensions.observe({ kind: "baseline", document: this.saved ?? this.document });
    return { output: [action], tree: [...host.run("tree")], elements: this.document.count() };
  }
  public save(path: string): { path: string; elements: number } {
    if (!this.document) throw new Error("No SVG document. Use svg_edit first.");
    const target = this.paths.resolve(path);
    this.host().services.repository.write(target, this.document);
    this.saved = this.document.clone();
    return { path: target, elements: this.document.count() };
  }
}
