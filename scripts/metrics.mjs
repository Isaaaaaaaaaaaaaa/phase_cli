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
      const roles = [
        ["extensions/vscode-svg/", "XML 源范围解析及 VSCode 文件/符号展示适配"],
        ["src/plugins/builtin-commands/", "默认 CLI 命令参数、执行、撤销反馈或注册"],
        ["src/plugins/builtin-shapes/", "默认图形的几何、属性、克隆及类型注册"],
        ["src/plugins/stats/", "只读深度优先图形统计"],
        ["src/plugins/dir/", "通过目录端口提供稳定的目录查询"],
        ["src/plugins/shape-box/", "复合图形、必要部件、属性传播及类型标签"],
        ["src/plugins/modified-star/", "保存基线、dirty 指纹与行尾标签"],
        ["src/host/loading/", "模块解析、配置校验及注册事务"],
        ["src/host/", "启动装配、宿主门面与真实目录适配"],
        ["src/cli/", "REPL、命令输入、分发及统一错误输出"],
        ["src/infrastructure/", "XML 与领域对象适配及原子文件保存"],
        ["src/extensions/", "公开扩展契约、注册、属性路由及标签组合"],
        ["src/application/presentation/", "结构树和属性明细的基线渲染"],
        ["src/application/ports/", "宿主 I/O 依赖端口"],
        ["src/application/", "会话、命令快照、历史及编辑编排"],
        ["src/domain/", "封装图形、组合树、ID 不变量及图形工厂"],
        ["src/api.ts", "插件可使用的公开 API 门面"],
      ];
      const responsibility = roles.find(([prefix]) => path.startsWith(prefix))?.[1] ?? "CLI 模块";
      return { path, category, responsibilities: `${responsibility}；${exports.join(", ") || "启动入口"}`,
        lines: source.trimEnd().split("\n").length, complexity,
        sha256: createHash("sha256").update(source).digest("hex") };
    });
  }
  manifests(ref) {
    return this.git("ls-tree", "-r", "--name-only", ref).trim().split("\n")
      .filter((path) => path === "package.json" || path === "plugins.config.json" ||
        (path.startsWith("src/plugins/") && path.endsWith("/package.json")) ||
        path === "extensions/vscode-svg/package.json")
      .map((path) => {
        const source = this.git("show", `${ref}:${path}`);
        return { path, lines: source.trimEnd().split("\n").length,
          responsibilities: path === "plugins.config.json" ? "配置装配的插件选择、顺序和 options" : "包入口、兼容条件、依赖元数据和贡献清单" };
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
    const result = { rule: "TypeScript physical LOC, AST function CC=1 + if/loops/case/catch/ternary/&&/||/??; nested functions counted separately; tests/dependencies/build outputs excluded; JSON manifests listed separately and excluded from executable-code totals",
      final: totals(baseline), phase2: totals(target), baseline, target,
      manifests: this.manifests(process.argv[2] ?? "HEAD") };
    mkdirSync("docs/metrics", { recursive: true });
    writeFileSync("docs/metrics/metrics.json", JSON.stringify(result, null, 2) + "\n");
    const table = result.phase2.map((row) => {
      const before = result.final.find((item) => item.category === row.category);
      return `| ${row.category} | ${before.files} → ${row.files} | ${before.lines} → ${row.lines} | ${before.complexity} → ${row.complexity} | ${row.complexity - before.complexity} |`;
    }).join("\n");
    const files = target.map((row) => `| ${row.path} | ${row.category} | ${row.responsibilities} | ${row.lines} | ${row.complexity} |`).join("\n");
    const manifests = result.manifests.map((row) => `| ${row.path} | ${row.responsibilities} | ${row.lines} |`).join("\n");
    writeFileSync("docs/metrics/README.md", `# 自动生成指标\n\n运行 \`node scripts/metrics.mjs p2\`。基线为 \`final\`。所有源文件读取 Git 历史；数字不可手改。\n\n口径：${result.rule}\n\nVSCode 单独列出，不混入 CLI 增量。\n\n| 分类 | 文件数 final → Phase 2 | 行数 | 圈复杂度 | 复杂度增量 |\n| --- | --- | --- | --- | --- |\n${table}\n\n## 文件清单与职责\n\n职责由目录职责规则与 AST 中的类/接口名生成。\n\n| 文件 | 分类 | 类/接口职责 | 行数 | 复杂度 |\n| --- | --- | --- | --- | --- |\n${files}\n\n## 运行配置与贡献清单\n\n配置文件从同一 Git 引用读取，单独列出，不混入 TypeScript 可执行代码复杂度。\n\n| 文件 | 职责 | 行数 |\n| --- | --- | --- |\n${manifests}\n`);
    console.log("Historical metrics generated:", target.length, "source files");
  }
}
new GitMetrics().run();
