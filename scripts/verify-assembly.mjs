import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";

class AssemblyVerification {
  run() {
    const workspace = resolve(".");
    const directory = mkdtempSync(join(tmpdir(), "svg-assembly-fixed-"));
    mkdirSync(join(directory, "docs"));
    mkdirSync(join(directory, "plugins"));
    writeFileSync(join(directory, ".hidden"), "hidden");
    writeFileSync(join(directory, "package.json"), "{}");
    writeFileSync(join(directory, "other.svg"), readFileSync("doc/transcript/other.svg"));
    const results = [];
    for (const session of ["cli-1", "box", "plugins"]) {
      const input = readFileSync(`doc/transcript/${session}.txt`, "utf8");
      const entry = resolve("dist/cli/SvgCli.js");
      const code = execFileSync(process.execPath, [entry], { input, cwd: directory, encoding: "utf8" });
      const config = execFileSync(process.execPath, [entry, "--config", join(workspace, "plugins.config.json")], { input, cwd: directory, encoding: "utf8" });
      assert.equal(config, code, `${session}: code/config output mismatch`);
      writeFileSync(`doc/transcript/${session}.plugins.expected.txt`, code);
      results.push({ session, bytes: Buffer.byteLength(code), identical: true });
    }
    writeFileSync("doc/transcript/assembly-verification.json", JSON.stringify(results, null, 2) + "\n");
    console.log("PASS: all three sessions have byte-identical code/config outputs.");
  }
}
new AssemblyVerification().run();
