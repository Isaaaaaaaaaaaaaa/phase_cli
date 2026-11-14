import type { Plugin, PluginContext } from "../../api.js";
import { ModifiedStar } from "./ModifiedStar.js";

export default class ModifiedStarPlugin implements Plugin {
  public activate(context: PluginContext): void { context.registerDecorator(new ModifiedStar()); }
}
