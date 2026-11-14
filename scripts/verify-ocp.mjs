import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

class OcpVerification {
  git(...args) { return execFileSync("git", args, { encoding: "utf8" }); }
  run() {
    const checks = [
      { name: "box-code", commit: "e0514f3", plugin: "src/plugins/shape-box", assembly: "src/host/CodeAssembly.ts" },
      { name: "box-config", commit: "941145a", plugin: "src/plugins/shape-box", assembly: "plugins.config.json" },
      { name: "modified-star", commit: "a70d30d", plugin: "src/plugins/modified-star", assembly: "src/host/CodeAssembly.ts" },
    ];
    const results = checks.map((check) => {
      const paths = ["src/domain", "src/application", "src/extensions", "src/cli", "src/host/loading"];
      for (const path of paths) {
        assert.ok(this.git("ls-tree", `${check.commit}^`, path).trim(), `Required baseline path missing: ${path}`);
        assert.ok(this.git("ls-tree", check.commit, path).trim(), `Required candidate path missing: ${path}`);
      }
      const kernelDiff = this.git("diff", `${check.commit}^`, check.commit, "--", ...paths);
      const oldPluginDiff = this.git("diff", `${check.commit}^`, check.commit, "--", "src/plugins", `:(exclude)${check.plugin}`);
      assert.equal(kernelDiff, "", `${check.name}: kernel modified`);
      assert.equal(oldPluginDiff, "", `${check.name}: existing plugins modified`);
      const diff = this.git("diff", "--name-status", `${check.commit}^`, check.commit).trim();
      const modifiedSource = diff.split("\n").filter((line) => line.startsWith("M\t") && line.endsWith(".ts"));
      if (check.name === "box-code") assert.deepEqual(modifiedSource, [`M\t${check.assembly}`]);
      if (check.name === "box-config") assert.deepEqual(modifiedSource, []);
      return { ...check, checkedExistingPaths: paths, kernelUnchanged: true, existingPluginsUnchanged: true, nameStatus: diff };
    });
    mkdirSync("docs/metrics", { recursive: true });
    writeFileSync("docs/metrics/ocp-verification.json", JSON.stringify(results, null, 2) + "\n");
    console.log("PASS: box code/config and decorator commits preserve kernel and existing plugin code.");
  }
}
new OcpVerification().run();
