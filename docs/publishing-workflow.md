# 内容发布工作流

## 目标

把日常发布流程统一成“在工作台写自然语言稿件，再由 Copilot 协助结构化与发布”的模式。

## 推荐目录

- `workbench/inbox/`：你当天正在写的稿件
- `workbench/archive/`：已经发布的原始稿件归档
- `public/data.json`：正式线上内容源

## 推荐操作流程

### 阶段 A：写稿

你只需要：

1. 在 `workbench/inbox/` 新建一个 `.md` 文件
2. 用自然语言写内容
3. 不需要自己打标签
4. 不需要自己生成摘要、时间、ID

### 阶段 B：AI 结构化

Copilot 负责：

- 提取标题
- 生成摘要
- 按发布时间生成 `id`
- 识别链接、短评、图片内容
- 输出 tags 候选清单

这里保留一个人工确认步骤：

- 由你确认 tags
- 如有必要，你可微调标题或摘要

### 阶段 C：本地预览

确认 tags 后，Copilot 会把结果写入 `public/data.json` 并启动本地预览。

推荐预览命令：

```bash
npm run dev
```

你确认页面效果、文案、图片和排序无误后，再执行正式发布。

### 阶段 D：正式发布

Copilot 执行：

1. 更新 `public/data.json`
2. 生成 `public/rss.xml`
3. 提交 Git 改动
4. 推送到 `main`
5. 将原始稿件移动到 `workbench/archive/`

## 关于自动化程度

### 已经适合自动化的部分

- 目录扫描
- 草稿读取
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
- 发布前仍能保留 editorial control
- 最终线上结构始终保持一致

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
