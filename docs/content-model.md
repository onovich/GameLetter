# 内容模型设计：Capsule、Issue、Flow 与 Article

## 核心命名建议

为整个项目引入四层内容概念：

- `Capsule`：卡片型内容单元
- `Issue`：文章 / 简报 / 一期内容
- `Flow`：纯文本碎碎念
- `Article`：长文专栏文章

其中 `Column` 是 Article 的栏目容器，不直接替代 Article。

## 为什么叫 Capsule

`Capsule` 的语义是“封装好的内容胶囊”：

- 可以独立存在
- 可以被直接访问
- 可以被搜索命中
- 可以被组合进更大的内容容器里
- 不必默认出现在首页流或 RSS 中

它比 `card` 更适合做数据模型名，因为：

- `card` 更像 UI 组件名
- `Capsule` 更像内容实体名
- 将来 UI 从卡片样式变为列表、时间轴、画廊时，`Capsule` 仍然成立

## 为什么叫 Issue

`Issue` 很适合你的 newsletter / digest 语境：

- 一期简报
- 一篇组合式文章
- 由多个 Capsule 与若干短评片段构成

它能自然承接你当前项目已经存在的 newsletter 结构。

## 为什么叫 Flow

`Flow` 用来承载低压力的纯文本碎碎念：

- 可以被直链访问
- 可以被搜索命中
- 默认不进入首页主 feed
- 默认不进入 RSS
- 不承担 newsletter 的整理感

它是“公开笔记流”，不是正式发布单元。

## 为什么叫 Article

`Article` 用来承载长文专栏：

- 单篇文章有完整论述
- 可以归属一个 `Column`
- 可以进入首页与 RSS
- 可以引用 Capsule 或 Canvas Capsule 作为论据

它和 Issue 的区别在于：Issue 是一期策展，Article 是一篇展开。

## 关系模型

### Capsule

Capsule 是最小可复用内容单元。

它可以是：

- 一条链接推荐
- 一张图像与说明
- 一段独立观点
- 一个内置可交互 HTML Canvas
- 一个视频 / 播客 / 工具 / 游戏条目

### Issue

Issue 是编排层内容。

它通常由这些 block 组成：

- `capsule`：引用一个现成 Capsule
- `note`：插入一段短评
- 未来可扩展：`heading`、`quote`、`embed`、`divider`

因此，一个 newsletter 本质上就是：

- 若干 `Capsule`
- 穿插的 `note`
- 再加上标题、摘要、标签等元信息

## 可见性规则

你提出的特殊卡片概念，可以直接落在 `Capsule.visibility` 上。

### Capsule 默认规则

推荐默认值：

- 可通过直链访问：`direct = true`
- 可通过搜索访问：`search = true`
- 不出现在首页推荐：`homepage = false`
- 不进入 RSS：`rss = false`
- 不进入默认信息流：`feed = false`

这意味着 Capsule 更像“可检索的私藏内容单元”，而不是公开分发流的一部分。

### Issue 默认规则

推荐默认值：

- 首页展示：`homepage = true`
- 默认信息流展示：`feed = true`
- RSS 收录：`rss = true`
- 搜索可见：`search = true`
- 直链访问：`direct = true`

这意味着 Issue 是站点对外发布的主内容形态。

## 推荐数据结构

## Capsule Schema

```json
{
  "id": "capsule-20260422-01",
  "slug": "designing-better-game-huds",
  "kind": "capsule",
  "title": "Designing Better Game HUDs",
  "summary": "一篇关于如何让 HUD 更少打扰玩家、更服务沉浸感的长文。",
  "tags": ["Game Design", "UI"],
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
    "url": "https://example.com/game-hud",
    "image": "https://...",
    "commentary": "真正高级的游戏界面，不是信息更满，而是让玩家几乎忘记界面的存在。"
  }
}
```

`Capsule.payload.type` 当前建议支持：

- `link`
- `image`
- `thought`
- `canvas`

Canvas 文件建议放在 `public/canvases/<slug>/index.html`，前端以 iframe 渲染，并提供全屏打开入口。

## Issue Schema

```json
{
  "id": "issue-20260422",
  "slug": "game-ui-ai-indie-tooling",
  "kind": "issue",
  "title": "Game UI、AI 玩法与独立开发工具链",
  "summary": "聚焦游戏界面、AI 玩法与独立开发工作流的三则内容。",
  "tags": ["Game Design", "AI", "Indie Dev"],
  "publishedAt": "2026-04-22T10:30:00+08:00",
  "visibility": {
    "direct": true,
    "search": true,
    "homepage": true,
    "feed": true,
    "rss": true
  },
  "blocks": [
    {
      "type": "capsule-ref",
      "capsuleId": "capsule-20260422-01"
    },
    {
      "type": "note",
      "content": "这类 HUD 文章的价值不在技巧，而在提醒我们：界面首先要为沉浸服务。"
    },
    {
      "type": "capsule-ref",
      "capsuleId": "capsule-20260422-02"
    }
  ]
}
```

## Flow Schema

