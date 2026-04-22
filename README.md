# GameLetter

GameLetter 是一个基于 GitHub 维护的静态 newsletter / daily brief 项目：

- 内容数据与前端展示分离
- 支持 RSS 订阅
- 支持基于 GitHub Discussions 的评论
- 使用 GitHub Actions 自动构建并部署到 GitHub Pages

## 当前状态

当前仓库已经从单文件原型重构为更清晰的前端项目骨架，后续只需要围绕 `public/data.json` 维护内容即可。

## 文档导航

- 项目概览与入口说明：`doc.md`
- 实施计划：`docs/project-plan.md`
- 架构与数据模型：`docs/architecture.md`
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
