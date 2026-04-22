const PAGE_SIZE = 20;

const elements = {
  modeSubtitle: document.getElementById('modeSubtitle'),
  tabCapsule: document.getElementById('tabCapsule'),
  tabIssue: document.getElementById('tabIssue'),
  modePrimary: document.getElementById('modePrimary'),
  modeSecondary: document.getElementById('modeSecondary'),
  modeSide: document.getElementById('modeSide'),
  floatingSuggestion: document.getElementById('floatingSuggestion'),
  toast: document.getElementById('toast')
};

const state = {
  mode: 'capsule',
  dataSource: { capsules: [], issues: [], features: {} },
  inboxFiles: [],
  draggingBlockId: null,
  suggestion: {
    visible: false,
    type: null,
    target: null,
    query: '',
    start: 0,
    end: 0,
    options: [],
    top: 0,
    left: 0,
    width: 260
  },
  ui: {
    capsule: {
      composerText: '',
      page: 1,
      activeTag: '',
      expanded: {},
      editing: {},
      editTexts: {}
    },
    issue: {
      page: 1,
      search: '',
      expandedPreview: {},
      editor: null
    }
  }
};

let uniqueIdSeed = 0;

function uid(prefix = 'id') {
  uniqueIdSeed += 1;
  return `${prefix}-${uniqueIdSeed}`;
}

function createTextBlock(text = '') {
  return { id: uid('text'), type: 'text', text };
}

function createEmptyIssueEditor() {
  return {
    itemKey: 'new',
    fileName: '',
    targetId: 'auto',
    status: 'draft',
    blocks: [createTextBlock('')]
  };
}

function createCapsuleBlock(capsule) {
  return {
    id: uid('capsule'),
    type: 'capsule',
    capsuleId: capsule.id,
    title: capsule.title,
    text: getPublishedCapsuleText(capsule),
    tags: capsule.tags || []
  };
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message, type = 'info') {
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  elements.toast.style.background = type === 'error' ? '#7f1d1d' : '#0f172a';
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.add('hidden'), 2600);
}

