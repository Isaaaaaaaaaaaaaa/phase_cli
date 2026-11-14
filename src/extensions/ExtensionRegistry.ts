import { EditorError } from "../domain/EditorError.js";
import type { ShapeProvider } from "./ShapeProvider.js";
import type { Command } from "./Command.js";
import type { AttributeHandler } from "./AttributeHandler.js";
import type { TreeDecorator, EditorEvent } from "./TreeDecorator.js";
import type { PluginContext, Category } from "./Plugin.js";
import type { SvgDocument } from "../domain/SvgDocument.js";
import type { Shape } from "../domain/shapes/Shape.js";

/** Registration storage; plugins see only PluginContext, never these maps. */
export class ExtensionRegistry implements PluginContext {
  private readonly tables = {
    shapes: new Map<string, ShapeProvider>(),
    commands: new Map<string, Command>(),
    attributes: new Map<string, AttributeHandler>(),
    decorators: new Map<string, TreeDecorator>(),
  };

  public registerShape(value: ShapeProvider): void { this.insert("shapes", value); }
  public registerCommand(value: Command): void { this.insert("commands", value); }
  public registerAttribute(value: AttributeHandler): void { this.insert("attributes", value); }
  public registerDecorator(value: TreeDecorator): void { this.insert("decorators", value); }
  private insert(category: Category, value: { readonly name: string }): void {
    if (!value.name || typeof value.name !== "string") throw new EditorError(`invalid registration: ${category}`);
    const methods = { shapes: ["create", "matches", "hydrate"], commands: ["create"], attributes: ["handles", "apply"], decorators: ["label"] };
    const contract = value as unknown as Record<string, unknown>;
    if (methods[category].some((name) => typeof contract[name] !== "function")) throw new EditorError(`invalid registration contract: ${category}/${value.name}`);
    const table = this.tables[category] as Map<string, { readonly name: string }>;
    if (table.has(value.name)) throw new EditorError(`duplicate registration: ${category}/${value.name}`);
    table.set(value.name, value);
  }
  public names(category: Category): readonly string[] { return [...this.tables[category].keys()].sort(); }
  public shapes(): readonly ShapeProvider[] { return [...this.tables.shapes.values()]; }
  public shape(name: string): ShapeProvider | undefined { return this.tables.shapes.get(name); }
  public commands(): readonly Command[] { return [...this.tables.commands.values()]; }
  public command(name: string): Command | undefined { return this.tables.commands.get(name); }
  public merge(staged: ExtensionRegistry): void {
    for (const category of ["shapes", "commands", "attributes", "decorators"] as const) {
      for (const name of staged.names(category)) {
        if (this.tables[category].has(name)) throw new EditorError(`duplicate registration: ${category}/${name}`);
      }
    }
    for (const shape of staged.shapes()) this.registerShape(shape);
    for (const command of staged.commands()) this.registerCommand(command);
    for (const handler of staged.tables.attributes.values()) this.registerAttribute(handler);
    for (const decorator of staged.tables.decorators.values()) this.registerDecorator(decorator);
  }
  public setAttribute(document: SvgDocument, shape: Shape, attr: string, value: string): string | undefined {
    const fingerprint = (): string => JSON.stringify(document.walk().map((node) => [node.id, node.svgAttributes(), node.textContent, node.children.map((child) => child.id)]));
    const before = fingerprint();
    const matches = [...this.tables.attributes.values()].filter((handler) => {
      const handled = handler.handles(shape, attr);
      if (typeof handled !== "boolean" || fingerprint() !== before) throw new EditorError(`attribute handler violated handles contract: ${handler.name}`);
      return handled;
    });
    if (matches.length > 1) throw new EditorError(`conflicting attribute handlers: ${matches.map((handler) => handler.name).join(", ")}`);
    const result = matches[0] ? matches[0].apply(document, shape, attr, value) : shape.setAttribute(attr, value);
    if (result !== undefined && typeof result !== "string") throw new EditorError(`invalid attribute handler result: ${matches[0]?.name ?? ""}`);
    return result;
  }
  public decorate(document: SvgDocument, shape?: Shape): string {
    const labels = [...this.tables.decorators.values()].map((decorator) => {
      const label = decorator.label(document.clone(), shape?.clone());
      if (label !== undefined && typeof label !== "string") throw new EditorError(`invalid decorator result: ${decorator.name}`);
      return label;
    }).filter((label): label is string => typeof label === "string" && label.length > 0);
    return labels.length ? ` ${labels.join(" ")}` : "";
  }
  public observe(event: EditorEvent): readonly string[] {
    const diagnostics: string[] = [];
    for (const [name, decorator] of this.tables.decorators) {
      try {
        decorator.observe?.({ ...event, document: event.document.clone() });
      } catch (error: unknown) {
        this.tables.decorators.delete(name);
        const reason = error instanceof Error ? error.message : String(error);
        diagnostics.push(`error: decorator observer disabled: ${name} (${reason.replace(/[\r\n]+/gu, " ")})`);
      }
    }
    return diagnostics;
  }
}
