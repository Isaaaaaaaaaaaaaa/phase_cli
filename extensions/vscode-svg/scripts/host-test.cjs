const { runTests } = require("@vscode/test-electron");
const path = require("node:path");
const os = require("node:os");

runTests({
  version: "1.105.1",
  vscodeExecutablePath: process.env.VSCODE_EXECUTABLE_PATH,
  cachePath: path.join(os.tmpdir(), "course-lab2-vscode"),
  extensionDevelopmentPath: path.resolve(__dirname, ".."),
  extensionTestsPath: path.resolve(__dirname, "../dist/hostTests.js"),
  launchArgs: ["--disable-workspace-trust", "--skip-welcome", "--skip-release-notes"],
}).catch((error) => { console.error(error); process.exitCode = 1; });
