import { GroupShape, type Plugin, type PluginContext } from "../../api.js";
import { BuiltinShapeProvider } from "./BuiltinShapeProvider.js";
import { RectShape } from "./RectShape.js";
import { CircleShape } from "./CircleShape.js";
import { EllipseShape } from "./EllipseShape.js";
import { LineShape } from "./LineShape.js";
import { TextShape } from "./TextShape.js";

export default class BuiltinShapesPlugin implements Plugin {
  public activate(context: PluginContext): void {
    context.registerShape(new BuiltinShapeProvider("rect", ["x", "y", "width", "height"],
      (id, v, _text, options) => new RectShape(id, this.coordinate(v, 0), this.coordinate(v, 1), this.coordinate(v, 2), this.coordinate(v, 3), options), "fill"));
    context.registerShape(new BuiltinShapeProvider("circle", ["cx", "cy", "r"],
      (id, v, _text, options) => new CircleShape(id, this.coordinate(v, 0), this.coordinate(v, 1), this.coordinate(v, 2), options), "fill"));
    context.registerShape(new BuiltinShapeProvider("ellipse", ["cx", "cy", "rx", "ry"],
      (id, v, _text, options) => new EllipseShape(id, this.coordinate(v, 0), this.coordinate(v, 1), this.coordinate(v, 2), this.coordinate(v, 3), options), "fill"));
    context.registerShape(new BuiltinShapeProvider("line", ["x1", "y1", "x2", "y2"],
      (id, v, _text, options) => new LineShape(id, this.coordinate(v, 0), this.coordinate(v, 1), this.coordinate(v, 2), this.coordinate(v, 3), options), "stroke"));
    context.registerShape(new BuiltinShapeProvider("text", ["x", "y"],
      (id, v, text, options) => new TextShape(id, this.coordinate(v, 0), this.coordinate(v, 1), text, options), undefined, true));
    context.registerShape(new BuiltinShapeProvider("g", [],
      (id, _v, _text, options, children) => new GroupShape(id, children, options)));
  }
  private coordinate(values: readonly number[], index: number): number {
    const value = values[index];
    if (value === undefined) throw new Error("invalid builtin shape geometry");
    return value;
  }
}
