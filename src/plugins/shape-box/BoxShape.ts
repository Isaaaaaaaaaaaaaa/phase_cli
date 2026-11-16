import { GroupShape, EditorError, type Shape, type ShapeOptions } from "../../api.js";

export class BoxShape extends GroupShape {
  public constructor(id: string, children: readonly Shape[], options: ShapeOptions = {}) {
    super(id, children, { ...options, extras: { ...options.extras, "data-kind": "box" } });
    this.part("rect", "rect");
    this.part("label", "text");
  }
  public override get typeName(): string { return "box"; }
  public part(suffix: "rect" | "label", type: string): Shape {
    const candidates = this.children.filter((child) => child.id === `${this.id}-${suffix}`);
    const child = candidates[0];
    if (candidates.length !== 1 || !child || child.typeName !== type) {
      throw new EditorError(`invalid box structure: ${this.id} (expected ${this.id}-${suffix} as ${type})`);
    }
    return child;
  }
  public override assertCanDetach(id: string): void {
    if (id === `${this.id}-rect` || id === `${this.id}-label`) throw new EditorError(`cannot detach required box part: ${id}`);
  }
  public override assertCanUngroup(): void {
    throw new EditorError(`cannot ungroup composite shape: ${this.id}`);
  }
  public override clone(): BoxShape {
    return new BoxShape(this.id, this.children.map((child) => child.clone()), this.copyOptions());
  }
  public override creationMessage(): string {
    return `box#${this.id} created (g#${this.id} + rect#${this.id}-rect + text#${this.id}-label)`;
  }
}
