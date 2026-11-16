import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";

class BaselineVerification {
  run() {
    let baseline = process.argv[2];
    if (!baseline) {
      baseline = mkdtempSync(join(tmpdir(), "svg-final-baseline-"));
      const archive = execFileSync("git", ["archive", "--format=tar", "final"]);
      execFileSync("tar", ["-xf", "-", "-C", baseline], { input: archive });
      symlinkSync(resolve("node_modules"), join(baseline, "node_modules"), "junction");
      execFileSync(process.execPath, [resolve("node_modules/typescript/bin/tsc"), "-p", join(baseline, "tsconfig.json")], { cwd: baseline });
    }
    const directory = mkdtempSync(join(tmpdir(), "svg-baseline-session-"));
    writeFileSync(join(directory, "other.svg"), readFileSync("doc/transcript/other.svg"));
    const input = readFileSync("doc/transcript/cli-1.txt", "utf8");
    const before = execFileSync(process.execPath, [resolve(baseline, "dist/cli/SvgCli.js")], { cwd: directory, input, encoding: "utf8" });
    const after = execFileSync(process.execPath, [resolve("dist/cli/SvgCli.js"), "--no-plugins"], { cwd: directory, input, encoding: "utf8" });
    assert.equal(after, before, "Phase 1 output must remain byte-for-byte identical.");
    writeFileSync("doc/transcript/cli-1.expected.txt", before);
    console.log("PASS: final vs Phase 2 baseline output is byte-for-byte identical.");
  }
}
new BaselineVerification().run();
