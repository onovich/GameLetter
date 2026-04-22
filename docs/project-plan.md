# 项目实施计划

## 目标

将当前原型演进为一个可长期维护的静态简报系统，满足以下核心要求：

- 内容通过 GitHub 维护
- 更新内容后可自动部署到 GitHub Pages
- 支持 RSS 订阅
- 支持评论，无需自建后端
- 前端视觉简洁、大方，并保留适度动效

## 阶段规划

### P0：工程化重构

- 建立 `src`、`public`、`scripts`、`.github/workflows` 目录
- 将内容数据抽离到 `public/data.json`
- 将单文件组件拆分为页面、子组件、hooks
- 增加 `.gitignore`、构建脚本、部署脚本

### P0：核心功能补全

- 异步加载 newsletter 数据
- 搜索与过滤
- Giscus 评论区接入
- RSS 文件生成

### P0：自动部署

- GitHub Actions 自动安装依赖
- 构建前生成 RSS
- 将构建结果发布到 GitHub Pages

### P1：体验增强

- 阅读进度条
- 图片灯箱
- 深色模式
- 移动端抽屉菜单
- Web Share 分享

### P1：扩展能力

- Markdown 内容支持
- 多媒体嵌入（视频 / 音频）
- OpenGraph / SEO 元信息
- 自定义域名

## 建议里程碑

### 里程碑 1：可维护版本

验收项：

- 内容已完全从代码中抽离
- 页面可根据 `data.json` 正常渲染
- 基础项目结构清晰

### 里程碑 2：可发布版本

验收项：

- 可生成 RSS
- GitHub Actions 构建成功
- GitHub Pages 能自动发布

### 里程碑 3：可运营版本

验收项：

- Giscus 评论可用
- SEO/OG 生效
- 移动端与桌面端体验完整
