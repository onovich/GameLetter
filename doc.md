# GameLetter 文档入口

当前项目已从单文件原型进入结构化重构阶段，本文件作为总入口使用。

## 你现在应该看什么

- 项目总览：README.md
- 项目计划：docs/project-plan.md
- 架构设计：docs/architecture.md
- 内容发布：docs/publishing-workflow.md
- GitHub Actions / Pages 配置：docs/github-setup.md

## 当前重构目标

1. 将简报数据从代码中抽离到 `public/data.json`
2. 将单文件 React 原型拆分为可维护的组件结构
3. 增加 RSS 生成脚本与 GitHub Actions 部署能力
4. 为 GitHub Pages 与 Giscus 留出正式接入位置

## 内容维护方式

未来日常更新时，优先通过 `workbench/inbox/` 写草稿，再由 Copilot 协助转换到 `public/data.json`。