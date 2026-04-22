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

`public/data.json` 建议采用以下结构：

```json
{
  "site": {
    "title": "GameLetter",
    "description": "每日游戏与设计简报",
    "repoUrl": "https://github.com/onovich/GameLetter",
    "rssPath": "/rss.xml"
  },
  "issues": [
    {
      "id": "2026-04-22",
      "title": "标题",
      "date": "2026年4月22日",
      "summary": "摘要",
      "tags": ["TagA", "TagB"],
      "items": [
        {
          "type": "link",
          "title": "文章标题",
          "description": "简介",
          "url": "https://example.com",
          "image": "https://..."
        }
      ]
    }
  ]
}
```

## 分层原则

- 数据层：只维护 `public/data.json`
- 展示层：由 `src/components` 负责渲染
- 页面层：`src/App.jsx` 负责状态编排、筛选与布局
- 构建层：`scripts/generate-rss.mjs` 负责从数据生成 RSS
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
