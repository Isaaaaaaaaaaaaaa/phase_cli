import { EditorError, type Shape, type ShapeOptions, type ShapeProvider, type SvgShapeInput } from "../../api.js";

type Creator = (id: string, values: readonly number[], text: string, options: ShapeOptions, children: readonly Shape[]) => Shape;

export class BuiltinShapeProvider implements ShapeProvider {
  public constructor(
    public readonly name: string,
    private readonly geometry: readonly string[],
    private readonly creator: Creator,
    private readonly optionalStyle?: string,
    private readonly textual = false,
  ) {}
  public matches(input: SvgShapeInput): boolean { return input.tagName === this.name; }
  public create(id: string, args: readonly string[]): Shape {
    const minimum = this.geometry.length + (this.textual ? 1 : 0);
    const maximum = minimum + (this.optionalStyle ? 1 : 0);
    if (args.length < minimum || args.length > maximum) throw new EditorError(`invalid arguments for ${this.name}`);
    const values = this.geometry.map((name, index) => this.number(args[index], name));
    const style = this.optionalStyle && args[minimum] !== undefined
      ? { [this.optionalStyle]: args[minimum] } : {};
    return this.creator(id, values, this.textual ? args[this.geometry.length] ?? "" : "", { styles: style }, []);
  }
  public hydrate(input: SvgShapeInput): Shape {
    const values = this.geometry.map((name) => {
      const value = input.attributes[name];
      if (value === undefined) throw new EditorError(`missing SVG attribute: ${name}`);
      return this.number(value, name);
    });
    const styles: Record<string, string> = {};
    const extras: Record<string, string> = {};
    for (const [name, value] of Object.entries(input.attributes)) {
      if (name === "id" || this.geometry.includes(name)) continue;
      if (["fill", "stroke", "stroke-width"].includes(name)) styles[name] = value;
      else extras[name] = value;
    }
    return this.creator(input.attributes.id ?? "", values, input.text, { styles, extras }, input.children);
  }
  private number(value: string | undefined, name: string): number {
    if (value === undefined || value.trim() === "" || !Number.isFinite(Number(value))) {
      throw new EditorError(`invalid number for ${name}: ${value ?? ""}`);
    }
    return Number(value);
  }
}
