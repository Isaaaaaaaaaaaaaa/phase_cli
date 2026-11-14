import { EditorError } from "./EditorError.js";
import { Shape } from "./shapes/Shape.js";
import type { ExtensionRegistry } from "../extensions/ExtensionRegistry.js";

export class ShapeFactory {
  public constructor(private readonly registry: ExtensionRegistry) {}
  public create(type: string, id: string, args: readonly string[]): Shape {
    const provider = this.registry.shape(type);
    if (!provider) throw new EditorError(`unknown shape type: ${type} (is the plugin loaded?)`);
    const shape = provider.create(id, args);
    if (!(shape instanceof Shape) || shape.id !== id) throw new EditorError(`invalid shape provider result: ${type}`);
    return shape;
  }
  public fromSvg(tagName: string, attributes: Readonly<Record<string, string>>, text: string, children: readonly Shape[]): Shape {
    const input = { tagName, attributes, text, children };
    // Most recently registered semantic provider can override a generic SVG container.
    const provider = [...this.registry.shapes()].reverse().find((candidate) => candidate.matches(input));
    if (!provider) throw new EditorError(`unsupported SVG element: ${tagName}`);
    if (!attributes.id) throw new EditorError(`missing id on <${tagName}>`);
    const shape = provider.hydrate(input);
    if (!(shape instanceof Shape) || shape.id !== attributes.id) throw new EditorError(`invalid shape provider result: ${provider.name}`);
    return shape;
  }
}
