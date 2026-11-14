# ADR-001：属性处理器与一次编辑事务

状态：采用。

AttributeHandler 接收公开 Shape 和 SvgDocument，handles 负责纯查询，apply 通过公开方法修改目标或子部件，并返回修改前的值（string 或 undefined）。不开放私有字段。

同一目标属性多个命中时拒绝，错误列出注册名；不存在优先级暗中覆盖。没有处理器命中时回到 Shape 的原有白名单。apply 抛错不能回默认分支。

SetCommand 继承 SnapshotCommand；先克隆完整文档，成功后保存 after，再加入 HistoryManager。部分修改后失败恢复 before；历史和 redo 都不提交。一条 set 修改多个部件仍是一个 undo 单元。

ExtensionRegistry 检查 handles 前后内容指纹，拒绝纯查询阶段的意外修改。非法返回值也触发失败回滚。测试覆盖 box fill/label、默认属性、冲突、部分写入后抛错及 redo 保持。

取舍：完整快照比差量日志简单，空间成本更高；当前文档规模优先确保原子性。
