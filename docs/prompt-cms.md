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
