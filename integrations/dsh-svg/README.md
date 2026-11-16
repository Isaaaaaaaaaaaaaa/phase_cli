# DSH SVG Workbench

为 DeepSeek Harness 提供 SVG 结构化编辑工具。实测宿主 DSH 0.2.2-rc.3，Cordis 4.1.0。

## 安装

在项目根目录安装并启动：

```bash
dsh plugin --profile web add "./packages/dsh-svg-workbench-0.2.0.tgz"
dsh web
```

已有包路径可替换为实际安装包位置。使用 npm 临时启动宿主：

```bash
npm exec --yes --package=@deepseek-ai/dsh@0.2.2-rc.3 --package=pnpm@12.18.0 -- dsh plugin --profile web add "./packages/dsh-svg-workbench-0.2.0.tgz"
npm exec --yes --package=@deepseek-ai/dsh@0.2.2-rc.3 -- dsh web
```

文件根目录默认为宿主工作目录，可通过插件的 `root` 选项设置。

## 工具

| 名称 | 功能 |
| --- | --- |
| svg_inspect | 读取 SVG，返回元素 ID 和层级 |
| svg_edit | 原子执行最多 100 条编辑命令 |
| svg_history | 撤销或重做一个成功批次 |
| svg_save | 保存当前 SVG |

状态按 agent 隔离。批次失败时保留原文档与历史；保存通过指定工具执行。输入 SVG 上限为 2 MiB，路径通过实际目录与符号链接解析校验。

示例请求：“创建两个带中文标题的流程节点，将第二个节点下移 100 像素，修改标题并保存为 flow.svg。”

## 开发与测试

在本插件目录执行：

```bash
npm ci
npm test
npm pack
```

测试使用真实 Cordis 和 ToolsService 验证注册、参数、执行及卸载，并检查 agent 隔离、批次回滚和路径处理。安装包包含编辑器、CLI 插件和 SDK 运行辅助代码。
