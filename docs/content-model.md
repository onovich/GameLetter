# GameLetter Content Model

本文档定义 GameLetter 当前稳定的内容实体、产品关系、可见性规则和 block schema。实现时以 `public/data.json`、`shared/content-blocks.js`、`scripts/prompt-cms-server.mjs` 和浏览端组件为准。

## 产品心智

| 概念 | 职责 | 默认分发价值 |
| --- | --- | --- |
| `Capsule` | 最小可复用内容胶囊，可包含文字、图片、链接或内置 Canvas | 可直链、可搜索，不进首页/RSS |
| `Canvas` | 独立的可交互 HTML 资产，可被 Capsule 引用 | 作为素材库，不单独承担订阅价值 |
| `Issue` | 一期 newsletter/digest，由编辑文字和 Capsule 引用组成 | 进首页/RSS |
| `Flow` | 纯文本碎碎念或公开笔记 | 可直链、可搜索，不进首页/RSS |
| `Article` | 长文专栏文章，有完整论述和结构化正文 | 进首页/RSS |
| `Column` | Article 的栏目归属 | 不单独发布，提供组织关系 |

核心区别：`Issue` 是策展，`Article` 是展开，`Flow` 是低压力笔记，`Capsule` 是可复用论据或素材。

## 顶层结构

```json
{
  "site": {},
  "features": {},
  "canvases": [],
  "capsules": [],
  "issues": [],
  "columns": [],
  "articles": [],
  "flows": []
}
```

`features.rssSources` 和 `features.homepageShows` 当前应包含 `issues` 与 `articles`。`capsules`、`flows`、`canvases` 默认只进入直链和搜索。

## 可见性

每个实体可用 `visibility` 覆盖默认值。

```json
{
  "direct": true,
  "search": true,
  "homepage": false,
  "feed": false,
  "rss": false
}
```

默认规则：

| Kind | direct | search | homepage/feed/rss |
| --- | --- | --- | --- |
| `capsule` | true | true | false |
| `canvas` | true | true | false |
| `flow` | true | true | false |
| `issue` | true | true | true |
| `article` | true | true | true |

## Block Schema

共享 block 解析在 `shared/content-blocks.js`。浏览端和 CMS 都应复用它，避免编辑模式和浏览模式对同一内容产生不同解释。

### Capsule blocks

Capsule 支持：

```json
{ "type": "text", "text": "一段观点" }
{ "type": "image", "url": "https://example.com/image.jpg", "caption": "图片说明" }
{ "type": "link", "url": "https://example.com", "text": "链接标题" }
{ "type": "canvas", "canvasId": "canvas-orbit-field", "entry": "/canvases/orbit-field/index.html", "aspectRatio": "16 / 9", "allowFullscreen": true }
```

Canvas 可以直接写 `entry`，也可以只写 `canvasId` 并由 `canvases` registry 补全入口。

### Issue blocks

Issue 支持：

```json
{ "type": "note", "content": "编辑短评" }
{ "type": "capsule-ref", "capsuleId": "capsule-20260422-01" }
{ "type": "link", "url": "https://example.com", "text": "补充链接" }
{ "type": "image", "url": "/images/example.jpg", "caption": "补充图片" }
```

Issue 中的 Capsule 引用应渲染为缩略胶囊卡：优先展示第一张图和部分文字，弱化嵌套压力。

### Article blocks

Article 支持：

```json
{ "type": "paragraph", "content": "长文段落" }
{ "type": "heading", "content": "小标题" }
{ "type": "quote", "content": "引文" }
{ "type": "capsule-ref", "capsuleId": "capsule-20260422-01" }
{ "type": "canvas-ref", "capsuleId": "capsule-20260609-canvas-01" }
{ "type": "link", "url": "https://example.com", "text": "补充链接" }
{ "type": "image", "url": "/images/example.jpg", "caption": "补充图片" }
{ "type": "canvas", "canvasId": "canvas-orbit-field", "entry": "/canvases/orbit-field/index.html" }
```

Article textarea 支持 Markdown 风格快捷写法：

```markdown
## 小标题

> 引文内容
```

发布端会将其转换为 `heading` 与 `quote` blocks。

## Entity Schema

### Canvas

```json
{
  "id": "canvas-orbit-field",
  "slug": "orbit-field",
  "kind": "canvas",
  "title": "Orbit Canvas Prototype",
  "summary": "内置可交互 HTML。",
  "tags": ["Canvas", "Prototype"],
  "entry": "/canvases/orbit-field/index.html",
  "aspectRatio": "16 / 9",
  "allowFullscreen": true
}
```

