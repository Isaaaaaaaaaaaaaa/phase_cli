import type { Shape } from "../domain/shapes/Shape.js";
import type { SvgDocument } from "../domain/SvgDocument.js";

export interface AttributeHandler {
  readonly name: string;
  handles(shape: Shape, attr: string): boolean;
  apply(document: SvgDocument, shape: Shape, attr: string, value: string): string | undefined;
}
