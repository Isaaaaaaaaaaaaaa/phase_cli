import type { SvgDocument } from "../domain/SvgDocument.js";
import type { Shape } from "../domain/shapes/Shape.js";

export interface EditorEvent {
  readonly kind: "edit" | "history" | "baseline";
  readonly document: SvgDocument;
}

export interface TreeDecorator {
  readonly name: string;
  label(document: SvgDocument, shape?: Shape): string | undefined;
  observe?(event: EditorEvent): void;
}