```json
{
  "id": "flow-20260609-01",
  "slug": "thinking-about-models",
  "kind": "flow",
  "title": "关于内容模型的一点碎碎念",
  "summary": "Flow 是无订阅压力的纯文本流。",
  "body": "纯文本内容……",
  "tags": ["Flow", "Meta"],
  "publishedAt": "2026-06-09T20:25:00+08:00",
  "visibility": {
    "direct": true,
    "search": true,
    "homepage": false,
    "feed": false,
    "rss": false
  }
}
```

## Article Schema

```json
{
  "id": "article-20260609-01",
  "slug": "why-game-ui-should-step-back",
  "kind": "article",
  "columnId": "game-interface-notes",
  "title": "为什么好的游戏 UI 应该退后一步",
  "summary": "长文摘要",
  "tags": ["Article", "Game UI"],
  "publishedAt": "2026-06-09T20:30:00+08:00",
  "visibility": {
    "direct": true,
    "search": true,
    "homepage": true,
    "feed": true,
    "rss": true
  },
  "blocks": [
    {
      "type": "paragraph",
      "content": "长文段落"
    },
    {
      "type": "canvas-ref",
      "capsuleId": "capsule-20260609-canvas-01"
    }
  ]
}
```

## 推荐前端表现

### Capsule 页面

Capsule 独立页应该更轻：

- 标题
- 主体内容卡
- 标签
- 相关来源
- 可选评论区
- 可选“被哪些 Issue 收录”反向关联

它像一个可收藏、可引用、可搜索的内容节点。

### Issue 页面

Issue 页面是编排后的阅读体验：

- 标题 / 摘要 / 标签 / 发布时间
- 依序渲染 `blocks`
- `capsule-ref` 展示为嵌入卡片
- `note` 展示为编辑短评

它像一个“策展后的阅读流”。

## 搜索建议

既然你希望“搜索时可以选卡片而非文章”，建议搜索模型从一开始就支持类型过滤。

### 搜索维度

- 全部
- `Issues`
- `Capsules`

### 搜索结果行为

- 命中 Issue：跳转到 Issue 页面
- 命中 Capsule：跳转到 Capsule 独立页
- Capsule 不进入首页 feed，但可以在搜索结果中正常展示

## 样式建议

### Capsule 样式

Capsule 建议比 Issue 中的普通卡片更“完成态”：

- 独立的标题区
- 明确的来源信息
- 较强的边框与阴影层次
- 更适合单体浏览

视觉关键词：

- 精致
- 收纳感
- 收藏夹感
- 知识胶囊感

### Issue 样式

Issue 应更偏“阅读编排”：

- 让多个 Capsule 之间有节奏
- note 要比 Capsule 更轻、更像旁白
- 避免每个 block 都同样抢眼

建议：

- `capsule-ref`：完整卡片样式
- `note`：细字、侧边线、浅底色或引言式样式
- 在 Capsule 之间留出明显节奏空白

## 配置建议

推荐把站点配置扩展为：

```json
{
  "site": {
    "title": "GameLetter",
    "description": "每日游戏、设计与前端灵感简报。"
  },
  "features": {
    "rssForIssuesOnly": false,
    "homepageShowsIssuesOnly": false,
    "rssSources": ["issues", "articles"],
    "homepageShows": ["issues", "articles"],
    "searchScopes": ["all", "issues", "capsules", "flows", "articles"]
  }
}
```

## 发布建议

### 发布 Capsule

适用于：

- 想先沉淀一个可引用内容单元
- 还不想把它推到首页或 RSS
- 希望它能被直链访问和搜索命中

发布动作：

- 写入 `capsules`
- 生成直链页
- 更新搜索索引
- 不进入首页 / RSS

### 发布 Issue

适用于：

- 正式对外发布一期 newsletter / digest
- 把多个 Capsule 编排成一篇完整内容

发布动作：

- 写入 `issues`
- 如 blocks 引用了新 Capsule，则一并写入 `capsules`
- 更新首页 feed
- 更新 RSS
- 更新搜索索引

## 架构建议

推荐把内容源拆成两个集合：

```json
{
  "site": {},
  "capsules": [],
  "issues": []
}
```

前端架构建议：

- 路由层：`/issues/:slug`、`/capsules/:slug`
- 列表层：首页仅消费 `issues`
- 搜索层：同时索引 `issues` 和 `capsules`
- RSS 层：仅消费 `issues`
- 引用层：Issue 通过 `capsuleId` 引用 Capsule

## 工作流建议

未来工作台也建议分成两类发布命令：

### 发布 Capsule

- 从草稿中抽取单个内容单元
- 生成 tags 候选
- 本地预览 Capsule 页
- 发布但不进首页 / RSS

### 发布 Issue

- 从草稿中抽取多个 Capsule 与若干 note
- 让你确认 tags
- 本地预览 Issue 页
- 正式发布到首页与 RSS
- 自动归档原始草稿

## 结论

推荐你把这两个概念正式定为：

- `Capsule`：可检索、可直链、默认不进 feed / RSS 的内容胶囊
- `Issue`：由多个 Capsule 与 note 编排成的正式发布单元

这是一个很稳的中长期模型：

- 命名清晰
- 内容复用强
- 发布层级明确
- 非常适合 newsletter 与知识策展的混合站点
