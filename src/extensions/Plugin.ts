import type { ShapeProvider } from "./ShapeProvider.js";
import type { Command } from "./Command.js";
import type { AttributeHandler } from "./AttributeHandler.js";
import type { TreeDecorator } from "./TreeDecorator.js";

export interface PluginContext {
  registerShape(provider: ShapeProvider): void;
  registerCommand(command: Command): void;
  registerAttribute(handler: AttributeHandler): void;
  registerDecorator(decorator: TreeDecorator): void;
}
export interface Plugin {
  activate(context: PluginContext, options?: unknown): void;
}
export type Category = "shapes" | "commands" | "attributes" | "decorators";
export interface PluginManifest {
  readonly name: string;
  readonly contributes?: Partial<Record<Category, readonly string[]>>;
}
