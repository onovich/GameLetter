# GameLetter Content Model

本文档描述当前稳定内容模型。实现以 `public/data.json`、`shared/content-blocks.js`、`scripts/prompt-cms-server.mjs`、浏览端组件和 CMS 编辑器为准。

## 实体心智

| 概念 | 职责 | 默认分发价值 |
| --- | --- | --- |
| `Capsule` | 最小可复用内容胶囊，只承载文字、图片、链接或观点 | 可直链、可搜索，不进首页/RSS |
| `Issue` | newsletter/digest，由编辑文字和 Capsule 引用组成 | 进首页/RSS |
| `Flow` | 纯文本碎碎念或公开笔记 | 可直链、可搜索，不进首页/RSS |
| `Article` | 长文专栏文章，有完整论述和结构化正文 | 进首页/RSS |
| `Toy` | 独立可交互 HTML，可作为 Article 的交互论据 | 可直链、可搜索，不进首页/RSS |
| `Column` | Article 的栏目归属 | 不单独发布 |

核心约束：

- Capsule 不允许引用 Toy。
- Issue 只引用 Capsule，不直接引用 Toy。
- Article 可以引用 Capsule，也可以引用 Toy。
- Toy 是独立模块，拥有自己的 tab、列表、详情路由和静态入口。

## 顶层结构

```json
{
  "site": {},
  "features": {},
  "capsules": [],
  "issues": [],
  "flows": [],
  "articles": [],
  "columns": [],
  "toys": []
}
```

`features.rssSources` 与 `features.homepageShows` 通常包含 `issues` 和 `articles`。`capsules`、`flows`、`toys` 默认只进入直链和搜索。

## Block Schema

### Capsule

Capsule 支持：

```json
{ "type": "text", "text": "一段观点" }
{ "type": "image", "url": "https://example.com/image.jpg", "caption": "图片说明" }
{ "type": "link", "url": "https://example.com", "text": "链接标题" }
```

### Issue

Issue 支持：

```json
{ "type": "note", "content": "编辑短评" }
{ "type": "capsule-ref", "capsuleId": "capsule-20260422-01" }
{ "type": "link", "url": "https://example.com", "text": "补充链接" }
{ "type": "image", "url": "/images/example.jpg", "caption": "补充图片" }
```

Issue 中的 Capsule 引用在浏览态渲染为缩略胶囊卡：优先展示第一张图和部分文字，点击后进入对应 Capsule 详情路由。

### Article

Article 支持：

```json
{ "type": "paragraph", "content": "长文段落" }
{ "type": "heading", "content": "小标题" }
{ "type": "quote", "content": "引文" }
{ "type": "capsule-ref", "capsuleId": "capsule-20260422-01" }
{ "type": "toy-ref", "toyId": "toy-orbit-field" }
{ "type": "link", "url": "https://example.com", "text": "补充链接" }
{ "type": "image", "url": "/images/example.jpg", "caption": "补充图片" }
{ "type": "list", "ordered": false, "items": ["要点一", "要点二"] }
{ "type": "code", "language": "js", "content": "console.log('demo')" }
```

Article textarea 支持 Markdown 风格快捷写法：

````markdown
## 小标题
> 引文内容

- 无序列表
- 第二项

```js
console.log('demo')
```

[引用 Capsule]
capsuleId: capsule-20260422-01

[引用 Toy]
toyId: toy-orbit-field
````

## Toy

```json
{
  "id": "toy-orbit-field",
  "slug": "orbit-field",
  "kind": "toy",
  "title": "Orbit Toy Prototype",
  "summary": "内置可交互 HTML。",
  "tags": ["Toy", "Prototype"],
  "entry": "/toys/orbit-field/index.html",
  "aspectRatio": "16 / 9",
  "allowFullscreen": true,
  "visibility": {
    "direct": true,
    "search": true,
    "homepage": false,
    "feed": false,
    "rss": false
  }
}
```

Toy 文件放在 `public/toys/<slug>/index.html`。渲染时不额外包标题卡，`全屏打开`按钮位于交互区域右上角，并在 hover/focus 时出现。

## Validation

常规验证：

```bash
npm run validate:data
npm run build
npm run smoke:local
```

`npm run smoke:local` 会启动独立端口的 CMS，检查 `/browse/`、`/shared/content-blocks.js`、Toy 静态入口，并用临时 Flow draft 覆盖发布预览、应用、撤销和清理。

新增 block 或实体类型时，必须同步更新 shared parser、数据校验、JSON Schema、CMS 发布端、浏览渲染和 smoke。
