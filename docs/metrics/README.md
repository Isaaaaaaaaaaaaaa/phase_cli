# 自动生成指标

运行 `node scripts/metrics.mjs p2`。基线为 `final`。所有源文件读取 Git 历史；数字不可手改。

口径：physical LOC, AST function CC=1 + if/loops/case/catch/ternary/&&/||/??; nested functions counted separately; tests/dependencies/build outputs excluded

VSCode 单独列出，不混入 CLI 增量。

| 分类 | 文件数 final → Phase 2 | 行数 | 圈复杂度 | 复杂度增量 |
| --- | --- | --- | --- | --- |
| 内核 | 37 → 22 | 1886 → 963 | 356 → 232 | -124 |
| 装配处 | 5 → 9 | 550 → 448 | 136 → 114 | -22 |
| 插件 | 0 → 28 | 0 → 1184 | 0 → 265 | 265 |
| VSCode | 0 → 5 | 0 → 118 | 0 → 31 | 31 |

## 文件清单与职责

职责由 AST 中的类/接口名生成，目录类别由脚本规则生成。

| 文件 | 分类 | 类/接口职责 | 行数 | 复杂度 |
| --- | --- | --- | --- | --- |
| extensions/vscode-svg/src/SvgDocumentSymbolProvider.ts | VSCode | SvgDocumentSymbolProvider | 26 | 5 |
| extensions/vscode-svg/src/SvgFileDecorationProvider.ts | VSCode | SvgFileDecorationProvider | 25 | 9 |
| extensions/vscode-svg/src/XmlOutlineNode.ts | VSCode | XmlOutlineNode | 12 | 1 |
| extensions/vscode-svg/src/XmlOutlineParser.ts | VSCode | XmlOutlineParser | 37 | 12 |
| extensions/vscode-svg/src/extension.ts | VSCode | module entry | 18 | 4 |
| src/api.ts | 内核 | module entry | 24 | 0 |
| src/application/EditorSession.ts | 内核 | EditorSession | 32 | 7 |
| src/application/HistoryManager.ts | 内核 | HistoryManager | 56 | 9 |
| src/application/SvgEditor.ts | 内核 | SvgEditor | 36 | 8 |
| src/application/commands/EditorCommand.ts | 内核 | EditorCommand, IoCommand, ReversibleCommand | 20 | 0 |
| src/application/commands/SnapshotCommand.ts | 内核 | SnapshotCommand | 44 | 6 |
| src/application/ports/DirectoryReader.ts | 内核 | DirectoryEntry, DirectoryReader | 8 | 0 |
| src/application/ports/SvgRepository.ts | 内核 | ReadResult, SvgRepository | 11 | 0 |
| src/application/presentation/ShapeRenderer.ts | 内核 | ShapeRenderer | 20 | 6 |
| src/application/presentation/TreeRenderer.ts | 内核 | TreeRenderer | 37 | 11 |
| src/cli/CommandFactory.ts | 装配处 | CommandFactory | 17 | 4 |
| src/cli/CommandTokenizer.ts | 装配处 | CommandToken, CommandTokenizer | 60 | 14 |
| src/cli/SvgCli.ts | 装配处 | module entry | 11 | 0 |
| src/cli/SvgCliApplication.ts | 装配处 | SvgCliApplication | 41 | 8 |
| src/domain/EditorError.ts | 内核 | EditorError | 6 | 1 |
| src/domain/ShapeFactory.ts | 内核 | ShapeFactory | 24 | 9 |
| src/domain/SvgDocument.ts | 内核 | ShapeLocation, SvgDocument | 278 | 77 |
| src/domain/shapes/GroupShape.ts | 内核 | GroupShape | 90 | 26 |
| src/domain/shapes/Shape.ts | 内核 | ShapeOptions, Shape | 128 | 27 |
| src/extensions/AttributeHandler.ts | 内核 | AttributeHandler | 8 | 0 |
| src/extensions/Command.ts | 内核 | Command | 9 | 0 |
| src/extensions/ExtensionRegistry.ts | 内核 | ExtensionRegistry | 72 | 45 |
| src/extensions/Plugin.ts | 内核 | PluginContext, Plugin, PluginManifest | 19 | 0 |
| src/extensions/PluginServices.ts | 内核 | PluginServices | 13 | 0 |
| src/extensions/ShapeProvider.ts | 内核 | SvgShapeInput, ShapeProvider | 15 | 0 |
| src/extensions/TreeDecorator.ts | 内核 | EditorEvent, TreeDecorator | 13 | 0 |
| src/host/CodeAssembly.ts | 装配处 | CodeAssembly | 9 | 1 |
| src/host/EditorHost.ts | 装配处 | EditorHost | 35 | 3 |
| src/host/NodeDirectoryReader.ts | 装配处 | NodeDirectoryReader | 12 | 6 |
| src/host/loading/PluginLoader.ts | 装配处 | PluginLoader | 77 | 38 |
| src/infrastructure/FileSvgRepository.ts | 装配处 | FileSvgRepository | 186 | 40 |
| src/plugins/builtin-commands/AddToCommand.ts | 插件 | AddToCommand | 27 | 3 |
| src/plugins/builtin-commands/BackCommand.ts | 插件 | BackCommand | 19 | 3 |
| src/plugins/builtin-commands/BuiltinCommandsPlugin.ts | 插件 | BuiltinCommandsPlugin | 250 | 74 |
| src/plugins/builtin-commands/CanvasCommand.ts | 插件 | CanvasCommand | 24 | 6 |
| src/plugins/builtin-commands/CommandDefinition.ts | 插件 | CommandDefinition | 11 | 2 |
| src/plugins/builtin-commands/CreateCommand.ts | 插件 | CreateCommand | 25 | 4 |
| src/plugins/builtin-commands/DeleteCommand.ts | 插件 | DeleteCommand | 22 | 3 |
| src/plugins/builtin-commands/FrontCommand.ts | 插件 | FrontCommand | 19 | 3 |
| src/plugins/builtin-commands/GroupCommand.ts | 插件 | GroupCommand | 19 | 3 |
| src/plugins/builtin-commands/HelpCommand.ts | 插件 | HelpCommand | 16 | 6 |
| src/plugins/builtin-commands/InitCommand.ts | 插件 | InitCommand | 16 | 2 |
| src/plugins/builtin-commands/MoveCommand.ts | 插件 | MoveCommand | 34 | 9 |
| src/plugins/builtin-commands/ReadCommand.ts | 插件 | ReadCommand | 27 | 4 |
| src/plugins/builtin-commands/RedoCommand.ts | 插件 | RedoCommand | 12 | 2 |
| src/plugins/builtin-commands/SaveCommand.ts | 插件 | SaveCommand | 26 | 5 |
| src/plugins/builtin-commands/ScaleCommand.ts | 插件 | ScaleCommand | 26 | 5 |
| src/plugins/builtin-commands/SetCommand.ts | 插件 | SetCommand | 31 | 4 |
| src/plugins/builtin-commands/ShowCommand.ts | 插件 | ShowCommand | 16 | 2 |
| src/plugins/builtin-commands/TreeCommand.ts | 插件 | TreeCommand | 14 | 2 |
| src/plugins/builtin-commands/UndoCommand.ts | 插件 | UndoCommand | 12 | 2 |
| src/plugins/builtin-commands/UngroupCommand.ts | 插件 | UngroupCommand | 18 | 3 |
| src/plugins/builtin-shapes/BuiltinShapeProvider.ts | 插件 | BuiltinShapeProvider | 44 | 25 |
| src/plugins/builtin-shapes/BuiltinShapesPlugin.ts | 插件 | BuiltinShapesPlugin | 29 | 9 |
| src/plugins/builtin-shapes/CircleShape.ts | 插件 | CircleShape | 82 | 16 |
| src/plugins/builtin-shapes/EllipseShape.ts | 插件 | EllipseShape | 93 | 17 |
| src/plugins/builtin-shapes/LineShape.ts | 插件 | LineShape | 91 | 16 |
| src/plugins/builtin-shapes/RectShape.ts | 插件 | RectShape | 93 | 17 |
| src/plugins/builtin-shapes/TextShape.ts | 插件 | TextShape | 88 | 18 |
