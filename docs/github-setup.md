# GitHub Actions 与 GitHub Pages 配置说明

## 1. 启用 GitHub Pages

进入仓库设置：

- `Settings`
- `Pages`
- `Build and deployment`
- `Source` 选择 `GitHub Actions`

这样 Pages 会直接使用仓库中的 workflow 产物进行发布。

## 2. 配置 Actions 权限

进入：

- `Settings`
- `Actions`
- `General`

确认：

- 允许 Actions 运行
- `Workflow permissions` 选择 `Read and write permissions`

## 3. 配置 Giscus

进入仓库后：

1. 在 `Settings -> General` 启用 `Discussions`
2. 访问 `https://giscus.app/zh-CN`
3. 确认仓库满足公开仓库、已开启 Discussions、当前登录账号对仓库有管理权限
4. 在 Giscus 页面中选择：
   - Repository：`onovich/GameLetter`
   - Page ↔ Discussions Mapping：推荐保持当前项目使用的 `Specific term`
   - Discussion Category：建议新建或选择一个固定分类，例如 `Announcements`
5. 复制配置中的以下值，写入仓库的 GitHub Actions Secrets 或本地 `.env.local`：
   - `VITE_GISCUS_REPO`
   - `VITE_GISCUS_REPO_ID`
   - `VITE_GISCUS_CATEGORY`
   - `VITE_GISCUS_CATEGORY_ID`

这些字段的含义：

- `VITE_GISCUS_REPO`：评论要写入的仓库，例如 `onovich/GameLetter`
- `VITE_GISCUS_REPO_ID`：该仓库在 GitHub 内部的稳定 ID
- `VITE_GISCUS_CATEGORY`：评论落到哪个 Discussions 分类
- `VITE_GISCUS_CATEGORY_ID`：该分类在 GitHub 内部的稳定 ID

当前前端使用的映射方式是：

- `data-mapping="specific"`
- `data-term=issue.id`

这表示：每一期 newsletter 会用自己的 `issue.id` 绑定到一个独立 discussion 主题。

## 4. 配置 Secrets（可选）

如果你希望通过 GitHub Actions 注入环境变量，可在：

- `Settings`
- `Secrets and variables`
- `Actions`

添加对应 `VITE_GISCUS_*` 变量。

## 5. 本地配置方式（推荐先验证）

在仓库根目录创建 `.env.local`：

```bash
cp .env.example .env.local
```

然后填入 Giscus 页面生成的真实值，再运行：

```bash
npm run dev
```

如果页面不再显示“Giscus 尚未配置”，而是出现真实评论区，就说明配置正确。

## 6. CMS 评论管理

Giscus 的评论数据实际存储在 GitHub Discussions 中。浏览页只需要 `VITE_GISCUS_*`，但 CMS 要集中查看和删除评论时，需要一个只在本地 CMS 服务端使用的 GitHub token。

推荐创建一个 fine-grained personal access token：

- Repository access：只选择 `onovich/GameLetter`
- Repository permissions：`Discussions` 设为 `Read and write`
- Metadata：保持默认只读

然后在本地启动 CMS 前设置：

```bash
GITHUB_DISCUSSIONS_TOKEN=你的 token
```

也可以写入本地 `.env.local`，或用系统环境变量。这个 token 不应提交到 Git，也不需要暴露给前端页面。

配置完成后重新启动 CMS，进入 `Comments` tab，即可集中查看所有 Giscus discussion comments，并删除不需要的评论。

## 7. 我能否直接替你配置？

我可以：

- 帮你把代码里的接入位准备好
- 帮你检查 `.env.local`、Secrets 名称和 workflow 是否一致
- 在你填好配置后帮你验证本地或线上结果

我不能直接替你完成的部分：

- 在 GitHub 网页里启用 Discussions
- 在 Giscus 页面替你点击生成配置
- 在 GitHub 仓库后台替你写入 Secrets
- 替你创建或查看 GitHub token 明文

这些步骤需要你已登录 GitHub 并在网页中操作。

## 8. 首次部署检查项

- 默认分支为 `main`
- workflow 位于 `.github/workflows/deploy.yml`
- `package.json` 中 `build` 脚本可正常执行
- 若仓库名不是根域部署，需在 `vite.config.js` 中配置 `base`
