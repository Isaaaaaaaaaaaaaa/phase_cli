import { type AttributeHandler, type SvgDocument, type Shape } from "../../api.js";
import { BoxShape } from "./BoxShape.js";

export class BoxAttributes implements AttributeHandler {
  public readonly name = "box-attributes";
  public handles(shape: Shape, attr: string): boolean { return shape instanceof BoxShape && (attr === "fill" || attr === "label"); }
  public apply(_document: SvgDocument, shape: Shape, attr: string, value: string): string | undefined {
    if (!(shape instanceof BoxShape)) throw new Error("box handler target mismatch");
    return attr === "fill" ? shape.part("rect", "rect").setAttribute("fill", value)
      : shape.part("label", "text").setAttribute("text", value);
  }
}
