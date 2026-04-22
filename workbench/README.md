# 发布工作台

这个目录是 GameLetter 的内容工作台。

## 目录约定

- `workbench/inbox/`：待发布草稿
- `workbench/archive/`：已发布归档

## 日常发布流程

### 1. 写草稿

把新的简报草稿写成一个 `.md` 文件，放进 `workbench/inbox/`。

要求尽量宽松：

- 可以使用自然语言
- 不要求严格 Markdown 语法
- 不需要手动打标签
- 标题默认从文件中的第一行标题或最显眼的一句提取
- 日期、时间以正式发布时刻为准

### 2. 让 Copilot 读取草稿

在 VS Code 里对 Copilot 说：

- `读取 workbench/inbox 里的最新草稿，提取 newsletter 候选内容并给我 tag 清单确认`

Copilot 处理时会做这些事：

- 读取草稿
- 自动提取标题
- 自动生成摘要
- 自动生成 `id`
- 自动识别内容项并转换成 `link` / `thought` / `image`
- 自动给出一份 tags 候选清单，等待你确认

### 3. 预览

你确认 tags 后，再对 Copilot 说：

- `按确认后的 tags 生成预览并启动本地预览`

推荐预览方式：

- Copilot 写入 `public/data.json`
- 本地运行 `npm run dev`
- 你在浏览器中检查实际页面效果

### 4. 正式发布

预览确认后，再对 Copilot 说：

- `正式发布这篇 newsletter，并归档工作台草稿`

正式发布动作包括：

- 将内容写入 `public/data.json`
- 重新生成 RSS
- 提交并推送到远端
- 将原始草稿移动到 `workbench/archive/`

## 草稿书写建议

虽然你不需要遵守严格格式，但为了提高识别质量，建议保留这些信息：

- 一个明显标题
- 若干段导语/观点
- 若干链接（最好每行一个或明显可识别）
- 若干图片链接或图片说明
- 你自己的短评

## 示例提示词

### 从草稿生成候选内容

- `读取 workbench/inbox/today.md，整理成 newsletter 候选内容，先给我 title、summary、tags、items 草案，不要发布`

### 确认标签后预览

- `使用这些 tags：[Game Design, AI, Tools]，把草稿转成页面预览，先不要推送远端`

### 正式发布并归档

- `发布当前草稿到远端，并把对应 .md 归档到 workbench/archive/`
