import type { Context } from "@deepseek-ai/cordis";
import { defineTool, ToolContextUnavailableError, type ToolRunContext } from "@deepseek-ai/dsh-tools";
import { WorkspacePaths } from "./WorkspacePaths.js";
import { WorkbenchSession } from "./WorkbenchSession.js";

export class SvgWorkbench {
  private readonly sessions = new WeakMap<object, WorkbenchSession>();
  private readonly paths: WorkspacePaths;
  public constructor(root = process.cwd()) { this.paths = new WorkspacePaths(root); }
  public session(scope: object): WorkbenchSession {
    let session = this.sessions.get(scope);
    if (!session) {
      session = new WorkbenchSession(this.paths);
      this.sessions.set(scope, session);
    }
    return session;
  }
  private execution(exec: ToolRunContext): WorkbenchSession {
    exec.signal.throwIfAborted();
    if (!exec.agent) throw new ToolContextUnavailableError("SVG tools require an owning agent scope.");
    return this.session(exec.agent);
  }
  public register(context: Context): void {
    const output = { schema: { type: "json" as const }, render: (_args: unknown, value: unknown) => [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
    context.tools.register(defineTool({
      name: "svg_inspect", description: "Inspect an SVG file inside the configured workspace. Returns IDs and nesting without writing or replacing the current edit session.",
      parameters: { path: { type: "string", required: true } }, output,
      execute: async (args, exec) => this.execution(exec).inspect(args.path),
    }));
    context.tools.register(defineTool({
      name: "svg_edit", description: "Apply a batch of SVG editing commands atomically. Supports rect/circle/ellipse/line/text/g/box, labels, grouping and transforms. File writes require svg_save. A failure discards the entire batch.",
      parameters: { commands: { type: "array", items: { type: "string" }, required: true }, source: { type: "string" } }, output,
      execute: async (args, exec) => this.execution(exec).edit(args.commands, args.source, exec.signal),
    }));
    context.tools.register(defineTool({
      name: "svg_history", description: "Undo or redo one entire successful SVG editing tool batch in the current agent session.",
      parameters: { action: { type: "string", enum: ["undo", "redo"], required: true } }, output,
      execute: async (args, exec) => {
        if (args.action !== "undo" && args.action !== "redo") throw new Error("Invalid history action.");
        return this.execution(exec).history(args.action);
      },
    }));
    context.tools.register(defineTool({
      name: "svg_save", description: "Save the current agent's SVG into a .svg file inside the configured workspace. Overwrites the requested file; use only when the user wants the output saved.",
      parameters: { path: { type: "string", required: true } }, output,
      execute: async (args, exec) => this.execution(exec).save(args.path),
    }));
  }
}
