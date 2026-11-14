# ADR-005：目录访问适配器与稳定输出

状态：采用。

DirectoryReader 是目标接口，返回直接子项及 directory/file/link/other 类型。NodeDirectoryReader 把 readdirSync(withFileTypes) 结果适配为此接口；DirCommand 不知道 Node fs。

目录在前、普通文件其次，各组按确定性的字符串比较升序；链接/特殊项在其后，用 LINK/OTHER 标记，不跟随目标。隐藏项保留，不列出 . 和 ..。

DirCommand 是 query，无需文档。读取失败报 cannot read directory 加实际目标路径，不触发文档 I/O 屏障，不改变当前工作目录、dirty 或历史。

读取目录来自宿主启动工作目录，不来自当前 SVG 文件路径。两装配共用同一个接口和命令类，测试替身与真实固定临时目录都验证。

取舍：不用依赖操作系统语言环境的 localeCompare，以保证同一输入输出顺序稳定。
