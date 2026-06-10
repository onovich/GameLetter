# 架构说明

## 目录结构

```text
GameLetter/
├─ .github/workflows/       # 自动构建与部署
├─ docs/                    # 项目文档
├─ public/                  # 静态资源与内容数据
│  ├─ data.json             # 简报数据源
│  └─ rss.xml               # 构建生成
├─ scripts/                 # 构建辅助脚本
├─ studio/                  # Prompt CMS 本地编辑工作台
├─ src/
│  ├─ components/           # 浏览态复用组件、block 渲染与内容卡片
│  ├─ content/              # 内容模型、block 解析、hash 路由、搜索与标签统计
│  ├─ hooks/                # 数据加载等复用逻辑
│  ├─ screens/              # 页面级编排
│  ├─ view/                 # 动画等视图常量
│  ├─ App.jsx               # 浏览态数据入口
│  ├─ main.jsx              # 挂载入口
│  └─ browse.css            # 浏览态补充样式
├─ index.html
├─ package.json
└─ vite.config.js
```

## 数据模型

当前项目已演进为 `Capsule + Issue + Flow + Article` 四类内容模型，并用 `Column` 承载长文栏目归属。

`public/data.json` 建议采用以下结构：

```json
{
  "site": {
    "title": "GameLetter",
    "description": "每日游戏与设计简报",
    "repoUrl": "https://github.com/onovich/GameLetter",
    "rssPath": "/rss.xml",
    "baseUrl": "https://onovich.github.io/GameLetter/"
  },
  "features": {
    "rssForIssuesOnly": false,
    "homepageShowsIssuesOnly": false,
    "rssSources": ["issues", "articles"],
    "homepageShows": ["issues", "articles"],
    "searchScopes": ["all", "issues", "capsules", "flows", "articles"]
  },
  "capsules": [
    {
      "id": "capsule-20260422-01",
      "slug": "designing-better-game-huds",
      "title": "标题",
      "summary": "摘要",
      "tags": ["TagA", "TagB"],
      "publishedAt": "2026-04-22T10:30:00+08:00",
      "visibility": {
        "direct": true,
        "search": true,
        "homepage": false,
        "feed": false,
        "rss": false
      },
      "payload": {
        "type": "toy",
        "entry": "/toys/demo/index.html",
        "aspectRatio": "16 / 9",
        "allowFullscreen": true
      }
    }
  ],
  "issues": [
    {
      "id": "issue-2026-04-22",
      "slug": "issue-slug",
      "title": "标题",
      "summary": "摘要",
      "tags": ["TagA", "TagB"],
      "publishedAt": "2026-04-22T11:00:00+08:00",
      "blocks": [
        {
          "type": "capsule-ref",
          "capsuleId": "capsule-20260422-01"
        }
      ]
    }
  ],
  "flows": [
    {
      "id": "flow-20260609-01",
      "slug": "plain-text-note",
      "kind": "flow",
      "title": "碎碎念",
      "body": "纯文本内容",
      "visibility": {
        "direct": true,
        "search": true,
        "homepage": false,
        "feed": false,
        "rss": false
      }
    }
  ],
  "columns": [
    {
      "id": "game-interface-notes",
      "slug": "game-interface-notes",
      "title": "游戏界面笔记"
    }
  ],
  "articles": [
    {
      "id": "article-20260609-01",
      "slug": "article-slug",
      "kind": "article",
      "columnId": "game-interface-notes",
      "title": "长文标题",
      "summary": "长文摘要",
      "blocks": [
        {
          "type": "paragraph",
          "content": "长文段落"
        },
        {
          "type": "toy-ref",
          "capsuleId": "capsule-20260422-01"
        }
      ]
    }
  ]
}
```

## 分层原则

- 数据层：维护 `capsules`、`issues`、`flows`、`articles` 与 `columns` 集合
- 内容逻辑层：`src/content/` 负责 block 解析、hash 路由、搜索文本与 tag 统计等纯逻辑
- 展示层：`src/components/` 负责浏览态 block 渲染、内容卡片、Lightbox 与评论嵌入
- 页面层：`src/screens/BrowseScreen.jsx` 负责浏览态三栏结构、hash 路由状态、搜索、标签过滤与只读内容编排
- 入口层：`src/App.jsx` 只加载 newsletter 数据并挂载浏览屏幕
- 编辑层：`studio/app.js` 负责编辑态三栏结构、block 编辑、slash 插入、待处理状态与本地样式系统
- 样式层：`studio/app.css` 提供编辑态与浏览态共享视觉基线，`src/browse.css` 只补充浏览态专属样式
- 构建层：`scripts/validate-data.mjs` 校验内容结构，`scripts/generate-rss.mjs` 从 `issues` 与开启 RSS 的 `articles` 生成 RSS
- 部署层：`.github/workflows/deploy.yml` 负责发布 Pages

## 双界面架构

当前项目实际上包含两个紧密关联的前端界面：

### 1. 编辑模式

- 目录：`studio/`
- 目标：本地 Prompt CMS 工作台
- 特征：可编辑、可生成操作单、可做样式调试

### 2. 浏览模式

- 目录：`src/`
- 目标：正式阅读体验
- 特征：只读、三栏结构、与编辑模式共享视觉语言

这两个界面不应再被看作完全独立的产品，而应被看作：

- 一个负责生产内容
- 一个负责验收和消费内容

## 当前内容块约束

为保证编辑态与浏览态一致，当前内容应优先围绕 block 模型设计：

- `text`
- `image`
- `link`
- `toy`
- `note`
- `capsule-ref`
- `toy-ref`

其中：

- `Capsule` 侧主要消费 `text / image / link`
- `Issue` 侧主要消费 `note / capsule-ref / link / image`
- `Article` 侧主要消费 `paragraph / heading / quote / capsule-ref / toy-ref`
- `Flow` 侧保持纯文本，不进入 block 编排

## 运行时安全约束

本轮迭代后，补充以下架构约束：

- 路由初始化应尽量避免对 `window` 的不安全假设
- GitHub Pages 与本地 `/browse/` 路径前缀应统一处理
- 不应出现“按钮里再嵌按钮或链接”这类高风险交互结构
- 不应只依赖 build 结果判断页面可用性

## 评论方案

评论使用 Giscus：

- 数据存储在 GitHub Discussions
- 用户使用 GitHub 账号评论
- 无需自建服务端
- 配置通过 `VITE_GISCUS_*` 环境变量注入

## 后续演进建议

- Schema 已补充 `schemas/content.schema.json` 与更严格的 `scripts/validate-data.mjs`；后续若引入 TypeScript 编译链，再把同一份模型生成或同步为 TS 类型。
- `markdown` 已作为 Article / Flow / Capsule 文本的受限渲染能力接入，不再作为独立内容实体。
- SEO 已支持站点级兜底与实体级 `seo` 覆盖；后续可以在需要时增加更细的社交图、canonical 策略或静态预渲染。
- `video` / `audio` 暂不考虑。
