import type { TreeDecorator, EditorEvent, SvgDocument, Shape } from "../../api.js";

export class ModifiedStar implements TreeDecorator {
  public readonly name = "modified-star";
  private savedNodes = new Map<string, string>();
  private savedRoot = "";
  public observe(event: EditorEvent): void {
    if (event.kind !== "baseline") return;
    this.savedNodes = new Map(event.document.walk().map((shape) => [shape.id, this.fingerprint(shape)]));
    this.savedRoot = this.root(event.document);
  }
  public label(document: SvgDocument, shape?: Shape): string | undefined {
    const changed = shape ? this.savedNodes.get(shape.id) !== this.fingerprint(shape) : this.savedRoot !== this.root(document);
    return changed ? "*" : undefined;
  }
  private fingerprint(shape: Shape): string {
    return JSON.stringify({
      attributes: shape.svgAttributes(), text: shape.textContent,
      children: shape.children.map((child) => this.fingerprint(child)),
    });
  }
  private root(document: SvgDocument): string {
    return JSON.stringify({ width: document.width, height: document.height,
      children: document.children.map((shape) => this.fingerprint(shape)) });
  }
}
