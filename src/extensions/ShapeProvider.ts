import type { Shape } from "../domain/shapes/Shape.js";

export interface SvgShapeInput {
  readonly tagName: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly text: string;
  readonly children: readonly Shape[];
}

export interface ShapeProvider {
  readonly name: string;
  create(id: string, args: readonly string[]): Shape;
  matches(input: SvgShapeInput): boolean;
  hydrate(input: SvgShapeInput): Shape;
}
