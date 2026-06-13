# GameLetter

GameLetter 是一个基于 GitHub 维护的静态 newsletter / daily brief 项目：

- 内容数据与前端展示分离
- 支持 RSS 订阅
- 支持基于 GitHub Discussions 的评论
- 使用 GitHub Actions 自动构建并部署到 GitHub Pages

## 当前状态

当前仓库已经从单文件原型重构为更清晰的前端项目骨架，内容围绕 `public/data.json` 维护。

当前核心内容模型包括：

- `Capsule`：最小内容胶囊，支持链接、图片和观点
- `Issue`：正式 newsletter / digest，一期编排内容
- `Flow`：纯文本碎碎念，默认不进 RSS
- `Article`：长文专栏文章，可归属 `Column`，可引用 Toy
- `Toy`：独立可交互 HTML，可作为 Article 的交互论据

## 内容工作台

仓库已提供工作台目录，供你用自然语言写稿：

- `workbench/inbox/`：待处理草稿
- `workbench/archive/`：已发布归档

推荐日常流程：

1. 在 `workbench/inbox/` 新建 `.md` 草稿
2. 让 Copilot 读取草稿并生成候选 `title`、`summary`、`tags`、`items`
3. 由你确认 tags
4. 生成本地预览并检查页面效果
5. 正式发布到远端并归档草稿

## 文档导航

- 项目概览与入口说明：`doc.md`
- 实施计划：`docs/project-plan.md`
- 架构与数据模型：`docs/architecture.md`
- 重构会话计划：`docs/refactor-plan.md`
- 内容模型：`docs/content-model.md`
- 内容发布流程：`docs/publishing-workflow.md`
- Prompt CMS 设计：`docs/prompt-cms.md`
- 测试与验收流程：`docs/testing-workflow.md`
- 本轮编辑/浏览一体化纪要：`docs/session-2026-04-22-editor-browse-iteration.md`
- 长期平台路线图：`docs/platform-roadmap.md`
- GitHub Actions / Pages 配置说明：`docs/github-setup.md`

## 本地开发

```bash
npm install
npm run dev
```

## Prompt CMS v1

启动本地 Prompt CMS：

```bash
npm run cms
```

然后访问：`http://localhost:4318`

当前版本支持：

- inbox 操作单列表与编辑
- 生成发布 request
- 生成预览 request
- 发布前校验 action / kind / target / capsule 引用合法性
- 查看最近生成的 request 历史
- 归档草稿
- 选择现有 Issue / Capsule 作为目标对象
- 将现有 Capsule 一键插入到 Issue 操作单中
- 直接为现有 Issue / Capsule 生成删除草稿
- 编辑 Flow / Article / Toy，并在 Article 中引用已登记 Toy
- 自动输出内部 prompt 到 `workbench/pending/latest-prompt.txt`
- 自动输出最新 request 到 `workbench/pending/latest-request.json`
- 浏览端动态写入基础 SEO / OG / Twitter Card 元信息
- Article 支持基础 Markdown 块与受限行内 Markdown 渲染

本轮迭代后，建议把 Prompt CMS 看成“三件事的组合”：

- 编辑器：负责编辑 Capsule / Issue / Flow / Article / Toy
- 操作单生成器：负责把编辑意图落到 inbox
- prompt 预处理器：负责把待执行意图整理给 Copilot

同时，浏览模式不再只是一个单独页面，而是和编辑模式配套演进的一条只读体验链路。
涉及两者联动的改动，默认应同时验证：

- 编辑模式根页
- 本地 `/browse/` 路由
- 正式浏览页构建产物

当前版本还不会从网页里直接触发 Copilot，但已经把“发布”所需的内部 prompt 和 request 准备好了。

## 构建发布

```bash
npm run build
```

构建前会自动执行 RSS 生成脚本。RSS 当前收录 `Issue` 与开启 `rss` 可见性的 `Article`，不收录 `Flow`。

如果部署到自定义域名，将 `VITE_BASE_PATH=/`，并同步把 `public/data.json` 里的 `site.baseUrl` 改成该域名根地址；默认 GitHub Pages 项目页仍使用 `/GameLetter/`。

## Giscus 本地配置

如果你要在本地看到真实评论区：

1. 复制 `.env.example` 为 `.env.local`
2. 填入真实的 `VITE_GISCUS_*` 值
3. 重新运行 `npm run dev` 或 `npm run build`

详细说明见 `docs/github-setup.md`。
