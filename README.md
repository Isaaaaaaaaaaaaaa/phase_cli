# SVG Frame

高级软件开发技术 Lab1 Phase 2 项目，包含 VSCode SVG 扩展、SVG CLI 插件框架和 DeepSeek Harness SVG 工作台。使用 TypeScript，采用 Command、Composite、Adapter 和 Decorator 模式。

代码仓库：<https://github.com/Isaaaaaaaaaaaaaa/phase_cli>。Phase 1 基线为 `final`，Phase 2 提交标签为 `p2`。

## 运行

环境：Node.js 24.9+、npm。

```bash
npm ci
npm run cli
```

CLI 提供三种启动方式：

```bash
npm run cli                                  # 代码装配
npm run cli -- --config plugins.config.json   # 配置装配
npm run cli -- --no-plugins                   # Phase 1 默认能力
```

默认装配支持 rect、circle、ellipse、line、text、g、box，提供撤销重做、SVG 读写、结构树、统计和目录查询。

```text
init 800 600
create box start 120 100 160 60 "开始"
create box process 520 100 160 60 "处理数据"
create line arrow 280 130 520 130 black
group flow start process arrow
move process 0 100
set process label "处理数据 v2"
undo
redo
stats
tree
save flowchart.svg
```

`tree` 用 `(box)` 标注复合图形，用 `*` 标记与保存点不同的内容。保存成功后清除标记，undo 回到保存点也恢复干净状态。生成的 SVG 可直接在浏览器打开。

## 项目结构

```text
src/
  api.ts                插件公开 API
  domain/               图形、文档和组合结构
  application/          命令事务、历史和渲染
  extensions/           四个扩展点与注册表
  host/                 代码装配、配置加载、目录适配器
  cli/                  命令解析和 REPL
  infrastructure/       SVG 文件适配器
  plugins/              内置类型、命令和可选插件
extensions/vscode-svg/  VSCode 扩展
integrations/dsh-svg/   DSH 插件
tests/                  CLI 与插件测试
scripts/                基线、装配、差异和指标验证
doc/                    实验分析、ADR 和输入会话
docs/                   架构图、截图和指标
packages/               CLI、VSIX 和 DSH 安装包
```

架构、扩展点调用位置、设计决策与过程记录见 [实验文档](doc/README.md)。

## 插件装配

四个扩展点分别处理图形类型、命令、树标签和属性领域语义。

| 扩展点 | 实现 |
| --- | --- |
| ShapeProvider | 六种基础类型、BoxProvider |
| Command | Phase 1 命令、StatsCommand、DirCommand |
| TreeDecorator | ModifiedStar、BoxTypeLabel |
| AttributeHandler | BoxAttributes 的 fill、label |

代码装配入口为 `src/host/CodeAssembly.ts`；配置入口为根目录 `plugins.config.json`：

```json
{
  "plugins": [
    { "module": "./src/plugins/stats" },
    { "module": "./src/plugins/dir" },
    { "module": "./src/plugins/shape-box" },
    { "module": "./src/plugins/modified-star" }
  ]
}
```

每个插件用 package.json 的 `contributes` 声明扩展名称。两种装配共同执行激活、清单校验和注册事务。配置数组决定加载顺序，`enabled: false` 跳过插件，`options` 传给插件的 `activate`。

## VSCode 扩展

通过扩展面板的 **Install from VSIX** 安装 `packages/svg-lab-outline-0.2.0.vsix`，打开 `extensions/vscode-svg/examples/`。

- Explorer 中 SVG 文件显示 `[]`。
- 以 Text Editor 打开 SVG，原生 Outline 显示嵌套元素和 ID。
- 点击 `rect#start` 定位到第 3 行；编辑后大纲更新。
- XML 输入不完整时大纲清空，修复后恢复。

源码调试：在扩展目录运行 `npm ci && npm run build`，以该目录为 VSCode 工作区，按 F5。详细步骤见 [扩展 README](extensions/vscode-svg/README.md)。

## DSH SVG 工作台

实测版本：DSH 0.2.2-rc.3、Cordis 4.1.0。

```bash
dsh plugin --profile web add "./packages/dsh-svg-workbench-0.2.0.tgz"
dsh web
```

从目标项目目录启动 DSH；插件的 `root` 选项可以指定文件根目录。

| 工具 | 功能 |
| --- | --- |
| svg_inspect | 读取 SVG，返回 ID 和结构 |
| svg_edit | 原子执行一批编辑命令 |
| svg_history | 撤销或重做一个成功批次 |
| svg_save | 保存当前 SVG |

工具状态按 agent 隔离，编辑批次失败时整体回滚。使用说明见 [DSH README](integrations/dsh-svg/README.md)。

## 验证

```bash
npm run check
npm run verify:baseline
npm run verify:assembly
npm --prefix extensions/vscode-svg ci
npm run test:vscode
npm --prefix integrations/dsh-svg ci
npm run test:dsh
```

`check` 执行 TypeScript、ESLint 和覆盖率检查。基线验证从 Git 的 `final` 提取旧版本，装配验证比较三组会话的逐字节输出，并检查插件接入提交的差异。

```bash
node scripts/metrics.mjs HEAD
node scripts/metrics.mjs p2
```

指标脚本从指定 Git 提交读取源文件，生成 [模块职责、行数和复杂度报告](docs/metrics/README.md)。源码会话和预期输出位于 `doc/transcript/`。

## 小组分工

| 学号 | 姓名 | 负责范围 |
| --- | --- | --- |
| 26213050319 | 戚子祥 | VSCode 文件标记、大纲、定位、更新、截图与复用分析 |
| 26213050263 | 梁军斌 | stats、dir、目录适配器及独立测试 |
| 26213050456 | 于国昊 | box、属性处理、事务回滚、部件保护与读回 |
| 26213050303 | 马云松 | 树标签、dirty 语义和架构指标 |
| 26213050371 | 王以撒 | 四扩展点、加载器、基线回归、集成与实验文档 |
| 26213050368 | 王鑫浩 | DSH 插件设计、SDK 接入和工具验证 |
