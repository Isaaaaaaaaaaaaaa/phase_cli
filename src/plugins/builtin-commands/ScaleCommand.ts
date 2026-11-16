import { EditorError, SnapshotCommand, type SvgDocument } from "../../api.js";

export class ScaleCommand extends SnapshotCommand {
  private tagName = "shape";

  public constructor(
    private readonly id: string,
    private readonly factor: number,
  ) {
    super();
  }

  protected override perform(document: SvgDocument): readonly string[] {
    if (!Number.isFinite(this.factor) || this.factor <= 0) {
      throw new EditorError("scale factor must be positive");
    }
    const shape = document.require(this.id);
    this.tagName = shape.typeName;
    shape.scale(this.factor);
    return [`${this.tagName}#${this.id} scaled by ${this.factor}`];
  }

  protected override undoOutput(): readonly string[] {
    return [`${this.tagName}#${this.id} scale restored`];
  }
}
