export function normalizeLineEndings(value = '') {
  return String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function applyPanguSpacing(value = '') {
  return String(value)
    .replace(/([\u2e80-\u9fff])([A-Za-z0-9]+)/g, '$1 $2')
    .replace(/([A-Za-z0-9]+)([\u2e80-\u9fff])/g, '$1 $2');
}

export function renderTextContent(value = '') {
  return escapeHtml(applyPanguSpacing(value));
}

export function parseFrontmatter(rawContent = '') {
  const content = normalizeLineEndings(rawContent.replace(/^\uFEFF/, ''));
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

export function serializeDraft(frontmatter, body) {
  const header = Object.entries(frontmatter)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  return `---\n${header}\n---\n\n${(body || '').trim()}`.trim();
}

export function parseTagList(value = '') {
  return String(value)
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function extractTags(text = '') {
  const matches = text.match(/#([\u4e00-\u9fa5A-Za-z0-9_-]+)/g) || [];
  const unique = [];
  matches.forEach((rawTag) => {
    const tag = rawTag.slice(1);
    if (!unique.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      unique.push(tag);
    }
  });
  return unique;
}

export function inferTitleFromText(text = '', fallback = '未命名') {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines[0]?.slice(0, 48) || fallback;
}

export function slugifyLabel(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-') || 'untitled';
}

export function getStatusLabel(status) {
  return {
    published: '已发布',
    pendingPublish: '待发布',
    pendingRefresh: '待刷新',
    pendingDelete: '待删除',
    draft: '草稿'
  }[status] || '草稿';
}

export function actionToStatus(action) {
  if (action === 'delete') {
    return 'pendingDelete';
  }
  if (action === 'update') {
    return 'pendingRefresh';
  }
  return 'pendingPublish';
}

export function formatFlowTime(item) {
  const flowTime = item.createdAt || item.updatedAt;
  return new Date(flowTime).toLocaleString('zh-CN');
}
