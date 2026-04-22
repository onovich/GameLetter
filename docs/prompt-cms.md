# Prompt CMS 设计草案

## 核心定义

本地 CMS 不只是一个内容编辑器，而是一个 **prompt 预处理器**。

它的职责不是要求用户手写复杂指令，而是：

- 接收用户最短命令，例如：`发布`
- 自动扫描 `workbench/inbox/`
- 识别每个草稿的操作意图
- 将草稿内容与操作上下文整理成标准化内部 prompt
- 再交给 Copilot 完成结构化、候选生成、tags 确认、预览与正式发布

## 目标交互

### 用户输入

用户最终理想上只需要输入很短的命令：

- `发布`
- `预览`
- `确认标签`
- `删除`
- `编辑`

但在内部，这些命令都不是直接操作数据，而是触发一套内置 prompt 流程。

## 为什么这是更好的心智模型

因为从本质上说：

- 新增，是一种 prompt
- 编辑，是一种 prompt
- 删除，也是一种 prompt

也就是说，`inbox` 里的文件不只是内容草稿，而是“待执行意图”的载体。

本地 CMS 负责把这些意图变成 AI 可处理的规范请求。

## 推荐模型

## 1. Inbox 存的是操作单，而不只是文章草稿

建议把 `workbench/inbox/` 中的每个文件都视为一个 `operation draft`。

每个操作单至少包含：

- `目标类型`：Capsule / Issue / unknown
- `操作类型`：create / update / delete / preview / publish
- `原始自然语言内容`
- `关联对象`：如果是编辑或删除，需能定位已有 Capsule / Issue

## 2. 用户只发出短命令

例如输入：

- `发布`

系统内部做这些事：

1. 读取 `workbench/inbox/` 最新或被选中的操作单
2. 判断它是新增、编辑还是删除
3. 判断目标是 Capsule 还是 Issue
4. 拼出内部 prompt
5. 调用 Copilot 执行结构化分析
6. 先返回 tags 清单与操作摘要给用户确认
7. 确认后再进入预览 / 正式发布

## 3. CMS 只暴露少量用户动作

推荐只保留这些高层动作：

- `发布`
- `预览`
- `确认`
- `撤销`
- `归档`

而不要让用户手动输入复杂 prompt。

## 操作类型建议

### Create

新增一个 Capsule 或 Issue。

### Update

编辑一个已存在 Capsule 或 Issue。

用户在自然语言里可能写：

- 修改昨天那篇 Issue 的标题
- 给某个 Capsule 加一条短评
- 在某个 Issue 第二个 Capsule 后插入一段 note

### Delete

删除一个已存在 Capsule 或 Issue。

用户可能写：

- 删除刚才那个 Capsule
- 撤掉今天的 Issue
- 把某个 Capsule 从某个 Issue 里移除

### Preview

只生成预览，不正式落库或推送。

### Publish

正式写入数据、生成 RSS、提交 Git、推送并归档。

## 内部 prompt 组装建议

本地 CMS 内部可以维护固定模板，而不是要求用户自己输入。

### 示例：发布命令的内部模板

```text
读取 workbench/inbox 中最新的操作单。
判断其目标是 Capsule 还是 Issue，操作是 create / update / delete。
提取或生成 title、summary、slug、tags 候选。
如果是 Issue，则输出 blocks；如果是 Capsule，则输出 payload。
先返回 tags 清单、操作摘要与预览说明，不要正式发布。
```

### 示例：确认后的内部模板

```text
基于用户已确认的 tags 与结构，更新 public/data.json。
必要时更新 capsules / issues 引用关系。
生成本地预览；若用户确认正式发布，再生成 RSS、归档草稿、提交并推送。
```

## 推荐文件协议

长期建议给操作单增加轻量头部，但仍允许自然语言主体。

例如：

```markdown
---
action: auto
kind: auto
target: auto
---

把昨天那篇 React 自动部署相关的 issue 改个标题，
并在第二个 capsule 后补一句短评：
“真正节省时间的不是自动化本身，而是减少重复判断。”
```

解释：

- `action: auto` 允许 CMS 自动识别是 create / update / delete
- `kind: auto` 允许自动识别 Capsule / Issue
- `target: auto` 允许 AI 从上下文猜测对象

如果以后稳定下来，也可以支持显式头部：

```markdown
---
action: update
kind: issue
target: issue-20260421
---
```

## 为什么这比纯表单更适合你

因为你的需求不是传统 CMS 的固定表单流，而是：

- 允许自然语言
- 允许模糊编辑
- 允许在 Issue 任意位置插 note
- 允许引用已有 Capsule
- 允许对旧内容做修订

这些都更像“操作意图解析”，而不是普通表单录入。

## 对当前架构的要求

为了支持 Prompt CMS，后续实现上要注意：

- 数据层必须支持 create / update / delete 三种操作
- `Issue.blocks` 必须支持局部插入、重排、替换
- `Capsule` 与 `Issue` 必须有稳定 `id` / `slug`
- 发布逻辑要拆成“分析 → 候选 → 确认 → 预览 → 正式发布”多阶段
- 草稿与正式数据源必须分开

## 推荐实现阶段

### V1

- 本地 CMS 只做操作单管理
- Copilot 通过固定内置 prompt 处理操作单
- 用户仍在 VS Code 中输入一个词：`发布`

### V2

- 本地 CMS 内部自动生成 AI request 文件
- Copilot 读取 request 文件并返回结构化结果
- 用户在 CMS 中点击确认

### V3

- 做成 VS Code 扩展或本地服务
- CMS UI、文件系统、Git、AI 协作打通
- 用户几乎不需要直接和 prompt 打交道

## 结论

