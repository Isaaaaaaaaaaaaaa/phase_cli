import type { EditorHost } from "./EditorHost.js";
import StatsPlugin from "../plugins/stats/StatsPlugin.js";
import DirPlugin from "../plugins/dir/DirPlugin.js";
import statsManifest from "../plugins/stats/package.json" with { type: "json" };
import dirManifest from "../plugins/dir/package.json" with { type: "json" };

/** Optional plugin selection lives here; default builtins are installed by EditorHost. */
export class CodeAssembly {
  public install(host: EditorHost): void {
    host.install(new StatsPlugin(), statsManifest);
    host.install(new DirPlugin(host.services), dirManifest);
  }
}
