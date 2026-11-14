# SVG Frame — Lab2

TypeScript SVG CLI 插件框架、VSCode SVG 大纲/文件标记、DeepSeek Harness SVG 工作台。

仓库：<https://github.com/Isaaaaaaaaaaaaaa/phase_cli_1> · Phase 1 标签 `final` · Phase 2 标签 `p2`

```bash
npm ci
npm run cli
npm run cli -- --config plugins.config.json
npm run check
```

使用 Node.js 24.9+。CLI 支持六种基本图形、box、undo/redo、stats、dir 和保存基线树标签；`--no-plugins` 保持 Phase 1 输出。

- [完整实验文档、架构、扩展契约、ADR 与证据](doc/README.md)
- [小组分工](doc/team.md)
- [VSCode 安装与真实宿主验证](extensions/vscode-svg/README.md)
- [DSH 插件安装与测试](integrations/dsh-svg/README.md)
- [自动历史指标](docs/metrics/README.md)

新增插件只实现公开接口并修改组合根或配置。box 的 A/B 演示提交与标签接入通过脚本验证零内核变化。所有验证脚本随源码提交。
