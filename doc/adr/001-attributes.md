# ADR-001：属性处理器与一次编辑事务

状态：采用。

AttributeHandler 接收公开 Shape 和 SvgDocument，handles 负责纯查询，apply 通过公开方法修改目标或子部件，并返回修改前的值（string 或 undefined）。

同一目标属性多个命中时拒绝，错误列出注册名。零命中时使用 Shape 的原有白名单；apply 抛错进入事务回滚。

SetCommand 继承 SnapshotCommand；先克隆完整文档，成功后保存 after，再加入 HistoryManager。部分修改后失败恢复 before；历史和 redo 都不提交。一条 set 修改多个部件仍是一个 undo 单元。

ExtensionRegistry 检查 handles 前后的画布尺寸、内容与结构指纹，拒绝纯查询阶段的修改。非法返回值触发回滚。测试覆盖 box fill/label、默认属性、冲突、多部件一次撤销及部分写入失败后的 redo 保持。

取舍：完整快照比差量日志简单，空间成本更高；当前文档规模优先确保原子性。
