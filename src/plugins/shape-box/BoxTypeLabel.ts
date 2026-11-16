import type { TreeDecorator, SvgDocument, Shape } from "../../api.js";

export class BoxTypeLabel implements TreeDecorator {
  public readonly name = "box-type-label";
  public label(_document: SvgDocument, shape?: Shape): string | undefined {
    return shape?.typeName === "box" ? "(box)" : undefined;
  }
}
