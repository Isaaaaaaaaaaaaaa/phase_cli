import { EditorHost } from "../src/host/EditorHost.js";

export class TestHarness {
  private readonly host = new EditorHost();

  public run(line: string): readonly string[] {
    return this.host.run(line);
  }
}