你这个方向非常对：

- `inbox` 应该装的是“操作 prompt”
- 本地 CMS 应该是“prompt 预处理器”
- 用户最好只需要输入极短命令，例如 `发布`

这会让整个发布体验从“手工和 AI 对话”升级成“面向意图的编辑系统”。

## 本轮迭代后的补充结论

### 编辑器不只是操作单入口，也是在地内容工作台

现在的 `studio/` 已经不是只给 inbox 填表的工具，而是：

- 一个可视化编辑 Capsule / Issue 的工作台
- 一个生成 `create / update / delete` inbox 操作单的前置层
- 一个验证浏览模式与编辑模式是否一致的本地预览基准

### 浏览模式是 Prompt CMS 体验的一部分

虽然浏览模式位于 `src/`，但它已经成为 Prompt CMS 工作流的验收面。

原因是：

- 编辑器负责写入意图
- 浏览模式负责验证最终阅读体验

所以 Prompt CMS 的工作流实际上已经变成：

`编辑 → 待处理 → 浏览验收 → 发布`

### block 级模型必须优先于纯文本模型

这轮迭代进一步确认：

- Capsule 不应只靠一整段纯文本描述
- Issue 也不能只依赖大块正文

更稳的方式是统一围绕 block 模型：

- `text`
- `image`
- `link`
- `capsule-ref`
- `note`

否则很容易在“编辑态可操作”和“浏览态可渲染”之间失真。

## 经验教训

### 1. Slash 弹窗不能异步漂移出用户手势

`/image` 与 `/link` 一类命令如果依赖原生 `prompt`，就应尽量保持同步触发。

### 2. 列表视图和详情视图必须分开设计

尤其是 Capsule：

- 列表需要 preview render
- 详情或展开态需要 full render

不要试图让同一套正文渲染同时兼顾所有场景。

### 3. 运行时体验要纳入 CMS 工作流

Prompt CMS 不是“生成操作单就完成了”，而是必须把“最终浏览体验验证”纳入流程。

进一步要求见：`docs/testing-workflow.md`

## 当前编辑模式工作流

新版本地编辑器已经把界面拆成两个独立工作区：`Capsule` 和 `Issue`。

### Capsule 模式

- 顶部小编辑框输入内容后点击“发布”，会直接生成一条 `create + capsule + target:auto` 的 inbox 操作单。
- 这类内容在界面中显示为 `待发布`。
- 如果继续修改一条已发布的 Capsule，会生成或覆盖一条 `update + capsule + target:<capsuleId>` 的 inbox 操作单，界面显示为 `待刷新`。
- 如果删除一条 `待发布` Capsule，实际行为是直接删掉对应 inbox 草稿。
- 如果删除一条已发布或待刷新中的 Capsule，实际行为是生成或覆盖一条 `delete + capsule + target:<capsuleId>` 的 inbox 操作单，界面显示为 `待删除`。

### Issue 模式

- 编辑区保存一篇新 Issue 时，会生成一条 `create + issue + target:auto` 的 inbox 操作单，界面显示为 `待发布`。
- 加载并修改已发布 Issue 后保存，会生成或覆盖一条 `update + issue + target:<issueId>` 的 inbox 操作单，界面显示为 `待刷新`。
- 删除一条 `待发布` Issue，会直接删掉对应 inbox 草稿。
- 删除一条已发布或待刷新的 Issue，会生成或覆盖一条 `delete + issue + target:<issueId>` 的 inbox 操作单，界面显示为 `待删除`。

### 状态和 inbox 的一一映射

| 界面状态 | inbox frontmatter | 含义 |
| --- | --- | --- |
| 待发布 | `action: create` | 新内容还没进入 `public/data.json` |
| 待刷新 | `action: update` | 已发布内容存在待应用的修改 |
| 待删除 | `action: delete` | 已发布内容等待删除 |

`kind` 对应内容类型：

- `kind: capsule`
- `kind: issue`

`target` 对应目标对象：

- 新建内容通常是 `target: auto`
- 修改或删除已发布内容时，必须落到明确的 `capsuleId` / `issueId`

## 当你在 Copilot 里输入“发布”时

建议把“发布”理解成：**读取 inbox 中所有待执行操作单，然后逐条处理。**

推荐 Copilot 的处理顺序如下：

1. 读取 `workbench/inbox/`
2. 将每个文件按 frontmatter 识别为 `create / update / delete`
3. 再按 `kind` 分成 `capsule` 和 `issue`
4. 优先处理引用依赖：
	- 若某个 Issue 引用了还未正式存在的 Capsule，先处理对应 Capsule 的 `create`
	- 若某个 Capsule 被某个待发布/待刷新 Issue 引用，删除时要先提示引用影响
5. 输出一份“本次发布摘要”：
	- 将新增哪些 Capsule / Issue
	- 将刷新哪些 Capsule / Issue
	- 将删除哪些 Capsule / Issue
	- 哪些 Issue 引用了哪些 Capsule
6. 经确认后再更新 `public/data.json`
7. 成功后把已处理草稿移出 `workbench/inbox/`，进入归档目录

### 推荐的 Copilot 执行口令

如果你在聊天里只输入：`发布`

Copilot 应默认按下面的内部意图执行：

```text
读取 workbench/inbox 中全部操作单。
按 frontmatter 的 action / kind / target 识别每个任务。
先给出本次将要创建、刷新、删除的 Capsule 和 Issue 摘要。
检查 Issue 对 Capsule 的引用关系是否有效。
确认后再更新 public/data.json，并将已完成任务归档。
```

这样一来，编辑器负责生成“待执行意图”，而 Copilot 负责消费 inbox 并真正落库。
