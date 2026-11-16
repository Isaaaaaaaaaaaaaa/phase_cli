import { SaxesParser } from "saxes";
import { XmlOutlineNode } from "./XmlOutlineNode";

/** A source model; never creates or mutates an editor document. */
export class XmlOutlineParser {
  public parse(source: string): readonly XmlOutlineNode[] {
    const roots: XmlOutlineNode[] = [];
    const stack: XmlOutlineNode[] = [];
    const parser = new SaxesParser({ xmlns: true });
    let valid = true;
    let openingStart = 0;
    parser.on("error", () => { valid = false; });
    parser.on("opentagstart", () => {
      openingStart = source.lastIndexOf("<", parser.position - 1);
    });
    parser.on("opentag", (tag) => {
      const id = Object.values(tag.attributes).find((attribute) =>
        attribute.name === "id")?.value;
      const node = new XmlOutlineNode(
        id ? `${tag.name}#${id}` : tag.name,
        openingStart,
        parser.position,
      );
      const parent = stack.at(-1);
      if (parent) parent.addChild(node);
      else roots.push(node);
      stack.push(node);
    });
    parser.on("closetag", () => {
      const node = stack.pop();
      if (node) node.close(parser.position);
    });
    try { parser.write(source).close(); }
    catch { valid = false; }
    return valid && stack.length === 0 ? roots : [];
  }
}
