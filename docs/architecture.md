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
├─ src/
│  ├─ components/           # 业务组件
│  ├─ hooks/                # 数据加载等复用逻辑
│  ├─ App.jsx               # 页面入口
│  ├─ main.jsx              # 挂载入口
│  └─ styles.css            # 全局样式
├─ index.html
├─ package.json
└─ vite.config.js
```

## 数据模型

当前项目已演进为 `Capsule + Issue` 双模型。

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
    "rssForIssuesOnly": true,
    "homepageShowsIssuesOnly": true,
    "searchScopes": ["all", "issues", "capsules"]
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
        "type": "link",
        "url": "https://example.com"
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
  ]
}
```

## 分层原则

- 数据层：维护 `capsules` 与 `issues` 两个集合
- 展示层：`src/components/CapsuleCard.jsx`、`src/components/IssueComposer.jsx` 等负责渲染
- 页面层：`src/App.jsx` 负责 hash 路由、搜索范围、内容编排与 Capsule 独立访问
- 构建层：`scripts/generate-rss.mjs` 仅从 `issues` 生成 RSS
- 部署层：`.github/workflows/deploy.yml` 负责发布 Pages

## 评论方案

评论使用 Giscus：

- 数据存储在 GitHub Discussions
- 用户使用 GitHub 账号评论
- 无需自建服务端
- 配置通过 `VITE_GISCUS_*` 环境变量注入

## 后续演进建议

- 引入 TypeScript 约束 schema
- 为 `items` 增加 `video` / `audio` / `markdown` 类型
- 将 SEO 元信息做成 issue 级配置
