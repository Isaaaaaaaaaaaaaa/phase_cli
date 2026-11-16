import { SvgEditor, EditorSession, HistoryManager, ExtensionRegistry, ShapeFactory,
  type PluginServices, type DirectoryReader, type Plugin, type PluginManifest } from "../api.js";
import { FileSvgRepository } from "../infrastructure/FileSvgRepository.js";
import { CommandFactory } from "../cli/CommandFactory.js";
import { SvgCliApplication } from "../cli/SvgCliApplication.js";
import { PluginLoader } from "./loading/PluginLoader.js";
import { NodeDirectoryReader } from "./NodeDirectoryReader.js";
import BuiltinShapesPlugin from "../plugins/builtin-shapes/BuiltinShapesPlugin.js";
import BuiltinCommandsPlugin from "../plugins/builtin-commands/BuiltinCommandsPlugin.js";
import shapeManifest from "../plugins/builtin-shapes/package.json" with { type: "json" };
import commandManifest from "../plugins/builtin-commands/package.json" with { type: "json" };

export class EditorHost {
  public readonly services: PluginServices;
  public readonly editor: SvgEditor;
  public readonly loader: PluginLoader;
  public readonly application: SvgCliApplication;
  public readonly diagnostics: string[] = [];

  public constructor(directory: DirectoryReader = new NodeDirectoryReader()) {
    const extensions = new ExtensionRegistry();
    const shapeFactory = new ShapeFactory(extensions);
    const history = new HistoryManager();
    this.services = { extensions, shapeFactory, history, directory, repository: new FileSvgRepository(shapeFactory) };
    this.editor = new SvgEditor(new EditorSession(), history, extensions);
    this.loader = new PluginLoader(this.services);
    this.install(new BuiltinShapesPlugin(), shapeManifest);
    this.install(new BuiltinCommandsPlugin(this.services), commandManifest);
    this.application = new SvgCliApplication(this.editor, new CommandFactory(extensions));
  }
  public install(plugin: Plugin, manifest: PluginManifest, options?: unknown): void {
    this.diagnostics.push(...this.loader.install(plugin, manifest, options));
  }
  public run(line: string): readonly string[] { return this.application.executeLine(line); }
}
