import type { Context } from "@deepseek-ai/cordis";
import { SvgWorkbench } from "./SvgWorkbench.js";
export { SvgWorkbench } from "./SvgWorkbench.js";
export { WorkbenchSession } from "./WorkbenchSession.js";
export { WorkspacePaths } from "./WorkspacePaths.js";
export const name = "dsh-svg-workbench";
export const inject = ["tools"];

export function apply(context: Context, options: { root?: string } = {}): void {
  new SvgWorkbench(options.root).register(context);
}