function parseFrontmatter(rawContent = '') {
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

function serializeDraft(frontmatter, body) {
  const header = Object.entries(frontmatter)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  return `---\n${header}\n---\n\n${(body || '').trim()}`.trim();
}

function parseTagList(value = '') {
  return String(value)
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractTags(text = '') {
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

function inferTitleFromText(text = '', fallback = '未命名') {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines[0]?.slice(0, 48) || fallback;
}

function slugifyLabel(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-') || 'untitled';
}

function generateAutoFileName(kind, body, existingName = '') {
  const trimmed = String(existingName || '').trim();
  if (trimmed) {
    return trimmed.endsWith('.md') ? trimmed : `${trimmed}.md`;
  }
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${kind}-${stamp}-${slugifyLabel(inferTitleFromText(body, kind)).slice(0, 30)}.md`;
}

function getStatusLabel(status) {
  return {
    published: '已发布',
    pendingPublish: '待发布',
    pendingRefresh: '待刷新',
    pendingDelete: '待删除',
    draft: '草稿'
  }[status] || '草稿';
}

function actionToStatus(action) {
  if (action === 'delete') {
    return 'pendingDelete';
  }
  if (action === 'update') {
    return 'pendingRefresh';
  }
  return 'pendingPublish';
}

function requestJson(url, options = {}) {
  return fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `请求失败：${response.status}`);
    }
    return payload;
  });
}

function normalizeInboxFile(file) {
  const { frontmatter, body } = parseFrontmatter(file.content || '');
  const parsedTags = parseTagList(frontmatter.tags || '');
  return {
    ...file,
    frontmatter,
    body,
    title: file.title || inferTitleFromText(body, file.fileName),
    tags: parsedTags.length ? parsedTags : extractTags(body || ''),
    status: actionToStatus(file.action || frontmatter.action),
    kind: file.kind || frontmatter.kind,
    target: file.target || frontmatter.target || 'auto'
  };
}

function getCapsuleMap() {
  return new Map((state.dataSource.capsules || []).map((item) => [item.id, item]));
}

function getPublishedCapsuleText(capsule) {
  if (!capsule) {
    return '';
  }
  const payload = capsule.payload || {};
  const chunks = [];
  if (payload.content) chunks.push(payload.content);
  if (payload.commentary) chunks.push(payload.commentary);
  if (payload.caption) chunks.push(payload.caption);
  if (payload.url) chunks.push(payload.url);
  return chunks.join('\n\n') || capsule.summary || capsule.title;
}

function convertPublishedIssueToBlocks(issue) {
  const capsuleMap = getCapsuleMap();
  const blocks = [];
  (issue.blocks || []).forEach((block) => {
    if (block.type === 'note') {
      blocks.push(createTextBlock(block.content || ''));
      return;
    }
    if (block.type === 'capsule-ref') {
      const capsule = capsuleMap.get(block.capsuleId);
      blocks.push(
        capsule
          ? createCapsuleBlock(capsule)
          : {
              id: uid('capsule'),
              type: 'capsule',
              capsuleId: block.capsuleId,
              title: block.capsuleId,
              text: '这个 Capsule 当前不存在，引用已失效。',
              tags: []
            }
      );
    }
  });
  return blocks.length ? blocks : [createTextBlock('')];
}

function parseIssueBodyToBlocks(body = '') {
  const capsuleMap = getCapsuleMap();
  const blocks = [];
  const regex = /\[引用 Capsule\]\s*\n\s*capsuleId:\s*([^\n]+)\n(?:\s*title:\s*([^\n]*)\n)?(?:\s*note:\s*([^\n]*)\n?)?/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(body)) !== null) {
    const before = body.slice(lastIndex, match.index).trim();
    if (before) {
      blocks.push(createTextBlock(before));
    }
    const capsuleId = match[1].trim();
    const capsule = capsuleMap.get(capsuleId);
    blocks.push(
      capsule
        ? createCapsuleBlock(capsule)
        : {
            id: uid('capsule'),
            type: 'capsule',
            capsuleId,
            title: match[2]?.trim() || capsuleId,
            text: '这个 Capsule 当前不存在，引用已失效。',
            tags: []
          }
    );
    lastIndex = regex.lastIndex;
  }
  const tail = body.slice(lastIndex).trim();
  if (tail) {
    blocks.push(createTextBlock(tail));
  }
  return blocks.length ? blocks : [createTextBlock('')];
}

function serializeIssueBlocks(blocks) {
  const parts = [];
  blocks.forEach((block) => {
    if (block.type === 'text') {
      const text = String(block.text || '').trim();
      if (text) {
        parts.push(text);
      }
      return;
    }
    parts.push([
      '[引用 Capsule]',
      `capsuleId: ${block.capsuleId}`,
      `title: ${block.title || block.capsuleId}`,
      'note: '
    ].join('\n'));
  });
  return parts.join('\n\n').trim();
}

function cloneBlocks(blocks) {
  return blocks.map((block) => ({ ...block, tags: [...(block.tags || [])] }));
}

function issueSummaryFromBlocks(blocks) {
  const summary = blocks
    .map((block) => (block.type === 'text' ? block.text : block.title))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return summary.slice(0, 90) || '还没有内容摘要';
}

function getCapsuleDrafts() {
  return state.inboxFiles.filter((file) => file.kind === 'capsule').sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
}

function getIssueDrafts() {
  return state.inboxFiles.filter((file) => file.kind === 'issue').sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
}

function buildCapsuleItems() {
  const drafts = getCapsuleDrafts();
  const published = [...(state.dataSource.capsules || [])].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const overlayMap = new Map();

  drafts.filter((draft) => draft.target && draft.target !== 'auto').forEach((draft) => {
    if (!overlayMap.has(draft.target)) {
      overlayMap.set(draft.target, draft);
    }
  });

  const items = drafts.filter((draft) => !draft.target || draft.target === 'auto').map((draft) => ({
    key: `draft:${draft.fileName}`,
    fileName: draft.fileName,
    id: '',
    title: draft.title || '未命名 Capsule',
    text: draft.body,
    tags: draft.tags,
    status: draft.status,
    updatedAt: draft.modifiedAt,
    isPublished: false
  }));

  published.forEach((capsule) => {
    const draft = overlayMap.get(capsule.id);
    items.push({
      key: capsule.id,
      fileName: draft?.fileName || '',
      id: capsule.id,
      title: draft && draft.status === 'pendingRefresh' ? draft.title || capsule.title : capsule.title,
      text: draft && draft.status === 'pendingRefresh' ? draft.body : getPublishedCapsuleText(capsule),
      tags: draft && draft.status === 'pendingRefresh' && draft.tags.length ? draft.tags : (capsule.tags || []),
      status: draft ? draft.status : 'published',
      updatedAt: draft?.modifiedAt || capsule.publishedAt,
      isPublished: true
    });
  });

  const filtered = state.ui.capsule.activeTag
    ? items.filter((item) => item.tags.some((tag) => tag.toLowerCase() === state.ui.capsule.activeTag.toLowerCase()))
    : items;

  return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function buildIssueItems() {
  const drafts = getIssueDrafts();
  const published = [...(state.dataSource.issues || [])].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const overlayMap = new Map();

  drafts.filter((draft) => draft.target && draft.target !== 'auto').forEach((draft) => {
    if (!overlayMap.has(draft.target)) {
      overlayMap.set(draft.target, draft);
    }
  });

  const items = drafts.filter((draft) => !draft.target || draft.target === 'auto').map((draft) => {
    const blocks = parseIssueBodyToBlocks(draft.body || '');
    return {
      key: `draft:${draft.fileName}`,
      fileName: draft.fileName,
      id: '',
      title: draft.title || '未命名 Issue',
      summary: issueSummaryFromBlocks(blocks),
      blocks,
      status: draft.status,
      updatedAt: draft.modifiedAt,
      isPublished: false
    };
  });

  published.forEach((issue) => {
    const draft = overlayMap.get(issue.id);
    const blocks = draft && draft.status === 'pendingRefresh' ? parseIssueBodyToBlocks(draft.body || '') : convertPublishedIssueToBlocks(issue);
    items.push({
      key: issue.id,
      fileName: draft?.fileName || '',
      id: issue.id,
      title: draft && draft.status === 'pendingRefresh' ? draft.title || issue.title : issue.title,
      summary: draft && draft.status === 'pendingRefresh' ? issueSummaryFromBlocks(blocks) : issue.summary,
      blocks,
      status: draft ? draft.status : 'published',
      updatedAt: draft?.modifiedAt || issue.publishedAt,
      isPublished: true
    });
  });

  const query = state.ui.issue.search.trim().toLowerCase();
  const filtered = !query ? items : items.filter((item) => `${item.title} ${item.summary}`.toLowerCase().includes(query));
  return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function getRecentTags(limit = 5) {
  const recent = [];
  const addTag = (tag) => {
    if (!recent.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      recent.push(tag);
    }
  };
  [...(state.dataSource.capsules || [])]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .forEach((capsule) => (capsule.tags || []).forEach(addTag));
  getCapsuleDrafts().forEach((draft) => draft.tags.forEach(addTag));
  return recent.slice(0, limit);
}

function getAllTags() {
  const tags = [];
  const addTag = (tag) => {
    if (!tags.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      tags.push(tag);
    }
  };
  (state.dataSource.capsules || []).forEach((capsule) => (capsule.tags || []).forEach(addTag));
  getCapsuleDrafts().forEach((draft) => draft.tags.forEach(addTag));
  return tags;
}

function getTagCounts() {
  const counts = new Map();
  buildCapsuleItems().forEach((item) => {
    item.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function getRecentCapsuleCandidates(limit = 5) {
  return buildCapsuleItems()
    .filter((item) => item.status !== 'pendingDelete')
    .slice(0, limit)
    .map((item) => ({ id: item.id || item.fileName, title: item.title, text: item.text, tags: item.tags, sourceId: item.id }));
}

function getCapsuleCandidates(query = '') {
  const normalizedQuery = query.trim().toLowerCase();
  const items = buildCapsuleItems().filter((item) => item.status !== 'pendingDelete');
  if (!normalizedQuery) {
    return getRecentCapsuleCandidates();
  }
  return items
    .filter((item) => `${item.title} ${item.text} ${(item.tags || []).join(' ')}`.toLowerCase().includes(normalizedQuery))
    .slice(0, 8)
    .map((item) => ({ id: item.id || item.fileName, title: item.title, text: item.text, tags: item.tags, sourceId: item.id }));
}

function paginate(items, page) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  return {
    totalPages,
    currentPage,
    entries: items.slice(start, start + PAGE_SIZE)
  };
}

function renderPagination(currentPage, totalPages, action) {
  if (totalPages <= 1) {
    return '';
  }
  const buttons = [];
  for (let page = 1; page <= totalPages; page += 1) {
    buttons.push(`<button class="ghost small ${page === currentPage ? 'active' : ''}" data-action="${action}" data-page="${page}">${page}</button>`);
  }
  return `<div class="pagination">${buttons.join('')}</div>`;
}

function capsuleNeedsCollapse(text) {
  return String(text || '').length > 240;
}

function getHashtagContext(value, selectionStart) {
  const left = value.slice(0, selectionStart);
  const match = left.match(/(?:^|[\s([{])#([\u4e00-\u9fa5A-Za-z0-9_-]*)$/);
  if (!match) {
    return null;
  }
  return {
    query: match[1] || '',
    start: selectionStart - match[1].length - 1,
    end: selectionStart
  };
}

function getMentionContext(value, selectionStart) {
  const left = value.slice(0, selectionStart);
  const match = left.match(/(?:^|\n|\s)@([\u4e00-\u9fa5A-Za-z0-9_-]*)$/);
  if (!match) {
    return null;
  }
  return {
    query: match[1] || '',
    start: selectionStart - match[1].length - 1,
    end: selectionStart
  };
}

function positionSuggestion(textarea) {
  const rect = textarea.getBoundingClientRect();
  state.suggestion.top = rect.bottom + 8;
  state.suggestion.left = rect.left;
  state.suggestion.width = Math.max(rect.width, 240);
}

function hideSuggestion() {
  state.suggestion.visible = false;
  renderFloatingSuggestion();
}

function renderFloatingSuggestion() {
  const panel = elements.floatingSuggestion;
  if (!state.suggestion.visible) {
    panel.classList.add('hidden');
    panel.innerHTML = '';
    return;
  }

  panel.classList.remove('hidden');
  panel.style.top = `${state.suggestion.top}px`;
  panel.style.left = `${state.suggestion.left}px`;
  panel.style.width = `${state.suggestion.width}px`;

  if (state.suggestion.type === 'tag') {
    panel.innerHTML = state.suggestion.options
      .map((tag) => `<button class="suggestion-item" data-action="suggest-tag" data-value="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`)
      .join('');
    return;
  }

  panel.innerHTML = state.suggestion.options
    .map((item) => `
      <button class="suggestion-item" data-action="suggest-capsule" data-value="${escapeHtml(item.sourceId || item.id)}">
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml((item.text || '').slice(0, 60))}</small>
      </button>
    `)
    .join('');
}

function updateTagSuggestion(textarea, targetKey) {
  const context = getHashtagContext(textarea.value, textarea.selectionStart);
  if (!context) {
    hideSuggestion();
    return;
  }
  const allTags = getAllTags();
  const options = context.query
    ? allTags.filter((tag) => tag.toLowerCase().startsWith(context.query.toLowerCase())).slice(0, 8)
    : getRecentTags();
  if (!options.length) {
    hideSuggestion();
    return;
  }
  state.suggestion = {
    visible: true,
    type: 'tag',
    target: targetKey,
    query: context.query,
    start: context.start,
    end: context.end,
    options,
    top: 0,
    left: 0,
    width: 260
  };
  positionSuggestion(textarea);
  renderFloatingSuggestion();
}

function updateMentionSuggestion(textarea, blockId) {
  const context = getMentionContext(textarea.value, textarea.selectionStart);
  if (!context) {
    hideSuggestion();
    return;
  }
  const options = getCapsuleCandidates(context.query);
  if (!options.length) {
    hideSuggestion();
    return;
  }
  state.suggestion = {
    visible: true,
    type: 'mention',
    target: blockId,
    query: context.query,
    start: context.start,
    end: context.end,
    options,
    top: 0,
    left: 0,
    width: 320
  };
  positionSuggestion(textarea);
  renderFloatingSuggestion();
}

function applyTagSuggestion(tag) {
  let textarea;
  if (state.suggestion.target === 'capsule-composer') {
    textarea = document.getElementById('capsuleComposerInput');
  } else {
    textarea = document.querySelector(`[data-capsule-edit-text="${state.suggestion.target}"]`);
  }
  if (!textarea) {
    hideSuggestion();
    return;
  }

  const nextValue = `${textarea.value.slice(0, state.suggestion.start)}#${tag} ${textarea.value.slice(state.suggestion.end)}`;
  textarea.value = nextValue;
  const cursor = state.suggestion.start + tag.length + 2;
  textarea.setSelectionRange(cursor, cursor);

  if (state.suggestion.target === 'capsule-composer') {
    state.ui.capsule.composerText = nextValue;
    renderCapsuleComposerTagPreview();
  } else {
    state.ui.capsule.editTexts[state.suggestion.target] = nextValue;
  }

  autoResizeTextarea(textarea, 32);
  hideSuggestion();
}

function applyMentionSuggestion(capsuleId) {
  const editor = state.ui.issue.editor;
  const blockIndex = editor.blocks.findIndex((block) => block.id === state.suggestion.target);
  if (blockIndex === -1) {
    hideSuggestion();
    return;
  }
  const block = editor.blocks[blockIndex];
  const nextText = `${block.text.slice(0, state.suggestion.start)}${block.text.slice(state.suggestion.end)}`.trimEnd();
  const publishedCapsule = getCapsuleMap().get(capsuleId);
  if (!publishedCapsule) {
    showToast('没有找到这个 Capsule。', 'error');
    return;
  }
  editor.blocks.splice(blockIndex, 1, { ...block, text: nextText }, createCapsuleBlock(publishedCapsule), createTextBlock(''));
  renderIssueWorkspace();
  hideSuggestion();
}

function autoResizeTextarea(textarea, minHeight = 40) {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
}

function renderCapsuleComposerTagPreview() {
  const container = document.getElementById('capsuleTagPreview');
  if (!container) {
    return;
  }
  const tags = extractTags(state.ui.capsule.composerText);
  container.innerHTML = tags.length
    ? tags.map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('')
    : '<span class="hint">输入 #标签 可以手动添加标签。</span>';
}

function getCapsuleItemByKey(key) {
  return buildCapsuleItems().find((item) => item.key === key);
}

function getIssueItemByKey(key) {
  return buildIssueItems().find((item) => item.key === key);
}

async function refreshInbox() {
  const result = await requestJson('/api/inbox');
  state.inboxFiles = result.files.map(normalizeInboxFile);
}

async function saveTask({ kind, action, target = 'auto', body, fileName = '', tags = [] }) {
  const finalName = generateAutoFileName(kind, body, fileName);
  if (target && target !== 'auto') {
    const conflicts = state.inboxFiles.filter((file) => file.kind === kind && file.target === target && file.fileName !== finalName);
    for (const conflict of conflicts) {
      await requestJson(`/api/inbox/${encodeURIComponent(conflict.fileName)}`, { method: 'DELETE' });
    }
  }
  const content = serializeDraft(
    {
      action,
      kind,
      target,
      tags: tags.length ? tags.join(', ') : undefined
    },
    body
  );
  const saved = await requestJson('/api/inbox', {
    method: 'POST',
    body: JSON.stringify({ fileName: finalName, content })
  });
  await refreshInbox();
  return normalizeInboxFile(saved);
}

async function deleteDraft(fileName) {
  await requestJson(`/api/inbox/${encodeURIComponent(fileName)}`, { method: 'DELETE' });
  await refreshInbox();
}

function renderStatusPill(status) {
  return `<span class="status-pill ${status}">${getStatusLabel(status)}</span>`;
}

function renderCapsuleCard(item) {
  const expanded = Boolean(state.ui.capsule.expanded[item.key]);
  const editing = Boolean(state.ui.capsule.editing[item.key]);
  const text = editing ? state.ui.capsule.editTexts[item.key] || item.text : item.text;
  const collapsed = capsuleNeedsCollapse(text) && !expanded && !editing;
  return `
    <article class="capsule-card ${item.status}">
      <div class="item-head">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <div class="item-meta">
            ${renderStatusPill(item.status)}
            <span class="hint">${new Date(item.updatedAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
        <div class="item-actions">
          ${item.status !== 'pendingDelete' ? `<button class="ghost small icon-button" data-action="capsule-edit" data-key="${item.key}">✎</button>` : ''}
          <button class="ghost small icon-button danger" data-action="capsule-delete" data-key="${item.key}">🗑</button>
        </div>
      </div>
      ${editing ? `
        <div class="text-shell">
          <textarea class="capsule-card-editor" data-capsule-edit-text="${item.key}">${escapeHtml(text)}</textarea>
        </div>
        <div class="item-tags">${extractTags(text).map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="editor-actions">
          <button data-action="capsule-save-edit" data-key="${item.key}">保存</button>
          <button class="ghost" data-action="capsule-cancel-edit" data-key="${item.key}">取消</button>
        </div>
      ` : `
        <div class="capsule-content ${collapsed ? 'collapsed' : ''}">${escapeHtml(text)}</div>
        <div class="item-tags">${(item.tags || []).map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('')}</div>
        ${capsuleNeedsCollapse(text) ? `<button class="ghost small" data-action="capsule-toggle-expand" data-key="${item.key}">${expanded ? '收起' : '展开'}</button>` : ''}
      `}
    </article>
  `;
}

function renderCapsuleWorkspace() {
  const items = buildCapsuleItems();
  const { currentPage, totalPages, entries } = paginate(items, state.ui.capsule.page);
  state.ui.capsule.page = currentPage;
  const activeTagLabel = state.ui.capsule.activeTag ? ` · 当前筛选 #${escapeHtml(state.ui.capsule.activeTag)}` : '';

  elements.modeSubtitle.textContent = '管理单条 Capsule：写内容、打标签、进入待发布列表。';
  elements.modePrimary.innerHTML = `
    <section class="card composer-card section-card">
      <div class="card-head">
        <div>
          <p class="eyebrow">Capsule</p>
          <h2>写一条 Capsule</h2>
          <p class="hint">像发一条 flomo 一样，直接把想法写下来。输入 # 可以添加标签。</p>
        </div>
      </div>
      <div class="text-shell compact">
        <textarea id="capsuleComposerInput" class="capsule-textarea" rows="1" placeholder="写下这条 Capsule 的内容……">${escapeHtml(state.ui.capsule.composerText)}</textarea>
      </div>
      <div id="capsuleTagPreview" class="tag-chips"></div>
      <div class="composer-actions">
        <button id="capsulePublishButton" data-action="capsule-publish">发布</button>
      </div>
    </section>
  `;

  elements.modeSecondary.innerHTML = `
    <section class="card section-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">Capsule 列表</p>
          <h2>最近 20 条 Capsule${activeTagLabel}</h2>
        </div>
      </div>
      <div class="capsule-list">
        ${entries.length ? entries.map(renderCapsuleCard).join('') : '<div class="empty-card"><h3>还没有 Capsule</h3><p class="hint">上面写一条内容，点击发布后就会出现在这里。</p></div>'}
      </div>
      ${renderPagination(currentPage, totalPages, 'capsule-page')}
    </section>
  `;

  const tagCounts = getTagCounts();
  elements.modeSide.innerHTML = `
    <section class="card side-card">
      <div class="filter-head">
        <div>
          <p class="eyebrow">标签筛选</p>
          <h3 class="side-title">Tags</h3>
        </div>
        ${state.ui.capsule.activeTag ? '<button class="ghost small" data-action="capsule-clear-tag">清除</button>' : ''}
      </div>
      <div class="tag-sidebar-list">
        ${tagCounts.length ? tagCounts.map(([tag, count]) => `<button class="ghost small ${state.ui.capsule.activeTag === tag ? 'active' : ''}" data-action="capsule-filter-tag" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)} · ${count}</button>`).join('') : '<p class="hint">还没有标签。</p>'}
      </div>
    </section>
  `;

  elements.tabCapsule.classList.add('active');
  elements.tabIssue.classList.remove('active');
  requestAnimationFrame(() => {
    const composer = document.getElementById('capsuleComposerInput');
    if (composer) {
      autoResizeTextarea(composer, 32);
    }
    document.querySelectorAll('[data-capsule-edit-text]').forEach((textarea) => autoResizeTextarea(textarea, 120));
    renderCapsuleComposerTagPreview();
  });
}

function renderIssueCapsuleBlock(block, expanded) {
  const collapsed = capsuleNeedsCollapse(block.text) && !expanded;
  return `
    <article class="capsule-preview-card draggable" draggable="true" data-drag-block-id="${block.id}">
      <div class="item-head">
        <div>
          <h3 class="preview-title">${escapeHtml(block.title)}</h3>
          <p class="hint">@ 引入的 Capsule block</p>
        </div>
        <div class="item-actions">
          <button class="ghost small" data-action="issue-toggle-capsule" data-block-id="${block.id}">${expanded ? '收起' : '展开'}</button>
          <button class="ghost small danger" data-action="issue-remove-capsule" data-block-id="${block.id}">删除</button>
        </div>
      </div>
      <div class="capsule-preview-body ${collapsed ? 'collapsed' : ''}">${escapeHtml(block.text)}</div>
      <div class="item-tags">${(block.tags || []).map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('')}</div>
    </article>
  `;
}

function renderIssueWorkspace() {
  const editor = state.ui.issue.editor;
  const blocksHtml = editor.blocks
    .map((block, index) => {
      const dropBefore = `<div class="drop-zone" data-drop-index="${index}"></div>`;
      if (block.type === 'text') {
        return `
          ${dropBefore}
          <div class="issue-block">
            <textarea class="issue-text-block ${index === 0 ? 'primary' : ''}" data-issue-text-block="${block.id}" rows="${index === 0 ? '20' : '4'}" placeholder="输入这一段内容，按 @ 可以插入 Capsule">${escapeHtml(block.text)}</textarea>
            ${editor.blocks.length > 1 ? `<div class="block-actions"><button class="ghost small danger" data-action="issue-remove-block" data-block-id="${block.id}">删除这段</button></div>` : ''}
          </div>
        `;
      }
      return `${dropBefore}${renderIssueCapsuleBlock(block, Boolean(state.ui.issue.expandedPreview[block.id]))}`;
    })
    .join('');

  const items = buildIssueItems();
  const { currentPage, totalPages, entries } = paginate(items, state.ui.issue.page);
  state.ui.issue.page = currentPage;

  elements.modeSubtitle.textContent = '管理整篇 Issue：写段落、按 @ 插入 Capsule、再保存成待发布任务。';
  elements.modePrimary.innerHTML = `
    <section class="card issue-editor-card section-card">
      <div class="card-head">
        <div>
          <p class="eyebrow">Issue</p>
          <h2>Issue 编辑器</h2>
          <p class="hint">输入正文时按 @，可以插入 Capsule 卡片。Capsule block 可以拖拽排序。</p>
        </div>
        <div class="item-meta">
          ${renderStatusPill(editor.status === 'draft' ? 'pendingPublish' : editor.status)}
        </div>
      </div>
      <div class="issue-block-list">
        ${blocksHtml}
        <div class="drop-zone" data-drop-index="${editor.blocks.length}"></div>
      </div>
      <div class="composer-actions">
        <button data-action="issue-save">保存</button>
      </div>
    </section>
  `;

  elements.modeSecondary.innerHTML = '';
  elements.modeSide.innerHTML = `
    <section class="card side-card">
      <div class="issue-list-head">
        <div>
          <p class="eyebrow">Issue 列表</p>
          <h3 class="side-title">最近 20 条 Issue</h3>
        </div>
      </div>
      <input id="issueSearchInput" class="search-input" type="text" placeholder="搜索 Issue" value="${escapeHtml(state.ui.issue.search)}" />
      <div class="issue-list">
        ${entries.length ? entries.map((item) => `
          <article class="issue-list-item ${item.key === editor.itemKey ? 'active' : ''} ${item.status}">
            <div class="item-head">
              <div>
                <h3>${escapeHtml(item.title)}</h3>
                <div class="item-meta">
                  ${renderStatusPill(item.status)}
                  <span class="hint">${new Date(item.updatedAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
              <div class="item-actions">
                ${item.status !== 'pendingDelete' ? `<button class="ghost small icon-button" data-action="issue-load" data-key="${item.key}">✎</button>` : ''}
                <button class="ghost small icon-button danger" data-action="issue-delete" data-key="${item.key}">🗑</button>
              </div>
            </div>
            <div class="issue-summary">${escapeHtml(item.summary)}</div>
          </article>
        `).join('') : '<div class="empty-card"><h3>还没有 Issue</h3><p class="hint">开始写一篇内容，保存后就会出现在这里。</p></div>'}
      </div>
      ${renderPagination(currentPage, totalPages, 'issue-page')}
    </section>
  `;

  elements.tabIssue.classList.add('active');
  elements.tabCapsule.classList.remove('active');
  requestAnimationFrame(() => {
    document.querySelectorAll('[data-issue-text-block]').forEach((textarea, index) => autoResizeTextarea(textarea, index === 0 ? 360 : 120));
  });
}

function renderWorkspace() {
  hideSuggestion();
  if (state.mode === 'capsule') {
    renderCapsuleWorkspace();
  } else {
    renderIssueWorkspace();
  }
}

async function publishCapsuleFromComposer() {
  const text = state.ui.capsule.composerText.trim();
  if (!text) {
    showToast('先写点内容，再发布。', 'error');
    return;
  }
  await saveTask({ kind: 'capsule', action: 'create', target: 'auto', body: text, tags: extractTags(text) });
  state.ui.capsule.composerText = '';
  renderWorkspace();
  showToast('已加入待发布列表');
}

async function saveCapsuleCard(key) {
  const item = getCapsuleItemByKey(key);
  const text = String(state.ui.capsule.editTexts[key] || '').trim();
  if (!item || !text) {
    showToast('内容不能为空。', 'error');
    return;
  }
  if (item.status === 'pendingPublish' && item.fileName) {
    await saveTask({ kind: 'capsule', action: 'create', target: 'auto', body: text, fileName: item.fileName, tags: extractTags(text) });
  } else {
    await saveTask({ kind: 'capsule', action: 'update', target: item.id, body: text, fileName: item.fileName || `update-${item.id}.md`, tags: extractTags(text) });
  }
  delete state.ui.capsule.editing[key];
  delete state.ui.capsule.editTexts[key];
  renderWorkspace();
  showToast('已保存，状态已更新为待刷新');
}

async function deleteCapsuleItem(key) {
  const item = getCapsuleItemByKey(key);
  if (!item) {
    return;
  }
  if (item.status === 'pendingPublish' && item.fileName) {
    await deleteDraft(item.fileName);
    renderWorkspace();
    showToast('已删除待发布 Capsule');
    return;
  }
  await saveTask({ kind: 'capsule', action: 'delete', target: item.id, body: `删除 Capsule：${item.id}`, fileName: `delete-${item.id}.md` });
  renderWorkspace();
  showToast('已标记为待删除');
}

function loadIssueIntoEditor(item) {
  state.ui.issue.editor = {
    itemKey: item.key,
    fileName: item.fileName || '',
    targetId: item.id || 'auto',
    status: item.status,
    blocks: cloneBlocks(item.blocks)
  };
  renderIssueWorkspace();
}

async function saveIssueEditor() {
  const editor = state.ui.issue.editor;
  const body = serializeIssueBlocks(editor.blocks);
  if (!body.trim()) {
    showToast('先写一点内容，再保存。', 'error');
    return;
  }
  const action = editor.targetId && editor.targetId !== 'auto' ? 'update' : 'create';
  const saved = await saveTask({
    kind: 'issue',
    action,
    target: editor.targetId || 'auto',
    body,
    fileName: editor.fileName || (action === 'update' ? `update-${editor.targetId}.md` : '')
  });
  state.ui.issue.editor = {
    itemKey: editor.targetId && editor.targetId !== 'auto' ? editor.targetId : `draft:${saved.fileName}`,
    fileName: saved.fileName,
    targetId: editor.targetId || 'auto',
    status: action === 'create' ? 'pendingPublish' : 'pendingRefresh',
    blocks: cloneBlocks(editor.blocks)
  };
  renderIssueWorkspace();
  showToast(action === 'create' ? '已加入待发布列表' : '已保存为待刷新');
}

async function deleteIssueItem(key) {
  const item = getIssueItemByKey(key);
  if (!item) {
    return;
  }
  if (item.status === 'pendingPublish' && item.fileName) {
    await deleteDraft(item.fileName);
    if (state.ui.issue.editor.itemKey === key) {
      state.ui.issue.editor = createEmptyIssueEditor();
    }
    renderIssueWorkspace();
    showToast('已删除待发布 Issue');
    return;
  }
  await saveTask({ kind: 'issue', action: 'delete', target: item.id, body: `删除 Issue：${item.id}`, fileName: `delete-${item.id}.md` });
  if (state.ui.issue.editor.itemKey === key) {
    state.ui.issue.editor = createEmptyIssueEditor();
  }
  renderIssueWorkspace();
  showToast('已标记为待删除');
}

function removeIssueBlock(blockId) {
  const editor = state.ui.issue.editor;
  editor.blocks = editor.blocks.filter((block) => block.id !== blockId);
  if (!editor.blocks.length) {
    editor.blocks = [createTextBlock('')];
  }
  renderIssueWorkspace();
}

function moveIssueBlock(blockId, insertIndex) {
  const editor = state.ui.issue.editor;
  const currentIndex = editor.blocks.findIndex((block) => block.id === blockId);
  if (currentIndex === -1) {
    return;
  }
  const [movedBlock] = editor.blocks.splice(currentIndex, 1);
  const safeIndex = Math.max(0, Math.min(insertIndex, editor.blocks.length));
  editor.blocks.splice(safeIndex, 0, movedBlock);
  renderIssueWorkspace();
}

function syncIssueBlock(blockId, text) {
  const block = state.ui.issue.editor.blocks.find((item) => item.id === blockId);
  if (block) {
    block.text = text;
  }
}

function setMode(mode) {
  state.mode = mode;
  renderWorkspace();
}

function renderAfterSearchInput() {
  renderIssueWorkspace();
  requestAnimationFrame(() => {
    const searchInput = document.getElementById('issueSearchInput');
    if (searchInput) {
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  });
}

function handleClick(event) {
  const actionTarget = event.target.closest('[data-action]');

  if (event.target.closest('#tabCapsule')) {
    setMode('capsule');
    return;
  }

  if (event.target.closest('#tabIssue')) {
    setMode('issue');
    return;
  }

  if (!actionTarget) {
    if (!event.target.closest('#floatingSuggestion')) {
      hideSuggestion();
    }
    return;
  }

  const action = actionTarget.dataset.action;
  const key = actionTarget.dataset.key;
  const page = Number(actionTarget.dataset.page || '1');

  switch (action) {
    case 'capsule-publish':
      publishCapsuleFromComposer().catch((error) => showToast(error.message, 'error'));
      break;
    case 'capsule-toggle-expand':
      state.ui.capsule.expanded[key] = !state.ui.capsule.expanded[key];
      renderCapsuleWorkspace();
      break;
    case 'capsule-edit': {
      const item = getCapsuleItemByKey(key);
      state.ui.capsule.editing[key] = true;
      state.ui.capsule.expanded[key] = true;
      state.ui.capsule.editTexts[key] = state.ui.capsule.editTexts[key] || item?.text || '';
      renderCapsuleWorkspace();
      break;
    }
    case 'capsule-cancel-edit':
      delete state.ui.capsule.editing[key];
      delete state.ui.capsule.editTexts[key];
      renderCapsuleWorkspace();
      break;
    case 'capsule-save-edit':
      saveCapsuleCard(key).catch((error) => showToast(error.message, 'error'));
      break;
    case 'capsule-delete':
      deleteCapsuleItem(key).catch((error) => showToast(error.message, 'error'));
      break;
    case 'capsule-page':
      state.ui.capsule.page = page;
      renderCapsuleWorkspace();
      break;
    case 'capsule-filter-tag':
      state.ui.capsule.activeTag = actionTarget.dataset.tag || '';
      state.ui.capsule.page = 1;
      renderCapsuleWorkspace();
      break;
    case 'capsule-clear-tag':
      state.ui.capsule.activeTag = '';
      renderCapsuleWorkspace();
      break;
    case 'issue-load': {
      const item = getIssueItemByKey(key);
      if (item) {
        loadIssueIntoEditor(item);
      }
      break;
    }
    case 'issue-delete':
      deleteIssueItem(key).catch((error) => showToast(error.message, 'error'));
      break;
    case 'issue-page':
      state.ui.issue.page = page;
      renderIssueWorkspace();
      break;
    case 'issue-save':
      saveIssueEditor().catch((error) => showToast(error.message, 'error'));
      break;
    case 'issue-remove-block':
      removeIssueBlock(actionTarget.dataset.blockId);
      break;
    case 'issue-toggle-capsule': {
      const blockId = actionTarget.dataset.blockId;
      state.ui.issue.expandedPreview[blockId] = !state.ui.issue.expandedPreview[blockId];
      renderIssueWorkspace();
      break;
    }
    case 'issue-remove-capsule':
      removeIssueBlock(actionTarget.dataset.blockId);
      break;
    case 'suggest-tag':
      applyTagSuggestion(actionTarget.dataset.value || '');
      break;
    case 'suggest-capsule':
      applyMentionSuggestion(actionTarget.dataset.value || '');
      break;
    default:
      break;
  }
}

function handleInput(event) {
  const target = event.target;

  if (target.id === 'capsuleComposerInput') {
    state.ui.capsule.composerText = target.value;
    autoResizeTextarea(target, 32);
    renderCapsuleComposerTagPreview();
    updateTagSuggestion(target, 'capsule-composer');
    return;
  }

  if (target.matches('[data-capsule-edit-text]')) {
    const key = target.dataset.capsuleEditText;
    state.ui.capsule.editTexts[key] = target.value;
    autoResizeTextarea(target, 120);
    updateTagSuggestion(target, key);
    return;
  }

  if (target.id === 'issueSearchInput') {
    state.ui.issue.search = target.value;
    state.ui.issue.page = 1;
    renderAfterSearchInput();
    return;
  }

  if (target.matches('[data-issue-text-block]')) {
    const blockId = target.dataset.issueTextBlock;
    syncIssueBlock(blockId, target.value);
    autoResizeTextarea(target, target.classList.contains('primary') ? 360 : 120);
    updateMentionSuggestion(target, blockId);
  }
}

function handleKeyDown(event) {
  if (event.key === 'Escape') {
    hideSuggestion();
  }
}

function handleDragStart(event) {
  const card = event.target.closest('[data-drag-block-id]');
  if (!card) {
    return;
  }
  state.draggingBlockId = card.dataset.dragBlockId;
  card.classList.add('dragging');
}

function handleDragOver(event) {
  const zone = event.target.closest('[data-drop-index]');
  if (!zone) {
    return;
  }
  event.preventDefault();
  document.querySelectorAll('.drop-zone.active').forEach((item) => item.classList.remove('active'));
  zone.classList.add('active');
}

function handleDrop(event) {
  const zone = event.target.closest('[data-drop-index]');
  if (!zone || !state.draggingBlockId) {
    return;
  }
  event.preventDefault();
  moveIssueBlock(state.draggingBlockId, Number(zone.dataset.dropIndex));
  state.draggingBlockId = null;
}

function handleDragEnd() {
  state.draggingBlockId = null;
  document.querySelectorAll('.drop-zone.active').forEach((item) => item.classList.remove('active'));
  document.querySelectorAll('.dragging').forEach((item) => item.classList.remove('dragging'));
}

async function bootstrap() {
  state.ui.issue.editor = createEmptyIssueEditor();
  const data = await requestJson('/api/data-source');
  state.dataSource = data;
  await refreshInbox();
  renderWorkspace();
}

document.addEventListener('click', handleClick);
document.addEventListener('input', handleInput);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('dragstart', handleDragStart);
document.addEventListener('dragover', handleDragOver);
document.addEventListener('drop', handleDrop);
document.addEventListener('dragend', handleDragEnd);

bootstrap().catch((error) => showToast(error.message, 'error'));
