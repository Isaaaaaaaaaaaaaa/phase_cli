# ADR-004：暂存注册、清单校验与标准模块解析

状态：采用。

代码和配置装配共同调用 PluginLoader.install。activate 在临时 ExtensionRegistry 注册；同步激活完成后比较 package.json contributes 的四类名称集合，再合并到正式注册表。类别未声明视为空。

先检查所有重复名，全部通过后才合并。激活抛错、重名或清单不一致撤回本插件暂存内容，保留成功插件并继续。

配置按数组顺序；enabled=false 完全跳过；options 原样传入 activate，由插件验证。相对路径相对于配置目录，包名使用标准 require.resolve，然后动态 import。

分开入口解析和求值：顶层入口不存在报 plugin not found；入口存在但依赖失败报 failed to activate。无默认导出、清单不匹配和激活失败按实验格式输出。

CLI activate 为同步接口。Promise 返回被拒绝并捕获拒绝，防止后台注册及未处理异常。外部 DSH 生命周期不使用这个约束。

取舍：本阶段不做热卸载及启动期异步插件初始化，明确边界可以保证注册事务可审查。
