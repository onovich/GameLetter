# GameLetter 重构计划

本文档约定 GameLetter 接下来几轮会话的重构节奏。目标是把当前已经可用的系统整理成更可维护的结构，而不是重新发明一套新产品。

## 总体约定

预计用 6 轮实施会话完成主要重构。本轮为架构与计划会话，不计入 6 轮实施。

实施状态：6 轮已按计划推进完成，后续文档保留为架构回归和新增功能时的边界参考。

每轮会话必须遵守：

- 不改变既有内容模型，除非该轮明确包含模型调整。
- 不把公开浏览端改成依赖本地 CMS 服务。
- 不让任何私密 GitHub token 进入浏览端。
- 每轮结束前至少运行 `npm run validate:data`。
- 改到浏览端、CMS 或服务端主链路时，继续运行 `npm run build`。
- 改到发布、Toy、评论、CMS API 时，继续运行 `npm run smoke:local`。
- 每轮只做一个主要边界，避免一次性大拆。

每轮验收都以“行为不变、结构更清楚”为默认目标。视觉或产品功能调整只在用户明确要求时合并进该轮。

## 目标架构

重构完成后的核心分层：

```text
shared/
├─ content-blocks.js        # block 解析、标准化、序列化、预览
└─ content-rules.js         # 实体关系、默认 visibility、模式常量等可选纯逻辑

src/
├─ content/                 # 浏览端纯逻辑
├─ components/              # 浏览端展示组件
├─ screens/                 # 浏览端页面编排
└─ hooks/                   # 数据加载

studio/
├─ app.js                   # CMS bootstrap + 模块装配
├─ modules/
│  ├─ api-client.js
│  ├─ state.js
│  ├─ render-utils.js
│  ├─ navigation.js
│  ├─ comments.js
│  ├─ capsule-workspace.js
│  ├─ issue-workspace.js
│  ├─ plain-workspace.js
│  └─ toy-workspace.js

scripts/
├─ prompt-cms-server.mjs    # 兼容入口
└─ cms/
   ├─ server.mjs
   ├─ routes/
   ├─ services/
   └─ utils/
```

## 第 1 轮：CMS 基础设施与 Comments 模块

目标：先从最独立的新功能拆起，验证模块化方式不会破坏 CMS。

范围：

- 新增 `studio/modules/api-client.js`，封装 `requestJson`。
- 新增 `studio/modules/render-utils.js`，迁移 toast、dialog 基础工具中低耦合的部分。
- 新增 `studio/modules/comments.js`，迁移评论列表、过滤、删除、侧栏统计。
- `studio/app.js` 保留 Comments 的挂载与事件分发，不再直接承载评论业务细节。

不做：

- 不改评论 API 行为。
- 不改 Giscus 配置。
- 不改浏览端评论 iframe。

验收：

- CMS Comments tab 可加载无 token fallback。
- 有 token 时仍可读取与删除评论。
- `npm run validate:data`
- `npm run build`
- 如果本地 token 已配置，手测 Comments tab。

## 第 2 轮：CMS 状态、导航与筛选边界

目标：把左栏 tab、右栏 tag/search、mode 切换从业务 workspace 中拆出来。

范围：

- 新增 `studio/modules/state.js`，集中管理 `state` 的初始化和读写 helper。
- 新增 `studio/modules/navigation.js`，迁移 mode navigation、active tab、右栏筛选渲染。
- 统一 CMS 与浏览端的 mode 顺序：`Issue / Capsule / Flow / Article / Toy`。
- 保持 tag 筛选为且关系。

不做：

- 不重写 workspace。
- 不改视觉设计，只保持现有效果稳定。

验收：

- 左栏所有 tab 选中态正确。
- 搜索与多 tag 筛选行为正确。
- Capsule tab 显示全部 Capsule，详情跳转逻辑不受影响。
- `npm run validate:data`
- `npm run build`

## 第 3 轮：Capsule 与 Issue Workspace 拆分

目标：拆出最核心的两个编辑工作区，减少 `studio/app.js` 的最大复杂度来源。

范围：

- 新增 `studio/modules/capsule-workspace.js`。
- 新增 `studio/modules/issue-workspace.js`。
- 迁移 Capsule editor blocks、Issue editor blocks、保存、删除、卡片编辑、插入 Capsule 引用等逻辑。
- 保留 shared parser 作为解析入口，减少 CMS 内重复 parser。

不做：

