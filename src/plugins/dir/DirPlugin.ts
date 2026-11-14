import type { Plugin, PluginContext, PluginServices } from "../../api.js";
import { DirCommand } from "./DirCommand.js";

export default class DirPlugin implements Plugin {
  public constructor(private readonly services: PluginServices) {}
  public activate(context: PluginContext): void { context.registerCommand(new DirCommand(this.services.directory)); }
}
