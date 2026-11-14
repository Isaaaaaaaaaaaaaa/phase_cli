import { EditorError, type ShapeFactory, type Shape, type ShapeProvider, type SvgShapeInput } from "../../api.js";
import { BoxShape } from "./BoxShape.js";

export class BoxProvider implements ShapeProvider {
  public readonly name = "box";
  public constructor(private readonly factory: Pick<ShapeFactory, "create">, private readonly fill = "#4a90d9") {}
  public matches(input: SvgShapeInput): boolean { return input.tagName === "g" && input.attributes["data-kind"] === "box"; }
  public create(id: string, args: readonly string[]): Shape {
    if (args.length !== 5) throw new EditorError('usage: create box <id> <x> <y> <w> <h> "title"');
    const geometry = args.slice(0, 4).map((value) => Number(value));
    if (args.slice(0, 4).some((value) => value.trim() === "") || geometry.some((value) => !Number.isFinite(value))) throw new EditorError("invalid box geometry");
    const x = geometry[0] ?? 0;
    const y = geometry[1] ?? 0;
    const height = geometry[3] ?? 0;
    const rect = this.factory.create("rect", `${id}-rect`, [...args.slice(0, 4), this.fill]);
    const text = this.factory.create("text", `${id}-label`, [String(x + 20), String(y + height / 2 + 5), args[4] ?? ""]);
    return new BoxShape(id, [rect, text]);
  }
  public hydrate(input: SvgShapeInput): Shape {
    return new BoxShape(input.attributes.id ?? "", input.children, { extras: input.attributes });
  }
}
