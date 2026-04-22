# 发布工作台

这个目录是 GameLetter 的内容工作台。

## 目录约定

- `workbench/inbox/`：待发布草稿
- `workbench/archive/`：已发布归档

## 核心交互原则

这个工作台的目标不是让你手动输入复杂 prompt，而是让你只输入极短命令，例如：`发布`。

也就是说：

- `workbench/inbox/` 存放的是待执行的操作单
- 本地 CMS 负责读取这些操作单
- 本地 CMS 会把自然语言内容整理成内置 prompt
- Copilot 负责理解、结构化、生成 tags 候选、预览和正式发布

换句话说：

- 新增，是一种 prompt
- 编辑，是一种 prompt
- 删除，也是一种 prompt

本地 CMS 的本质是 **prompt 预处理器**。

## 日常发布流程

### 1. 写草稿

把新的简报草稿写成一个 `.md` 文件，放进 `workbench/inbox/`。

要求尽量宽松：

- 可以使用自然语言
- 不要求严格 Markdown 语法
- 不需要手动打标签
- 标题默认从文件中的第一行标题或最显眼的一句提取
- 日期、时间以正式发布时刻为准

### 2. 触发“发布”

理想交互不再是你手写长 prompt，而是你只发出一个短命令：

- `发布`

然后由本地 CMS / 内置流程自动做这些事：

- 读取 `workbench/inbox/` 中最新或被选中的操作单
- 自动判断这是新增、编辑还是删除
- 自动判断你这次更适合发布 `Capsule` 还是 `Issue`
- 自动提取标题
- 自动生成摘要
- 自动生成 `id` 与 `slug`
- 自动识别内容项并转换成 `capsule-ref` / `note` 或 `payload`
- 自动给出一份 tags 候选清单，等待你确认

如果是编辑或删除，也会先返回操作摘要，避免误操作。

### 3. 预览

你确认 tags 后，再进入预览：

- 由本地 CMS 自动把确认结果交给 Copilot
- Copilot 生成结构化候选并写入预览态数据

推荐预览方式：

- Copilot 写入 `public/data.json`
- 本地运行 `npm run dev`
- 你在浏览器中检查实际页面效果

### 4. 正式发布

预览确认后，再执行正式发布。

正式发布动作包括：

- 将 create / update / delete 操作落到 `public/data.json`
- 重新生成 RSS
- 提交并推送到远端
- 将原始草稿移动到 `workbench/archive/`

## Capsule 与 Issue 的发布区别

### 发布 Capsule

- 适合沉淀单个链接、图像、观点或工具条目
- 可通过直链访问
- 可通过搜索命中
- 不出现在首页流
- 不进入 RSS

### 发布 Issue

- 适合对外正式发布一期 newsletter / digest
- 由多个 Capsule 与若干 note 组成
- 会出现在首页流
- 会进入 RSS
- Issue 内部可以嵌入已存在的 Capsule

## 草稿书写建议

虽然你不需要遵守严格格式，但为了提高识别质量，建议保留这些信息：

- 一个明显标题
- 若干段导语/观点
- 若干链接（最好每行一个或明显可识别）
- 若干图片链接或图片说明
- 你自己的短评

## 示例操作意图

下面这些文件内容，本质上都可以是 `inbox` 中的操作单。

### 新增 Capsule

- `我想发一个 capsule，内容是这篇关于游戏 HUD 的文章，附一句短评……`

### 新增 Issue

- `把下面 3 个内容点整理成一期 newsletter，并在第二个 capsule 后加一段 note……`

### 编辑

- `把昨天那篇 issue 的标题改短一点，并在第二个 capsule 后加一句旁白……`

### 删除

- `删除刚刚发布的那个 capsule，它的短评不合适。`

## 详细规格

更完整的 Prompt CMS 设计见：`docs/prompt-cms.md`

## Prompt CMS v1 启动方式

在仓库根目录运行：

```bash
npm run cms
```

然后打开：`http://localhost:4318`

当前版本支持：

- 浏览 inbox 操作单
- 新建 / 编辑 / 删除操作单
- 一键生成发布 request
- 一键生成预览 request
- 发布前校验目标对象与 Capsule 引用是否合法
- 查看最近生成的 request 历史
- 一键归档到 `workbench/archive/`
- 可视化选择现有 Issue / Capsule 作为目标对象
- 一键把现有 Capsule 引用插入到 Issue 草稿中
- 直接为现有 Issue / Capsule 生成删除草稿
- 自动写出：
	- `workbench/pending/latest-request.json`
	- `workbench/pending/latest-prompt.txt`

因此，后续你在 Copilot 中只需要发出短命令：`发布`，就可以让 Copilot 读取最新 request 并继续执行。
