import type { Plugin, PluginContext, ShapeFactory } from "../../api.js";
import { BoxProvider } from "./BoxProvider.js";
import { BoxAttributes } from "./BoxAttributes.js";
import { BoxTypeLabel } from "./BoxTypeLabel.js";

export default class BoxPlugin implements Plugin {
  public constructor(private readonly services: { readonly shapeFactory: Pick<ShapeFactory, "create"> }) {}
  public activate(context: PluginContext, options?: unknown): void {
    let fill = "#4a90d9";
    if (options !== undefined) {
      if (!options || typeof options !== "object" || !("fill" in options) || typeof options.fill !== "string") throw new Error("box options require a string fill");
      fill = options.fill;
    }
    context.registerShape(new BoxProvider(this.services.shapeFactory, fill));
    context.registerAttribute(new BoxAttributes());
    context.registerDecorator(new BoxTypeLabel());
  }
}