Canvas 文件放在 `public/canvases/<slug>/index.html`。渲染时不再额外包标题卡，`全屏打开`按钮位于可交互区域右上角并在 hover/focus 时出现。

### Capsule

```json
{
  "id": "capsule-20260609-canvas-01",
  "slug": "orbit-canvas-prototype",
  "kind": "capsule",
  "title": "Orbit Canvas Prototype",
  "summary": "一个内置 HTML Canvas 小实验。",
  "tags": ["Canvas", "Prototype"],
  "publishedAt": "2026-06-09T20:20:00+08:00",
  "visibility": { "direct": true, "search": true, "homepage": false, "feed": false, "rss": false },
  "blocks": [
    { "type": "canvas", "canvasId": "canvas-orbit-field" },
    { "type": "text", "text": "这段内容解释它为什么值得引用。" }
  ]
}
```

### Issue

```json
{
  "id": "issue-20260422",
  "slug": "game-ui-ai-indie-tooling",
  "kind": "issue",
  "title": "Game UI、AI 玩法与独立开发工具链",
  "summary": "一期策展内容。",
  "tags": ["Game Design", "AI"],
  "publishedAt": "2026-04-22T11:00:00+08:00",
  "visibility": { "direct": true, "search": true, "homepage": true, "feed": true, "rss": true },
  "blocks": [
    { "type": "note", "content": "开场短评。" },
    { "type": "capsule-ref", "capsuleId": "capsule-20260422-01" }
  ]
}
```

### Flow

```json
{
  "id": "flow-20260609-01",
  "slug": "thinking-about-content-models",
  "kind": "flow",
  "title": "关于内容模型的一点碎念",
  "summary": "Flow 是无订阅压力的纯文本流。",
  "body": "纯文本内容。",
  "tags": ["Flow", "Meta"],
  "publishedAt": "2026-06-09T20:25:00+08:00",
  "visibility": { "direct": true, "search": true, "homepage": false, "feed": false, "rss": false }
}
```

### Column

```json
{
  "id": "game-interface-notes",
  "slug": "game-interface-notes",
  "title": "游戏界面笔记",
  "description": "围绕 HUD、交互反馈和沉浸感的长文专栏。"
}
```

### Article

```json
{
  "id": "article-20260609-01",
  "slug": "why-game-ui-should-step-back",
  "kind": "article",
  "columnId": "game-interface-notes",
  "title": "为什么好的游戏 UI 应该退后一步",
  "summary": "一篇完整论述，而不是一期简报。",
  "tags": ["Article", "Game UI"],
  "publishedAt": "2026-06-09T20:30:00+08:00",
  "visibility": { "direct": true, "search": true, "homepage": true, "feed": true, "rss": true },
  "blocks": [
    { "type": "paragraph", "content": "长文开场。" },
    { "type": "capsule-ref", "capsuleId": "capsule-20260422-01" },
    { "type": "heading", "content": "交互内容也可以成为论据" },
    { "type": "canvas-ref", "capsuleId": "capsule-20260609-canvas-01" },
    { "type": "quote", "content": "好的内容模型让每种内容拥有恰当的发布心智。" }
  ]
}
```

## CMS Draft Contract

`workbench/inbox/*.md` 使用 frontmatter 表达发布意图：

```markdown
---
action: create
kind: article
target: auto
title: 为什么好的游戏 UI 应该退后一步
summary: 长文摘要
columnId: game-interface-notes
tags: Article, Game UI
---

开场段落。

## 小标题

> 引文内容

[引用 Capsule]
capsuleId: capsule-20260422-01
```

`action` 支持 `create`、`update`、`delete`、`publish`。正式落库前应先跑发布预览，确认 `beforeItem`、`afterItem` 与 collection delta。

## Validation

常规验证：

```bash
npm run validate:data
npm run build
npm run smoke:local
```

`npm run smoke:local` 会启动独立端口的 CMS，检查 `/browse/`、`/shared/content-blocks.js`、Canvas 静态入口，并用临时 Flow draft 覆盖发布预览、应用、撤销和清理。

## 架构约束

- `shared/content-blocks.js` 是 block 归一化的唯一共享源。
- `src/content/blocks.js` 只做浏览端 re-export，不再维护第二套解析规则。
- `studio/app.js` 只在编辑层补充本地 `id`、拖拽和 textarea 状态。
- `scripts/prompt-cms-server.mjs` 负责把 inbox draft 转成正式 schema，并生成可撤销发布记录。
- 新增 block 类型时，必须同步更新 shared parser、数据校验、CMS 发布端、浏览渲染和 `npm run smoke:local`。
