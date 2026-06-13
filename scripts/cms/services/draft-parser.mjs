export function parseFrontmatter(rawContent) {
  const content = rawContent.replace(/^\uFEFF/, '');
  if (!content.startsWith('---\n')) {
    return { frontmatter: {}, body: content.trim() };
  }

  const endIndex = content.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { frontmatter: {}, body: content.trim() };
  }

  const header = content.slice(4, endIndex).trim();
  const body = content.slice(endIndex + 5).trim();
  const frontmatter = {};

  header.split(/\r?\n/).forEach((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      return;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) {
      frontmatter[key] = value;
    }
  });

  return { frontmatter, body };
}

export function inferAction(text, frontmatter) {
  if (frontmatter.action && frontmatter.action !== 'auto') {
    return frontmatter.action;
  }

  const value = text.toLowerCase();
  if (/(删除|移除|撤掉|delete|remove)/i.test(value)) {
    return 'delete';
  }
  if (/(修改|编辑|更新|update|edit)/i.test(value)) {
    return 'update';
  }
  if (/(预览|preview)/i.test(value)) {
    return 'preview';
  }
  if (/(发布|publish)/i.test(value)) {
    return 'publish';
  }
  return 'create';
}

export function inferKind(text, frontmatter) {
  if (frontmatter.kind && frontmatter.kind !== 'auto') {
    return frontmatter.kind;
  }

  const value = text.toLowerCase();
  if (/(capsule|胶囊|卡片)/i.test(value)) {
    return 'capsule';
  }
  if (/(issue|newsletter|简报|文章)/i.test(value)) {
    return 'issue';
  }
  if (/(flow|碎碎念|想法)/i.test(value)) {
    return 'flow';
  }
  if (/(article|专栏|长文)/i.test(value)) {
    return 'article';
  }
  if (/(toy|可交互|小游戏|visualization|prototype)/i.test(value)) {
    return 'toy';
  }
  return 'auto';
}

export function inferTarget(text, frontmatter) {
  if (frontmatter.target && frontmatter.target !== 'auto') {
    return frontmatter.target;
  }

  const match = text.match(/(issue-[\w-]+|capsule-[\w-]+|flow-[\w-]+|article-[\w-]+|toy-[\w-]+)/i);
  return match ? match[1] : 'auto';
}

export function inferTitle(text, fileName, frontmatter = {}) {
  if (frontmatter.title) {
    return frontmatter.title.trim();
  }
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return fileName.replace(/\.md$/i, '');
  }

  const heading = lines.find((line) => line.startsWith('#'));
  if (heading) {
    return heading.replace(/^#+\s*/, '').trim();
  }

  return lines[0].slice(0, 60);
}

export function createSummary(text) {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.slice(0, 120) || '暂无摘要';
}

export function buildInternalPrompt(operation) {
  return [
    '读取 workbench/inbox 中指定的操作单。',
    `文件：${operation.fileName}`,
    `当前推断 action：${operation.action}`,
    `当前推断 kind：${operation.kind}`,
    `当前推断 target：${operation.target}`,
    '请基于操作单内容判断这是 create / update / delete / preview / publish 中哪一种。',
    '请判断目标应为 Capsule 还是 Issue。',
    '如果是 Capsule：输出 title、summary、slug、tags 候选、payload。',
    '如果是 Issue：输出 title、summary、slug、tags 候选、blocks，并尽量把内容点抽成 Capsule 后用 capsule-ref 引用。',
    '如果是 update / delete：输出操作摘要、受影响对象、风险点与建议。',
    '先不要正式发布，先返回 tags 清单、结构化候选和预览建议。'
  ].join('\n');
}
