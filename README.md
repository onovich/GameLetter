# GameLetter

GameLetter 是一个基于 GitHub 维护的静态 newsletter / daily brief 项目：

- 内容数据与前端展示分离
- 支持 RSS 订阅
- 支持基于 GitHub Discussions 的评论
- 使用 GitHub Actions 自动构建并部署到 GitHub Pages

## 当前状态

当前仓库已经从单文件原型重构为更清晰的前端项目骨架，后续只需要围绕 `public/data.json` 维护内容即可。

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
- 内容发布流程：`docs/publishing-workflow.md`
- GitHub Actions / Pages 配置说明：`docs/github-setup.md`

## 本地开发

```bash
npm install
npm run dev
```

## 构建发布

```bash
npm run build
```

构建前会自动执行 RSS 生成脚本。

## Giscus 本地配置

如果你要在本地看到真实评论区：

1. 复制 `.env.example` 为 `.env.local`
2. 填入真实的 `VITE_GISCUS_*` 值
3. 重新运行 `npm run dev` 或 `npm run build`

详细说明见 `docs/github-setup.md`。
