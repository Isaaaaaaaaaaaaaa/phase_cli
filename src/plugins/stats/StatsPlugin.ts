import type { Plugin, PluginContext } from "../../api.js";
import { StatsCommand } from "./StatsCommand.js";

export default class StatsPlugin implements Plugin {
  public activate(context: PluginContext): void { context.registerCommand(new StatsCommand()); }
}
