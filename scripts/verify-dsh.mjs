import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const directory = resolve("integrations/dsh-svg");
const output = execFileSync("npm", ["test"], { cwd: directory, encoding: "utf8" });
const lock = JSON.parse(readFileSync(`${directory}/package-lock.json`, "utf8"));
const report = {
  cordis: lock.packages["node_modules/@deepseek-ai/cordis"].version,
  dshTools: lock.packages["node_modules/@deepseek-ai/dsh-tools"].version,
  nativeRegistry: true,
  promptAssembly: "Unused SystemPrompt service is a fixture; ToolsService and plugin lifecycle are real SDK.",
  result: "PASS",
};
writeFileSync("doc/transcript/dsh-host-verification.json", JSON.stringify(report, null, 2) + "\n");
writeFileSync("doc/transcript/dsh-host.expected.txt", output);
console.log("PASS: real DSH registry, tools, scoped state, paths and unloading.");
