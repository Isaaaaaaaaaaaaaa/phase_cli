export class XmlOutlineNode {
  public readonly children: XmlOutlineNode[] = [];
  public end: number;

  public constructor(
    public readonly name: string,
    public readonly start: number,
    public readonly selectionEnd: number,
  ) {
    this.end = selectionEnd;
  }
}
