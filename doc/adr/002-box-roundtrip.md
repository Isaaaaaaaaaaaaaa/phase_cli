# ADR-002：复合图形不变量与读回降级

状态：采用。

必要子部件 ID 为 `<id>-rect` 和 `<id>-label`，类型分别为 rect 和 text。BoxShape 构造与 clone 都验证结构，不能产生不完整对象。新增整棵子树先检查全局 ID，冲突整条 create 失败。

保存为 g + data-kind=box，保留普通 SVG 可渲染性。BoxProvider 加载后优先于通用 g provider 匹配；缺插件时通用 g provider 接手，语义降级但树不损坏。

已加载插件但必要部件缺失或类型错误，拒绝整个 read 并保留当前文档；不尝试修补。所有重复 ID 拒绝，与是否降级无关。

通过普通 delete/addto/group 移走必要部件，以及 ungroup box，被公开容器保护契约拒绝。整体删除、移动、缩放和新增嵌套子树允许。

取舍：严格拒绝比带警告降级更利于发现插件所有的内部结构被破坏；用户仍可禁用插件后作为普通分组读入。
