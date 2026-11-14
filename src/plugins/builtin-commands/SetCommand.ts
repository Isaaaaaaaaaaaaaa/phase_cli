import { SnapshotCommand, type SvgDocument, type ExtensionRegistry } from "../../api.js";

export class SetCommand extends SnapshotCommand {
  private tagName = "shape";
  private previous: string | undefined;

  public constructor(
    private readonly id: string,
    private readonly attribute: string,
    private readonly value: string,
    private readonly extensions: ExtensionRegistry,
  ) {
    super();
  }

  protected override perform(document: SvgDocument): readonly string[] {
    const shape = document.require(this.id);
    this.tagName = shape.typeName;
    this.previous = this.extensions.setAttribute(document, shape, this.attribute, this.value);
    return [
      `${this.tagName}#${this.id} updated: ${this.attribute}="${this.value}"`,
    ];
  }

  protected override undoOutput(): readonly string[] {
    const value = this.previous === undefined ? "(unset)" : `"${this.previous}"`;
    return [
      `${this.tagName}#${this.id} updated: ${this.attribute}=${value}`,
    ];
  }
}
