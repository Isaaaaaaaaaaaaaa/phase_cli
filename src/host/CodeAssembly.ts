import type { EditorHost } from "./EditorHost.js";

/** Optional plugin selection lives here; default builtins are installed by EditorHost. */
export class CodeAssembly {
  public install(host: EditorHost): void {
    // No optional plugins at the framework milestone.
    host.services.extensions.commands();
  }
}
