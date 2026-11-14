export class XmlOutlineNode {
  private readonly childNodes: XmlOutlineNode[] = [];
  private endOffset: number;

  public constructor(
    private readonly nodeName: string,
    private readonly startOffset: number,
    private readonly openingEndOffset: number,
  ) {
    if (startOffset < 0 || openingEndOffset < startOffset) throw new Error("Invalid XML source range.");
    this.endOffset = openingEndOffset;
  }
  public get name(): string { return this.nodeName; }
  public get start(): number { return this.startOffset; }
  public get selectionEnd(): number { return this.openingEndOffset; }
  public get end(): number { return this.endOffset; }
  public get children(): readonly XmlOutlineNode[] { return [...this.childNodes]; }
  public addChild(child: XmlOutlineNode): void {
    if (child.start < this.openingEndOffset) throw new Error("Child precedes parent opening tag.");
    this.childNodes.push(child);
  }
  public close(end: number): void {
    if (end < this.openingEndOffset) throw new Error("Closing range precedes opening tag.");
    this.endOffset = end;
  }
}
