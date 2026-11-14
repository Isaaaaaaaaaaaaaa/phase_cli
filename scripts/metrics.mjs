import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import ts from "typescript";

/** Reproducible AST metrics read only tracked historical source, never generated output. */
class GitMetrics {
  git(...args) { return execFileSync("git", args, { encoding: "utf8" }); }
  inventory(ref) {
    const paths = this.git("ls-tree", "-r", "--name-only", ref).trim().split("\n")
      .filter((path) => path.endsWith(".ts") && !path.endsWith(".d.ts") &&
        (path.startsWith("src/") || path.startsWith("extensions/vscode-svg/src/")) &&
        !path.endsWith("/hostTests.ts"));
    return paths.map((path) => {
      const source = this.git("show", `${ref}:${path}`);
      const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
      let complexity = 0;
      const exports = [];
      const visit = (node) => {
        if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) exports.push(node.name?.text ?? "(anonymous)");
        if (ts.isFunctionLike(node) && node.body) {
          let value = 1;
          const branches = (part) => {
            if (part !== node && ts.isFunctionLike(part)) return;
            if (ts.isIfStatement(part) || ts.isForStatement(part) || ts.isForOfStatement(part) ||
                ts.isForInStatement(part) || ts.isWhileStatement(part) || ts.isDoStatement(part) ||
                ts.isCaseClause(part) || ts.isCatchClause(part) || ts.isConditionalExpression(part) ||
                (ts.isBinaryExpression(part) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(part.operatorToken.kind))) value++;
            ts.forEachChild(part, branches);
          };
          branches(node);
          complexity += value;
        }
        ts.forEachChild(node, visit);
      };
      visit(file);
      const category = path.startsWith("extensions/") ? "VSCode" :
        path.startsWith("src/plugins/") ? "插件" :
        /src\/(host|cli|infrastructure)\//.test(path) ? "装配处" : "内核";
      return { path, category, responsibilities: exports.join(", ") || "module entry",
        lines: source.trimEnd().split("\n").length, complexity,
        sha256: createHash("sha256").update(source).digest("hex") };
    });
  }
  run() {
    const baseline = this.inventory("final");
    const target = this.inventory(process.argv[2] ?? "HEAD");
    const totals = (rows) => ["内核", "装配处", "插件", "VSCode"].map((category) => {
      const selected = rows.filter((row) => row.category === category);
      return { category, files: selected.length,
        lines: selected.reduce((sum, row) => sum + row.lines, 0),
        complexity: selected.reduce((sum, row) => sum + row.complexity, 0) };
    });
    const result = { rule: "physical LOC, AST function CC=1 + if/loops/case/catch/ternary/&&/||/??; nested functions counted separately; tests/dependencies/build outputs excluded",
      final: totals(baseline), phase2: totals(target), baseline, target };
    mkdirSync("docs/metrics", { recursive: true });
    writeFileSync("docs/metrics/metrics.json", JSON.stringify(result, null, 2) + "\n");
    const table = result.phase2.map((row) => {
      const before = result.final.find((item) => item.category === row.category);
      return `| ${row.category} | ${before.files} → ${row.files} | ${before.lines} → ${row.lines} | ${before.complexity} → ${row.complexity} | ${row.complexity - before.complexity} |`;
    }).join("\n");
    const files = target.map((row) => `| ${row.path} | ${row.category} | ${row.responsibilities} | ${row.lines} | ${row.complexity} |`).join("\n");
    writeFileSync("docs/metrics/README.md", `# 自动生成指标\n\n运行 \`node scripts/metrics.mjs p2\`。基线为 \`final\`。所有源文件读取 Git 历史；数字不可手改。\n\n口径：${result.rule}\n\nVSCode 单独列出，不混入 CLI 增量。\n\n| 分类 | 文件数 final → Phase 2 | 行数 | 圈复杂度 | 复杂度增量 |\n| --- | --- | --- | --- | --- |\n${table}\n\n## 文件清单与职责\n\n职责由 AST 中的类/接口名生成，目录类别由脚本规则生成。\n\n| 文件 | 分类 | 类/接口职责 | 行数 | 复杂度 |\n| --- | --- | --- | --- | --- |\n${files}\n`);
    console.log("Historical metrics generated:", target.length, "source files");
  }
}
new GitMetrics().run();
