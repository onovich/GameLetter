# 长期路线图：GameLetter Platform

## 愿景

将当前的单仓库 newsletter 系统，逐步扩展为一个可供他人自建、发布、订阅与互相引用内容的产品化平台。

这个平台的核心目标是：

- 用户可以绑定自己的 GitHub 仓库
- 用户可以复用与 GameLetter 相同的发布流
- 用户可以在 App 内发布 `Issue` 与 `Capsule`
- 用户可以把自己的 newsletter 地址分享给别人
- 别人可以在 App 内订阅该 newsletter
- 用户之间可以互相关注 / 加好友
- 在对方仓库为 public 的前提下，可以引用对方公开的 `Capsule`

## 产品形态

### App 三栏结构

App 首页长期目标分为三栏：

- `推荐`
- `关注`
- `我的`

### 推荐

展示官方内容流：

- 官方（你）的 newsletter
- 官方精选 Capsule / Issue
- 平台推荐内容

### 关注

展示社交订阅流：

- 好友的 newsletter
- 已关注创作者的最新 Issue
- 来自好友公开仓库的可引用 Capsule

### 我的

展示个人工作区：

- 自己的 newsletter
- 自己的 Capsule 草稿与已发布内容
- 仓库配置、发布状态、订阅统计

## 核心能力拆解

### 1. 仓库接入

用户需要能在 App 中完成：

- 登录 GitHub
- 选择或绑定自己的仓库
- 自动初始化 newsletter 所需目录结构
- 自动创建或校验 GitHub Pages / Actions / Discussions 配置

### 2. 发布能力

App 应支持两类内容发布：

- 发布 `Capsule`
- 发布 `Issue`

并尽量复用当前工作流：

- 自然语言写作
- AI 提取标题 / 摘要 / tags / blocks
- 人工确认 tags
- 预览
- 正式发布
- 自动归档

### 3. 订阅能力

用户可以：

- 订阅某个创作者的 newsletter
- 查看对方最近发布的 Issue
- 在 App 内管理自己的订阅列表

### 4. 关系链能力

用户之间可以：

- 关注 / 互加好友
- 浏览对方公开的 Capsule
- 在自己的 Issue 中引用对方的 Capsule

### 5. 跨仓库引用能力

这是长期最关键的差异化能力之一。

规则建议：

- 仅允许引用 public 仓库中的 public Capsule
- 被引用 Capsule 必须带稳定 `id` / `slug`
- 引用时记录来源仓库、作者、原始 URL
- 渲染时明确标注“引用自谁”

## 为什么它值得作为长期目标

这个方向可以把当前项目从“个人 newsletter 站点”升级为：

- 内容产品
- 创作者工具
- 社交订阅网络
- 跨仓库内容编排系统

也就是说，未来不只是你自己在发 newsletter，而是别人也可以基于同样的模型来生产、订阅、引用与传播。

## 对当前项目的架构约束

为了不与这个长期方向冲突，后续中间 feature 应遵守以下原则。

### 原则 1：内容模型优先稳定

`Capsule` 与 `Issue` 必须保持为稳定的核心实体，不要把它们写死为仅服务当前站点页面的结构。

要求：

- `id`、`slug`、`visibility`、`publishedAt` 长期保留
- `Capsule` 可独立访问
- `Issue` 只通过 `blocks` 组合 Capsule，而不是把 Capsule 内容直接内联复制

### 原则 2：UI 与内容实体解耦

不要把 `Capsule` 当成“某个卡片组件的名字”。

要求：

- `Capsule` 是内容实体
- 卡片只是当前默认表现形态
- 后续即使改为列表、画廊、时间线，也不改内容实体命名

### 原则 3：本地仓库是内容源，不是唯一运行时

当前项目依赖 Git 仓库发布，但未来 App 可能成为编排层。

要求：

- 数据格式尽量 JSON-schema 化
- 发布脚本尽量可被 CLI / Web App / Server 复用
- 不把关键逻辑写死在某个页面组件里

### 原则 4：搜索与流推荐分离

推荐流、订阅流、搜索索引应从一开始就视为不同层。

要求：

- `homepage`、`feed`、`rss`、`search` 分开控制
- `Capsule` 可搜索但默认不进入推荐流
- 后续可扩展为推荐算法、好友流、官方流

### 原则 5：引用能力优先用引用而不是复制

未来跨人引用 Capsule 时，必须优先保存“引用关系”，而不是复制对方内容。

要求：

- Issue block 使用 `capsule-ref`
- 后续为跨仓库引用预留 `source.repo`、`source.owner`、`source.url`
- 保持来源可追踪

### 原则 6：身份体系最终会出现

现在评论与发布靠 GitHub 即可，但长期平台一定会引入账号与关系链。

要求：

- 当前功能尽量围绕 GitHub identity 设计
- 不在数据层过早假设“只有一个站点作者”
- 文案、配置、schema 都尽量避免写死单用户前提

## 推荐里程碑

### L1：单站稳定版

目标：

- 当前仓库继续稳定运行
- 完善 Capsule / Issue 发布流
- 保持 GitHub Pages + Actions + Discussions 闭环

### L2：多站点模板版

目标：

- 抽离为可复用 starter / template
- 允许别人在自己的仓库中自建同款 newsletter
- 标准化初始化脚本与 schema

### L3：托管式 App 版

目标：

- 用户在 App 中绑定仓库
- 通过 App 创建与发布 Issue / Capsule
- App 聚合多个仓库的公开内容

### L4：社交订阅网络版

目标：

- 推荐 / 关注 / 我的 三栏成型
- 好友关系与订阅体系上线
- 跨仓库 Capsule 引用可用

## 当前应记录为 TODO 的方向

- 开发一个 App，让用户配置自己的 GitHub 仓库并自建同款 newsletter 发布流
- App 内支持创建、预览、发布 `Issue` 与 `Capsule`
- App 内支持订阅他人的 newsletter
- App 内支持关注 / 加好友
- App 内支持引用好友公开仓库中的 Capsule
- 首页采用 `推荐 / 关注 / 我的` 三栏结构
- 后续所有 feature 设计都需检查是否与该长期目标冲突

## 结论

这个方向已经不是单一 feature，而是当前项目的长期产品路线。

建议从现在开始把它视为：

- 产品愿景
- 架构约束
- roadmap 北极星

后续新增功能时，都先问一个问题：

- 这个改动未来是否还能服务“多仓库、多作者、可订阅、可引用”的平台目标？

如果答案是否定的，就应当重新设计。
