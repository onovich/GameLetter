# 测试与验收工作流

## 目标

避免以下问题再次反复出现：

- 页面白屏，但构建仍通过
- Capsule 正文在编辑模式或浏览模式中消失
- slash 命令可见但点击后不触发图片/链接插入
- 浏览模式与编辑模式结构和样式越来越分裂

## 最低测试标准

每次涉及 `studio/`、`src/`、`public/data.json`、`scripts/prompt-cms-server.mjs` 的改动，至少通过以下检查。

### A. 静态检查

- 受影响文件无错误
- 若有大块重构，优先检查入口文件：
  - `studio/app.js`
  - `src/App.jsx`
  - `src/main.jsx`
  - `studio/app.css`
  - `src/browse.css`

### B. 构建检查

```bash
npm run validate:data
npm run build
```

要求：

- `public/data.json` 通过结构校验
- `public/rss.xml` 正常生成
- `dist/` 可成功构建

### C. 页面入口检查

至少验证以下三个入口：

1. 编辑模式：`http://localhost:4318/`
2. 本地浏览模式：`http://localhost:4318/browse/`
3. 正式浏览构建预览：`vite preview` 对应地址

目标不是只看“能打开”，而是要确认页面存在可读内容，而不是空 root / 纯白屏。

### D. 运行时一致性检查

在判断“页面还坏着”之前，先确认你和用户看到的是不是同一个服务实例：

- 用户实际访问的是哪个端口
- 当前监听该端口的是不是当前仓库启动的进程
- 页面返回的标题或关键文案，是否符合当前代码版本

如果这一步没做，后面的白屏结论很容易全部失真。

## 本项目的专项回归清单

### 1. 白屏防回归

检查：

- 浏览页出现运行时异常时，应至少有错误兜底，不允许整页纯白
- 路由初始化不能依赖不安全的 `window` 假设
- GitHub Pages 与本地路径前缀都能正确生成链接
- 不允许跳过“真实测试端口 / 真实服务进程”确认步骤

### 2. Capsule 正文回归

至少检查两类 Capsule：

- 纯文本 Capsule
- 图片 / 链接型 Capsule

要求：

- 编辑模式列表中能看到正文预览，而不是只剩时间和 tag
- 浏览模式列表中也能看到正文预览
- 展开态能看到完整正文或完整 block 内容

### 3. Slash 命令回归

在 Capsule 编辑器中至少手测：

- 输入 `/image`，选择后出现图片链接弹窗
- 输入 `/link`，选择后出现链接文字和链接地址弹窗

在 Issue 编辑器中至少手测：

- 输入 `/link`，选择后出现链接弹窗

### 4. 编辑 / 浏览样式一致性回归

至少对照检查：

- 卡片 layout
- 图片缩略尺寸
- `Editor's note` 样式
- 内嵌 Capsule 样式
- Tag、状态、底部工具行布局
- Header 与 Tabs 的视觉语言

### 5. Markdown / SEO 回归

至少检查：

- Article 正文中的 `##`、`>`、列表和代码块能被转换并渲染
- Flow / Capsule / Article 正文中的加粗、斜体、行内代码和安全链接不会破坏布局
- 页面切换到不同 Issue / Capsule / Flow / Article 后，`document.title`、`meta[name="description"]`、`og:title`、`og:description` 和 canonical 会同步更新
- `npm run validate:data` 能拦截错误的 SEO 字段、缺失的 Toy 入口、未知的 visibility 字段和无效 block

### 6. 六轮重构后的固定回归

每次改到内容模型、CMS 模块、浏览路由、Toy 或评论管理时，至少确认：

- 左栏 `Issue / Capsule / Flow / Article / Toy / Comments` 选中态正确，滑块和文字都可见。
- Capsule tab 展示全部 Capsule；从 Issue 内嵌 Capsule 点击时进入 Capsule 详情，而不是 Capsule 列表。
- 右栏 tag 多选是且关系，选得越多结果不会反向变多。
- Toy 列表和 Article 内默认只播放第一个 Toy；其他 Toy 显示 poster 蒙层，点击播放后会停止同页其他 Toy。
- Comments tab 在未配置 GitHub token 时有可读 fallback；配置后可列出评论并执行删除。
- `shared/content-rules.js` 中的 mode 顺序、collection 映射和默认 visibility 与 CMS、浏览端、校验脚本一致。

## 推荐执行顺序

1. 先修功能逻辑
2. 再跑静态检查
3. 再跑构建
4. 最后做三入口页面验收

不要跳过最后一步。

## 会话沉淀要求

如果本轮迭代形成了新的经验教训，不能只停留在聊天上下文里，至少应更新：

- `docs/publishing-workflow.md`
- `docs/prompt-cms.md`
- `docs/testing-workflow.md`

必要时新增专项纪要文档。
