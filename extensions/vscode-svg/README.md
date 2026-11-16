# SVG Outline and Badge

VSCode 扩展，提供 SVG 文件的 `[]` 标记和原生 Outline。

## 安装

在 VSCode 扩展面板选择 **Install from VSIX**，安装项目 `packages/` 下的 `svg-lab-outline-0.2.0.vsix`。

打开 `examples/`，以 Text Editor 打开 example.svg。Outline 显示元素嵌套、标签与 ID；点击节点定位源码，编辑后更新，不完整 XML 修复后恢复大纲。

## 开发

```bash
npm ci
npm run build
```

以本目录为 VSCode 工作区，按 F5 启动 Extension Development Host。`examples/.vscode/settings.json` 将 SVG 关联到文本编辑器。

## 验证

```bash
npm run test:host
```

真实宿主测试覆盖嵌套、无 ID、定位、编辑更新、不完整 XML、SVG 文件标记及目录排除。默认宿主为 VSCode 1.105.1，可用 `VSCODE_EXECUTABLE_PATH` 指定本地编辑器。

`scripts/verify-ui.py` 使用 Python Playwright 连接调试端口 9238，验证实际工作台的点击定位和编辑行为，并保存截图。

## 实现

SvgFileDecorationProvider 通过 FileDecorationProvider 返回界面元数据；SvgDocumentSymbolProvider 通过 DocumentSymbolProvider 返回层级和源范围。XML 解析及源节点模型独立于 CLI，VSCode 负责 Outline、刷新和导航。
