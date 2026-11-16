# 架构指标

生成：`node scripts/metrics.mjs e96bdca`。

基线：`final`（52958b4）；统计提交：`e96bdca`。

脚本从 Git 历史解析 TypeScript AST，按模块职责分类。物理行数包含注释和空行；函数圈复杂度从 1 起算，if、循环、case、catch、三元表达式及 && / || / ?? 各增加 1。嵌套函数独立计数。依赖、测试和构建产物排除。

VSCode 单列；JSON 清单另列。

| 分类 | 文件数 final → 统计提交 | 行数 | 圈复杂度 | 复杂度增量 |
| --- | --- | --- | --- | --- |
| 内核 | 37 → 22 | 1886 → 979 | 356 → 239 | -117 |
| 装配处 | 5 → 10 | 550 → 463 | 136 → 116 | -20 |
| 插件 | 0 → 39 | 0 → 1370 | 0 → 345 | 345 |
| VSCode | 0 → 5 | 0 → 132 | 0 → 42 | 42 |

## 文件清单与职责

| 文件 | 分类 | 职责 | 行数 | 复杂度 |
| --- | --- | --- | --- | --- |
| extensions/vscode-svg/src/SvgDocumentSymbolProvider.ts | VSCode | XML 源范围解析及 VSCode 文件/符号展示适配；SvgDocumentSymbolProvider | 26 | 5 |
| extensions/vscode-svg/src/SvgFileDecorationProvider.ts | VSCode | XML 源范围解析及 VSCode 文件/符号展示适配；SvgFileDecorationProvider | 25 | 9 |
| extensions/vscode-svg/src/XmlOutlineNode.ts | VSCode | XML 源范围解析及 VSCode 文件/符号展示适配；XmlOutlineNode | 26 | 12 |
| extensions/vscode-svg/src/XmlOutlineParser.ts | VSCode | XML 源范围解析及 VSCode 文件/符号展示适配；XmlOutlineParser | 37 | 12 |
| extensions/vscode-svg/src/extension.ts | VSCode | XML 源范围解析及 VSCode 文件/符号展示适配；启动入口 | 18 | 4 |
| src/api.ts | 内核 | 插件可使用的公开 API 门面；启动入口 | 24 | 0 |
| src/application/EditorSession.ts | 内核 | 会话、命令快照、历史及编辑编排；EditorSession | 32 | 7 |
| src/application/HistoryManager.ts | 内核 | 会话、命令快照、历史及编辑编排；HistoryManager | 56 | 9 |
| src/application/SvgEditor.ts | 内核 | 会话、命令快照、历史及编辑编排；SvgEditor | 36 | 11 |
| src/application/commands/EditorCommand.ts | 内核 | 会话、命令快照、历史及编辑编排；EditorCommand, IoCommand, ReversibleCommand | 20 | 0 |
| src/application/commands/SnapshotCommand.ts | 内核 | 会话、命令快照、历史及编辑编排；SnapshotCommand | 44 | 6 |
| src/application/ports/DirectoryReader.ts | 内核 | 宿主 I/O 依赖端口；DirectoryEntry, DirectoryReader | 8 | 0 |
| src/application/ports/SvgRepository.ts | 内核 | 宿主 I/O 依赖端口；ReadResult, SvgRepository | 11 | 0 |
| src/application/presentation/ShapeRenderer.ts | 内核 | 结构树和属性明细的基线渲染；ShapeRenderer | 20 | 6 |
| src/application/presentation/TreeRenderer.ts | 内核 | 结构树和属性明细的基线渲染；TreeRenderer | 37 | 11 |
| src/cli/CommandFactory.ts | 装配处 | REPL、命令输入、分发及统一错误输出；CommandFactory | 17 | 4 |
| src/cli/CommandTokenizer.ts | 装配处 | REPL、命令输入、分发及统一错误输出；CommandTokenizer | 58 | 14 |
| src/cli/SvgCli.ts | 装配处 | REPL、命令输入、分发及统一错误输出；启动入口 | 11 | 0 |
| src/cli/SvgCliApplication.ts | 装配处 | REPL、命令输入、分发及统一错误输出；SvgCliApplication | 41 | 8 |
| src/domain/EditorError.ts | 内核 | 封装图形、组合树、ID 不变量及图形工厂；EditorError | 6 | 1 |
| src/domain/ShapeFactory.ts | 内核 | 封装图形、组合树、ID 不变量及图形工厂；ShapeFactory | 24 | 11 |
| src/domain/SvgDocument.ts | 内核 | 封装图形、组合树、ID 不变量及图形工厂；ShapeLocation, SvgDocument | 278 | 77 |
| src/domain/shapes/GroupShape.ts | 内核 | 封装图形、组合树、ID 不变量及图形工厂；GroupShape | 90 | 26 |
| src/domain/shapes/Shape.ts | 内核 | 封装图形、组合树、ID 不变量及图形工厂；ShapeOptions, Shape | 128 | 27 |
| src/extensions/AttributeHandler.ts | 内核 | 公开扩展契约、注册、属性路由及标签组合；AttributeHandler | 8 | 0 |
| src/extensions/Command.ts | 内核 | 公开扩展契约、注册、属性路由及标签组合；CommandToken, Command | 12 | 0 |
| src/extensions/ExtensionRegistry.ts | 内核 | 公开扩展契约、注册、属性路由及标签组合；ExtensionRegistry | 85 | 47 |
| src/extensions/Plugin.ts | 内核 | 公开扩展契约、注册、属性路由及标签组合；PluginContext, Plugin, PluginManifest | 19 | 0 |
| src/extensions/PluginServices.ts | 内核 | 公开扩展契约、注册、属性路由及标签组合；PluginServices | 13 | 0 |
| src/extensions/ShapeProvider.ts | 内核 | 公开扩展契约、注册、属性路由及标签组合；SvgShapeInput, ShapeProvider | 15 | 0 |
| src/extensions/TreeDecorator.ts | 内核 | 公开扩展契约、注册、属性路由及标签组合；EditorEvent, TreeDecorator | 13 | 0 |
| src/host/CodeAssembly.ts | 装配处 | 启动装配、宿主门面与真实目录适配；CodeAssembly | 19 | 1 |
| src/host/EditorHost.ts | 装配处 | 启动装配、宿主门面与真实目录适配；EditorHost | 35 | 3 |
| src/host/NodeDirectoryReader.ts | 装配处 | 启动装配、宿主门面与真实目录适配；NodeDirectoryReader | 12 | 6 |
| src/host/api.ts | 装配处 | 启动装配、宿主门面与真实目录适配；启动入口 | 3 | 0 |
| src/host/loading/PluginLoader.ts | 装配处 | 模块解析、配置校验及注册事务；PluginLoader | 81 | 40 |
| src/infrastructure/FileSvgRepository.ts | 装配处 | XML 与领域对象适配及原子文件保存；FileSvgRepository | 186 | 40 |
| src/plugins/builtin-commands/AddToCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；AddToCommand | 27 | 3 |
| src/plugins/builtin-commands/BackCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；BackCommand | 19 | 3 |
| src/plugins/builtin-commands/BuiltinCommandsPlugin.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；BuiltinCommandsPlugin | 250 | 74 |
| src/plugins/builtin-commands/CanvasCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；CanvasCommand | 24 | 6 |
| src/plugins/builtin-commands/CommandDefinition.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；CommandDefinition | 11 | 2 |
| src/plugins/builtin-commands/CreateCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；CreateCommand | 25 | 4 |
| src/plugins/builtin-commands/DeleteCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；DeleteCommand | 22 | 3 |
| src/plugins/builtin-commands/FrontCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；FrontCommand | 19 | 3 |
| src/plugins/builtin-commands/GroupCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；GroupCommand | 19 | 3 |
| src/plugins/builtin-commands/HelpCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；HelpCommand | 16 | 6 |
| src/plugins/builtin-commands/InitCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；InitCommand | 16 | 2 |
| src/plugins/builtin-commands/MoveCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；MoveCommand | 34 | 9 |
| src/plugins/builtin-commands/ReadCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；ReadCommand | 27 | 4 |
| src/plugins/builtin-commands/RedoCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；RedoCommand | 12 | 2 |
| src/plugins/builtin-commands/SaveCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；SaveCommand | 26 | 5 |
| src/plugins/builtin-commands/ScaleCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；ScaleCommand | 26 | 5 |
| src/plugins/builtin-commands/SetCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；SetCommand | 31 | 4 |
| src/plugins/builtin-commands/ShowCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；ShowCommand | 16 | 2 |
| src/plugins/builtin-commands/TreeCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；TreeCommand | 14 | 2 |
| src/plugins/builtin-commands/UndoCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；UndoCommand | 12 | 2 |
| src/plugins/builtin-commands/UngroupCommand.ts | 插件 | 默认 CLI 命令参数、执行、撤销反馈或注册；UngroupCommand | 18 | 3 |
| src/plugins/builtin-shapes/BuiltinShapeProvider.ts | 插件 | 默认图形的几何、属性、克隆及类型注册；BuiltinShapeProvider | 44 | 25 |
| src/plugins/builtin-shapes/BuiltinShapesPlugin.ts | 插件 | 默认图形的几何、属性、克隆及类型注册；BuiltinShapesPlugin | 29 | 9 |
| src/plugins/builtin-shapes/CircleShape.ts | 插件 | 默认图形的几何、属性、克隆及类型注册；CircleShape | 82 | 16 |
| src/plugins/builtin-shapes/EllipseShape.ts | 插件 | 默认图形的几何、属性、克隆及类型注册；EllipseShape | 93 | 17 |
| src/plugins/builtin-shapes/LineShape.ts | 插件 | 默认图形的几何、属性、克隆及类型注册；LineShape | 91 | 16 |
| src/plugins/builtin-shapes/RectShape.ts | 插件 | 默认图形的几何、属性、克隆及类型注册；RectShape | 93 | 17 |
| src/plugins/builtin-shapes/TextShape.ts | 插件 | 默认图形的几何、属性、克隆及类型注册；TextShape | 88 | 18 |
| src/plugins/dir/DirCommand.ts | 插件 | 通过目录端口提供稳定的目录查询；DirCommand | 24 | 13 |
| src/plugins/dir/DirPlugin.ts | 插件 | 通过目录端口提供稳定的目录查询；DirPlugin | 7 | 2 |
| src/plugins/modified-star/ModifiedStar.ts | 插件 | 保存基线、dirty 指纹与行尾标签；ModifiedStar | 26 | 10 |
| src/plugins/modified-star/ModifiedStarPlugin.ts | 插件 | 保存基线、dirty 指纹与行尾标签；ModifiedStarPlugin | 6 | 1 |
| src/plugins/shape-box/BoxAttributes.ts | 插件 | 复合图形、必要部件、属性传播及类型标签；BoxAttributes | 12 | 6 |
| src/plugins/shape-box/BoxPlugin.ts | 插件 | 复合图形、必要部件、属性传播及类型标签；BoxPlugin | 18 | 7 |
| src/plugins/shape-box/BoxProvider.ts | 插件 | 复合图形、必要部件、属性传播及类型标签；BoxProvider | 22 | 16 |
| src/plugins/shape-box/BoxShape.ts | 插件 | 复合图形、必要部件、属性传播及类型标签；BoxShape | 30 | 14 |
| src/plugins/shape-box/BoxTypeLabel.ts | 插件 | 复合图形、必要部件、属性传播及类型标签；BoxTypeLabel | 8 | 2 |
| src/plugins/stats/StatsCommand.ts | 插件 | 只读深度优先图形统计；StatsCommand | 27 | 8 |
| src/plugins/stats/StatsPlugin.ts | 插件 | 只读深度优先图形统计；StatsPlugin | 6 | 1 |

## 运行配置与贡献清单

| 文件 | 职责 | 行数 |
| --- | --- | --- |
| extensions/vscode-svg/package.json | 包入口、兼容条件、依赖元数据和贡献清单 | 23 |
| package.json | 包入口、兼容条件、依赖元数据和贡献清单 | 48 |
| plugins.config.json | 配置装配的插件选择、顺序和 options | 8 |
| src/plugins/builtin-commands/package.json | 包入口、兼容条件、依赖元数据和贡献清单 | 6 |
| src/plugins/builtin-shapes/package.json | 包入口、兼容条件、依赖元数据和贡献清单 | 6 |
| src/plugins/dir/package.json | 包入口、兼容条件、依赖元数据和贡献清单 | 6 |
| src/plugins/modified-star/package.json | 包入口、兼容条件、依赖元数据和贡献清单 | 6 |
| src/plugins/shape-box/package.json | 包入口、兼容条件、依赖元数据和贡献清单 | 6 |
| src/plugins/stats/package.json | 包入口、兼容条件、依赖元数据和贡献清单 | 6 |
