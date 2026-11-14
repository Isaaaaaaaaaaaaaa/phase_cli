import { existsSync, realpathSync, statSync } from "node:fs";
import { resolve, dirname, extname, sep } from "node:path";

export class WorkspacePaths {
  public readonly root: string;
  public constructor(root: string) { this.root = realpathSync(resolve(root)); }
  public resolve(path: string, reading = false): string {
    const target = resolve(this.root, path);
    if (extname(target).toLowerCase() !== ".svg") throw new Error("Only .svg paths are accepted.");
    const actual = realpathSync(existsSync(target) ? target : dirname(target));
    if ((target !== this.root && !target.startsWith(this.root + sep)) ||
        (actual !== this.root && !actual.startsWith(this.root + sep))) throw new Error("SVG path is outside the configured workspace.");
    if (reading && statSync(target).size > 2 * 1024 * 1024) throw new Error("SVG input exceeds the 2 MiB limit.");
    return target;
  }
}