- 不改变 Capsule / Issue 的数据结构。
- 不新增新的 block 类型。

验收：

- Capsule 新建、编辑、删除 draft 正常。
- Issue 新建、编辑、删除 draft 正常。
- Issue 中引用 Capsule 仍渲染为缩略胶囊。
- 浏览端 Issue 内点击 Capsule 仍进入 Capsule 详情。
- `npm run validate:data`
- `npm run build`
- `npm run smoke:local`

## 第 4 轮：Flow / Article / Toy Workspace 拆分

目标：把纯文本类和 Toy 管理从通用大函数中分离，稳定 Article 引用 Toy 的工作流。

范围：

- 新增 `studio/modules/plain-workspace.js`，承载 Flow / Article 的共用编辑骨架。
- 新增 `studio/modules/toy-workspace.js`，承载 Toy 列表、编辑、预览、poster、entry 管理。
- Article 的 Capsule / Toy 插入入口归到 Article workspace。
- 继续保持 Capsule 不引用 Toy，Issue 不引用 Toy。

不做：

- 不把 Article 升级成完整块编辑器。
- 不改变 Toy 静态目录规范。

验收：

- Flow 编辑器可用。
- Article 编辑器可插入 Capsule / Toy。
- Toy 编辑器可新建、编辑、预览。
- 浏览端 Toy 仍满足“同页只播放一个，默认只播放第一个”。
- `npm run validate:data`
- `npm run build`
- `npm run smoke:local`

## 第 5 轮：本地 CMS 服务拆分

目标：拆开 `scripts/prompt-cms-server.mjs`，让发布逻辑、文件逻辑、GitHub Discussions 逻辑互不纠缠。

范围：

- 新增 `scripts/cms/server.mjs`。
- 新增 `scripts/cms/utils/http.mjs`、`scripts/cms/utils/paths.mjs`。
- 新增 `scripts/cms/routes/inbox.mjs`、`publish.mjs`、`comments.mjs`、`static-files.mjs`。
- 新增 `scripts/cms/services/content-store.mjs`、`draft-parser.mjs`、`github-discussions.mjs`。
- `scripts/prompt-cms-server.mjs` 变成兼容入口，继续支持 `npm run cms`。

不做：

- 不改变 API path。
- 不改变 workbench 目录结构。
- 不改变发布操作单格式。

验收：

- `npm run cms` 仍启动同一套本地 CMS。
- `/api/inbox`、`/api/publish/preview`、`/api/publish/apply`、`/api/comments` 行为不变。
- `npm run validate:data`
- `npm run build`
- `npm run smoke:local`

## 第 6 轮：共享规则收敛、样式拆分与回归清单

目标：清理剩余重复逻辑和文档漂移，把重构收口到可长期维护状态。

范围：

- 将重复的 block 解析、tag 提取、默认 visibility、实体关系规则继续收敛到 `shared/`。
- 新增 `shared/content-rules.js`。
- 轻拆 `studio/app.css`，优先拆 comments、navigation、workspace/card 样式。
- 更新 `docs/testing-workflow.md`，加入本轮重构后的固定回归清单。
- 更新 `docs/publishing-workflow.md`，反映 CMS Comments 管理入口。

不做：

- 不引入 TypeScript。
- 不做移动端专项设计。
- 不做平台化多用户能力。

验收：

- `studio/app.js` 明显瘦身，主要承担装配职责。
- CMS 服务层有清晰 routes/services/utils。
- shared 规则成为新增实体和 block 的默认入口。
- 文档不再描述已废弃的旧交互实体或 Capsule Toy payload。
- `npm run validate:data`
- `npm run build`
- `npm run smoke:local`

## 完成标准

6 轮结束后，应达到：

- `studio/app.js` 不再是所有 CMS 逻辑的集中点。
- `scripts/prompt-cms-server.mjs` 不再是所有服务逻辑的集中点。
- 内容模型、schema、shared parser、validate、CMS 和浏览端职责清楚。
- 后续新增功能能按边界修改，而不是跨多个大文件搜索修改。
- 文档、测试和实际代码结构保持一致。

## 延后事项

这些事项不进入本次 6 轮重构：

- Article 完整块编辑器。
- 移动端专项布局。
- 多用户平台化 App。
- 跨仓库 Capsule 引用。
- TypeScript 全量迁移。
- 数据库或远程 CMS 服务。

这些都是产品演进，不是当前架构债务的必要前置。
