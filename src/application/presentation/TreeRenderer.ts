import type { Shape } from "../../domain/shapes/Shape.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
import type { ExtensionRegistry } from "../../extensions/ExtensionRegistry.js";

export class TreeRenderer {
  public constructor(private readonly extensions?: ExtensionRegistry) {}
  private document: SvgDocument | undefined;
  public render(document: SvgDocument, rootId?: string): readonly string[] {
    this.document = document;
    if (rootId !== undefined) {
      const shape = document.require(rootId);
      return [shape.summary() + (this.extensions?.decorate(document, shape) ?? ""), ...this.renderChildren(shape.children, "")];
    }
    return [
      `svg (${document.width}x${document.height})${this.extensions?.decorate(document) ?? ""}`,
      ...this.renderChildren(document.children, ""),
    ];
  }

  private renderChildren(
    children: readonly Shape[],
    prefix: string,
  ): readonly string[] {
    const lines: string[] = [];
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      lines.push(`${prefix}${last ? "└──" : "├──"} ${child.summary()}${this.document ? this.extensions?.decorate(this.document, child) ?? "" : ""}`);
      lines.push(
        ...this.renderChildren(
          child.children,
          `${prefix}${last ? "    " : "│   "}`,
        ),
      );
    });
    return lines;
  }
}
