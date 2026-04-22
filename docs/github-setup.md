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
3. 选择当前仓库与 discussion 分类
4. 复制配置中的以下值，写入仓库的 GitHub Actions Secrets 或本地 `.env`：
   - `VITE_GISCUS_REPO`
   - `VITE_GISCUS_REPO_ID`
   - `VITE_GISCUS_CATEGORY`
   - `VITE_GISCUS_CATEGORY_ID`

## 4. 配置 Secrets（可选）

如果你希望通过 GitHub Actions 注入环境变量，可在：

- `Settings`
- `Secrets and variables`
- `Actions`

添加对应 `VITE_GISCUS_*` 变量。

## 5. 首次部署检查项

- 默认分支为 `main`
- workflow 位于 `.github/workflows/deploy.yml`
- `package.json` 中 `build` 脚本可正常执行
- 若仓库名不是根域部署，需在 `vite.config.js` 中配置 `base`
