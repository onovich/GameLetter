# 内容发布工作流

## 目标

把日常发布流程统一成“在工作台写自然语言操作单，由本地 CMS 作为 prompt 预处理器，再由 Copilot 完成结构化与发布”的模式。

## 推荐目录

- `workbench/inbox/`：你当天正在写的稿件
- `workbench/archive/`：已经发布的原始稿件归档
- `public/data.json`：正式线上内容源

## 现在的内容发布目标

- `Capsule`：可独立访问、可被搜索命中、默认不进首页 / RSS 的内容胶囊
- `Issue`：由多个 Capsule 与若干 note 编排而成的正式发布单元
- `Flow`：纯文本碎碎念，默认不进首页 / RSS
- `Article`：长文专栏文章，可归属 Column，可进入首页 / RSS

## 推荐操作流程

### 阶段 A：写操作单

你只需要：

1. 在 `workbench/inbox/` 新建一个 `.md` 文件
2. 用自然语言写你的发布意图
3. 不需要自己打标签
4. 不需要自己生成摘要、时间、ID
5. 不需要自己手写复杂 prompt

这份 `.md` 文件既可以是：

- 新增 Capsule / Issue / Flow / Article
- 编辑已存在 Capsule / Issue / Flow / Article
- 删除已存在 Capsule / Issue / Flow / Article

### 阶段 B：触发短命令

你理想上只需要输入：

- `发布`

然后由本地 CMS 自动：

- 读取 inbox 中最新或选中的操作单
- 识别 action：create / update / delete
- 识别 kind：Capsule / Issue / Flow / Article
- 生成内置 prompt 并交给 Copilot

### 阶段 C：AI 结构化

Copilot 负责：

- 判断这次稿件更适合成为 `Capsule`、`Issue`、`Flow` 还是 `Article`
- 判断这次操作是新增、编辑还是删除
- 提取标题
- 生成摘要
- 按发布时间生成 `id`
- 生成 `slug`
- 识别链接、短评、图片、Canvas 与长文段落内容
- 输出 tags 候选清单

这里保留一个人工确认步骤：

- 由你确认 tags
- 如有必要，你可微调标题或摘要

### 阶段 D：本地预览

确认 tags 后，Copilot 会把结果写入 `public/data.json` 并启动本地预览。

推荐预览命令：

```bash
npm run dev
```

你确认页面效果、文案、图片和排序无误后，再执行正式发布。

### 预览阶段的最低验收要求

从本轮迭代开始，预览不再只表示“页面能打开”，而至少要检查：

- 编辑模式根页能正常渲染
- 本地 `/browse/` 路由能正常渲染
- 正式浏览页的构建产物能正常渲染
- Issue / Capsule / Flow / Article / Canvas / 图片 / 链接块在浏览态可正确显示
- 本地专用按钮不泄漏到线上正式浏览体验

推荐本地至少覆盖：

```bash
npm run cms
```

检查：

- `http://localhost:4318/`
- `http://localhost:4318/browse/`

再补一轮构建产物检查：

```bash
node scripts/generate-rss.mjs
npx vite build
npx vite preview
```

如果三者之一出现异常，都不应直接进入正式发布。

更系统的测试步骤与专项回归项见：`docs/testing-workflow.md`

### 阶段 E：正式发布

Copilot 执行：

1. 更新 `public/data.json`
2. 生成 `public/rss.xml`
3. 提交 Git 改动
4. 推送到 `main`
5. 将原始稿件移动到 `workbench/archive/`

## 双轨发布策略

### 只发布 Capsule

适用场景：

- 只是想沉淀一个可检索内容单元
- 暂时不希望它进入首页或 RSS

发布结果：

- 写入 `capsules`
- 生成 Capsule 独立访问页
- 更新搜索能力
- 不进入首页流和 RSS

### 发布 Issue

适用场景：

- 要正式发布一期 newsletter
- 需要编排多个 Capsule 并插入短评

发布结果：

- 写入 `issues`
- 若引用了新 Capsule，则一并写入 `capsules`
- 首页流可见
- RSS 可订阅

### 编辑 / 删除

适用场景：

- 修正文案
- 调整 Issue 中的 note / capsule 顺序
- 删除不再需要的 Capsule 或 Issue

发布结果：

- 对目标实体执行 update / delete
- 保持引用关系与搜索索引一致
- 若删除 Capsule，需检查是否仍被某些 Issue 引用

## 关于自动化程度

### 已经适合自动化的部分

- 目录扫描
- 操作单读取
- 操作意图识别
- 标题提取
- 摘要生成
- items 结构化
- tags 候选生成
- 本地预览
- Git 发布
- 归档草稿

### 保留人工确认的部分

- tags 最终确认
- 上线前页面预览
- 是否正式推送

这样做的好处是：

- 你写作时负担很低
- 你不需要记住复杂 prompt
- 发布前仍能保留 editorial control
- 最终线上结构始终保持一致

## Prompt CMS 原则

建议把本地 CMS 视为一个 **prompt 预处理器**：

- `inbox` 存的不是普通草稿，而是待执行操作单
- 用户只发出短命令，例如 `发布`
- 系统内部自动拼装标准 prompt
- Copilot 负责生成候选结果与执行结构化分析

详细规格见 `docs/prompt-cms.md`。

## 这轮迭代后的流程修订

### 编辑模式与浏览模式视为同一发布流的两个界面

现在的工作流不再是“编辑器负责输入，浏览页只是附带产物”，而是：

- 编辑模式负责生产内容意图
- 浏览模式负责验收最终阅读结果

因此任何影响内容模型、区块类型、卡片样式、图片和链接渲染的改动，都应同时检查两侧。

### 不接受只靠 build 通过就视为完成

本轮出现了“用户感知页面异常，但构建仍通过”的信号。

以后默认要求：

- 先过静态检查
- 再过构建
- 最后做真实页面预览

### 预览中优先检查高风险点

高风险点包括：

- Capsule 列表是否误渲染全文
- Slash 命令是否还能触发图片/链接插入
- 内嵌 Capsule 是否使用安全交互结构
- GitHub Pages / 本地 CMS / 本地 preview 三种路径前缀是否一致

## 评论维护建议

不建议尝试“每天 git pull 就把 Giscus 评论拉下来，然后通过 git 回帖”。原因是：

- Giscus 评论存储在 GitHub Discussions，不在 Git 仓库文件里
- `git pull` 只能拉取仓库代码，拉不到评论正文
- 即使做 API 导出，也只是同步一份快照，并不能用 Git 提交来回复评论

### 推荐方式

- 最轻量：直接在网页评论区回复
- 更统一：在 GitHub 仓库的 Discussions 页面回复
- 不推荐：自己写 GitHub API 工具做评论同步/回复

如果未来确实需要在 VS Code 里集中处理评论，建议做一个单独的评论助手脚本，直接调用 GitHub API，而不是走 Git 工作流。
