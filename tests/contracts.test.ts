import { describe, it, expect } from "vitest";
import { EditorHost } from "../src/host/EditorHost.js";
import type { Shape } from "../src/api.js";

describe("extension contract boundaries", () => {
  it("rejects a provider that returns a non-Shape without changing the document", () => {
    const host = new EditorHost();
    host.run("init");
    host.services.extensions.registerShape({
      name: "fault",
      create: () => ({ id: "bad" }) as unknown as Shape,
      matches: (input) => input.tagName === "fault",
      hydrate: () => ({ id: "bad" }) as unknown as Shape,
    });
    expect(host.run("create fault r")).toEqual(["error: invalid shape provider result: fault"]);
    expect(host.run("tree")).toEqual(["svg (800x600)"]);
    expect(() => host.services.shapeFactory.fromSvg("fault", { id: "r" }, "", [])).toThrow("invalid shape provider result: fault");
  });
  it("detects mutating handles and restores content and redo history", () => {
    const host = new EditorHost();
    host.run("init");
    host.run("create rect r 1 2 3 4");
    host.run("move r 10 0");
    host.run("undo");
    const before = host.run("tree");
    host.services.extensions.registerAttribute({
      name: "impure-handles",
      handles(shape) { shape.setAttribute("fill", "unexpected"); return true; },
      apply() { throw new Error("must never be called"); },
    });
    expect(host.run("set r fill red")).toEqual(["error: attribute handler violated handles contract: impure-handles"]);
    expect(host.run("tree")).toEqual(before);
    expect(host.run("redo")).toEqual(["rect#r moved to (11,2)"]);
  });
  it("isolates a failing observer while retaining a successful edit and history", () => {
    const host = new EditorHost();
    host.run("init");
    host.services.extensions.registerDecorator({
      name: "bad-observer", label: () => undefined, observe: () => { throw new Error("boom"); },
    });
    expect(host.run("create rect r 1 2 3 4")).toEqual([
      "rect#r created", "error: decorator observer disabled: bad-observer (boom)",
    ]);
    expect(host.services.extensions.names("decorators")).toEqual([]);
    expect(host.run("undo")).toEqual(["rect#r creation undone"]);
  });
});
