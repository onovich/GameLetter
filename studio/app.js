const state = {
  files: [],
  selectedFileName: '',
  dirty: false,
  dataSource: { capsules: [], issues: [], features: {} }
};

const elements = {
  draftList: document.getElementById('draftList'),
  fileNameInput: document.getElementById('fileNameInput'),
  contentInput: document.getElementById('contentInput'),
  inferencePanel: document.getElementById('inferencePanel'),
  promptOutput: document.getElementById('promptOutput'),
  dataOverview: document.getElementById('dataOverview'),
  validationPanel: document.getElementById('validationPanel'),
  pendingList: document.getElementById('pendingList'),
  requestMeta: document.getElementById('requestMeta'),
  issueLibrary: document.getElementById('issueLibrary'),
  capsuleLibrary: document.getElementById('capsuleLibrary'),
  toast: document.getElementById('toast'),
  refreshButton: document.getElementById('refreshButton'),
  newDraftButton: document.getElementById('newDraftButton'),
  newCapsuleDraftButton: document.getElementById('newCapsuleDraftButton'),
  newIssueDraftButton: document.getElementById('newIssueDraftButton'),
  normalizeFrontmatterButton: document.getElementById('normalizeFrontmatterButton'),
  saveButton: document.getElementById('saveButton'),
  deleteButton: document.getElementById('deleteButton'),
  preparePublishButton: document.getElementById('preparePublishButton'),
  preparePreviewButton: document.getElementById('preparePreviewButton'),
  validateButton: document.getElementById('validateButton'),
  archiveButton: document.getElementById('archiveButton')
};

function showToast(message, type = 'info') {
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  elements.toast.style.background = type === 'error' ? '#7f1d1d' : '#0f172a';
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2600);
}

function badgeClass(prefix, value) {
  return `${prefix}-${String(value || 'auto').toLowerCase()}`;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseFrontmatter(content) {
  const normalized = (content || '').replace(/^\uFEFF/, '');
  if (!normalized.startsWith('---\n')) {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const endIndex = normalized.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const header = normalized.slice(4, endIndex).trim();
  const body = normalized.slice(endIndex + 5).trim();
  const frontmatter = {};

  header.split(/\r?\n/).forEach((line) => {
    const index = line.indexOf(':');
    if (index === -1) {
      return;
    }
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key) {
      frontmatter[key] = value;
    }
  });

  return { frontmatter, body };
}

function serializeDraft(frontmatter, body) {
  const header = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  return `---\n${header}\n---\n\n${(body || '').trim()}`.trim();
}

function mutateDraft(mutator) {
  const { frontmatter, body } = parseFrontmatter(elements.contentInput.value);
  const next = mutator({ frontmatter: { ...frontmatter }, body });
  elements.contentInput.value = serializeDraft(next.frontmatter, next.body);
}

function renderDraftList() {
  if (state.files.length === 0) {
    elements.draftList.innerHTML = '<div class="card"><p class="hint">inbox 里还没有操作单。</p></div>';
    return;
  }

  elements.draftList.innerHTML = state.files
    .map((file) => `
      <button type="button" class="draft-item ${file.fileName === state.selectedFileName ? 'active' : ''}" data-file="${encodeURIComponent(file.fileName)}">
        <h4>${file.title}</h4>
        <p>${file.summary}</p>
        <div class="draft-meta">
          <span class="badge ${badgeClass('action', file.action)}">${file.action}</span>
          <span class="badge ${badgeClass('kind', file.kind)}">${file.kind}</span>
        </div>
        <small>${new Date(file.modifiedAt).toLocaleString('zh-CN')}</small>
      </button>
    `)
    .join('');

  elements.draftList.querySelectorAll('[data-file]').forEach((button) => {
    button.addEventListener('click', () => selectFile(decodeURIComponent(button.dataset.file)));
  });
}

function renderInference(file) {
  const values = [
    ['文件', file?.fileName || '未保存'],
    ['action', file?.action || 'auto'],
    ['kind', file?.kind || 'auto'],
    ['target', file?.target || 'auto'],
    ['title', file?.title || '待推断'],
    ['summary', file?.summary || '待推断']
  ];

  elements.inferencePanel.innerHTML = values
    .map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`)
    .join('');
}

function renderDataOverview(data) {
  elements.dataOverview.innerHTML = `
    <div class="stats-row"><span>Capsules</span><strong>${data.capsules?.length || 0}</strong></div>
    <div class="stats-row"><span>Issues</span><strong>${data.issues?.length || 0}</strong></div>
    <div class="stats-row"><span>搜索范围</span><strong>${(data.features?.searchScopes || []).join(' / ') || '未配置'}</strong></div>
  `;
}

function renderValidation(result) {
  const entries = [
    ...(result?.errors || []).map((message) => ({ type: 'error', message })),
    ...(result?.warnings || []).map((message) => ({ type: 'warning', message })),
    ...(result?.infos || []).map((message) => ({ type: 'info', message }))
  ];

  if (entries.length === 0) {
    elements.validationPanel.innerHTML = '<div class="validation-item info"><strong>通过</strong><span>当前没有发现明显问题。</span></div>';
    return;
  }

  elements.validationPanel.innerHTML = entries
    .map((entry) => `
      <div class="validation-item ${entry.type}">
        <strong>${entry.type.toUpperCase()}</strong>
        <span>${escapeHtml(entry.message)}</span>
      </div>
    `)
    .join('');
}

function renderPendingRequests(requests) {
  if (!requests?.length) {
    elements.pendingList.innerHTML = '<p class="hint">还没有 request 记录。</p>';
    return;
  }

  elements.pendingList.innerHTML = requests
    .slice(0, 8)
    .map((item) => `
      <div class="pending-item">
        <strong>${escapeHtml(item.title || item.fileName)}</strong>
        <p>${escapeHtml(item.mode)} / ${escapeHtml(item.action)} / ${escapeHtml(item.kind)}</p>
        <small>${new Date(item.createdAt).toLocaleString('zh-CN')}</small>
      </div>
    `)
    .join('');
}

function renderLibraries() {
  const issues = state.dataSource.issues || [];
  const capsules = state.dataSource.capsules || [];

  elements.issueLibrary.innerHTML = issues.length
    ? issues
        .map((issue) => `
          <article class="library-item">
            <div>
              <small>${escapeHtml(issue.id)}</small>
              <h4>${escapeHtml(issue.title)}</h4>
              <p>${escapeHtml(issue.summary || '')}</p>
            </div>
            <div class="library-item-actions">
              <button type="button" class="ghost-button" data-set-target-kind="issue" data-set-target-id="${escapeHtml(issue.id)}">设为目标</button>
              <button type="button" class="secondary-button" data-set-edit-target-kind="issue" data-set-edit-target-id="${escapeHtml(issue.id)}">设为编辑</button>
              <button type="button" class="danger-button" data-set-delete-kind="issue" data-set-delete-id="${escapeHtml(issue.id)}">删除草稿</button>
            </div>
          </article>
        `)
        .join('')
    : '<p class="hint">当前还没有 Issue。</p>';

  elements.capsuleLibrary.innerHTML = capsules.length
    ? capsules
        .map((capsule) => `
          <article class="library-item">
            <div>
              <small>${escapeHtml(capsule.id)}</small>
              <h4>${escapeHtml(capsule.title)}</h4>
              <p>${escapeHtml(capsule.summary || '')}</p>
            </div>
            <div class="library-item-actions">
              <button type="button" class="ghost-button" data-set-target-kind="capsule" data-set-target-id="${escapeHtml(capsule.id)}">设为目标</button>
              <button type="button" class="secondary-button" data-insert-capsule-id="${escapeHtml(capsule.id)}" data-insert-capsule-title="${escapeHtml(capsule.title)}">插入引用</button>
              <button type="button" class="danger-button" data-set-delete-kind="capsule" data-set-delete-id="${escapeHtml(capsule.id)}">删除草稿</button>
            </div>
          </article>
        `)
        .join('')
    : '<p class="hint">当前还没有 Capsule。</p>';

  elements.issueLibrary.querySelectorAll('[data-set-target-kind], [data-set-edit-target-kind]').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.dataset.setTargetKind || button.dataset.setEditTargetKind;
      const id = button.dataset.setTargetId || button.dataset.setEditTargetId;
      const action = button.dataset.setEditTargetKind ? 'update' : undefined;
      applyTarget(kind, id, action);
    });
  });

  elements.issueLibrary.querySelectorAll('[data-set-delete-kind]').forEach((button) => {
    button.addEventListener('click', () => createActionDraft('delete', button.dataset.setDeleteKind, button.dataset.setDeleteId));
  });

  elements.capsuleLibrary.querySelectorAll('[data-set-target-kind]').forEach((button) => {
    button.addEventListener('click', () => applyTarget(button.dataset.setTargetKind, button.dataset.setTargetId));
  });

  elements.capsuleLibrary.querySelectorAll('[data-set-delete-kind]').forEach((button) => {
    button.addEventListener('click', () => createActionDraft('delete', button.dataset.setDeleteKind, button.dataset.setDeleteId));
  });

  elements.capsuleLibrary.querySelectorAll('[data-insert-capsule-id]').forEach((button) => {
    button.addEventListener('click', () => insertCapsuleReference(button.dataset.insertCapsuleId, button.dataset.insertCapsuleTitle));
  });
}

function createActionDraft(action, kind, targetId) {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
  const title = action === 'delete' ? `删除 ${kind}` : `更新 ${kind}`;
  state.selectedFileName = '';
  elements.fileNameInput.value = `${action}-${kind}-${stamp}.md`;
  elements.contentInput.value = `---\naction: ${action}\nkind: ${kind}\ntarget: ${targetId}\n---\n\n${title}：${targetId}\n\n请在这里补充你的自然语言说明。`;
  elements.promptOutput.value = '';
  elements.requestMeta.textContent = '保存后即可生成 request';
  renderInference({
    fileName: elements.fileNameInput.value,
    action,
    kind,
    target: targetId,
    title,
    summary: `准备对 ${targetId} 执行 ${action}`
  });
  renderValidation({ errors: [], warnings: [], infos: [`已为 ${targetId} 创建 ${action} 草稿。`] });
  renderDraftList();
}

function applyTarget(kind, targetId, forcedAction) {
  mutateDraft(({ frontmatter, body }) => {
    frontmatter.kind = kind;
    frontmatter.target = targetId;
    if (forcedAction) {
      frontmatter.action = forcedAction;
    }
    return { frontmatter, body };
  });
  showToast(`已将 ${targetId} 设为目标`);
}

function insertCapsuleReference(capsuleId, capsuleTitle) {
  mutateDraft(({ frontmatter, body }) => {
    if (!frontmatter.kind || frontmatter.kind === 'auto') {
      frontmatter.kind = 'issue';
    }

    const snippet = [
      '',
      '[引用 Capsule]',
      `capsuleId: ${capsuleId}`,
      `title: ${capsuleTitle}`,
      'note: 在这里补一句你希望插在这个 Capsule 后面的短评。'
    ].join('\n');

    const nextBody = `${body.trim()}\n${snippet}`.trim();
    return { frontmatter, body: nextBody };
  });
  showToast(`已插入 Capsule 引用：${capsuleTitle}`);
}

function normalizeFrontmatter(kind = 'auto') {
  mutateDraft(({ frontmatter, body }) => {
    frontmatter.action = frontmatter.action || 'auto';
    frontmatter.kind = kind === 'auto' ? frontmatter.kind || 'auto' : kind;
    frontmatter.target = frontmatter.target || 'auto';
    return { frontmatter, body };
  });
  showToast('已规范化操作单头部');
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `请求失败：${response.status}`);
  }
  return payload;
}

async function loadInbox() {
  const { files } = await requestJson('/api/inbox');
  state.files = files;

  if (!state.selectedFileName && files[0]) {
    state.selectedFileName = files[0].fileName;
  }

  renderDraftList();

  if (state.selectedFileName) {
    const exists = files.some((file) => file.fileName === state.selectedFileName);
    if (exists) {
      await selectFile(state.selectedFileName, false);
      return;
    }
  }

  if (!files[0]) {
    clearEditor();
  }
}

function clearEditor() {
  state.selectedFileName = '';
  elements.fileNameInput.value = '';
  elements.contentInput.value = '---\naction: auto\nkind: auto\ntarget: auto\n---\n';
  elements.promptOutput.value = '';
  elements.requestMeta.textContent = '尚未生成 request';
  renderInference(null);
  renderDraftList();
}

async function selectFile(fileName, shouldRenderList = true) {
  const file = await requestJson(`/api/inbox/${encodeURIComponent(fileName)}`);
  state.selectedFileName = file.fileName;
  elements.fileNameInput.value = file.fileName;
  elements.contentInput.value = file.content;
  elements.promptOutput.value = '';
  elements.requestMeta.textContent = '尚未生成 request';
  renderInference(file);
  if (shouldRenderList) {
    renderDraftList();
  }
}

async function saveCurrent() {
  const fileName = elements.fileNameInput.value.trim();
  const content = elements.contentInput.value;
  if (!fileName) {
    throw new Error('请先填写文件名');
  }
  const saved = await requestJson('/api/inbox', {
    method: 'POST',
    body: JSON.stringify({ fileName, content })
  });
  state.selectedFileName = saved.fileName;
  await loadInbox();
  renderInference(saved);
  showToast('操作单已保存');
}

async function deleteCurrent() {
  const fileName = elements.fileNameInput.value.trim();
  if (!fileName) {
    throw new Error('当前没有可删除的操作单');
  }
  await requestJson(`/api/inbox/${encodeURIComponent(fileName)}`, { method: 'DELETE' });
  clearEditor();
  await loadInbox();
  showToast('操作单已删除');
}

async function archiveCurrent() {
  const fileName = elements.fileNameInput.value.trim();
  if (!fileName) {
    throw new Error('当前没有可归档的操作单');
  }
  const result = await requestJson('/api/archive', {
    method: 'POST',
    body: JSON.stringify({ fileName })
  });
  clearEditor();
  await loadInbox();
  showToast(`已归档为 ${result.archivedName}`);
}

async function prepare(mode) {
  await saveCurrent();
  const validation = await requestJson('/api/validate', {
    method: 'POST',
    body: JSON.stringify({ fileName: state.selectedFileName })
  });
  renderValidation(validation);
  if (!validation.valid) {
    throw new Error('当前操作单存在校验错误，请先修复再生成 request');
  }
  const result = await requestJson('/api/prepare', {
    method: 'POST',
    body: JSON.stringify({ fileName: state.selectedFileName, mode })
  });

  elements.promptOutput.value = result.internalPrompt;
  elements.requestMeta.textContent = [
    `mode: ${result.mode}`,
    `request: ${result.requestPath}`,
    `latest request: ${result.latestRequestPath}`,
    `latest prompt: ${result.latestPromptPath}`,
    '',
    '下一步建议：',
    '1. 在 Copilot 中直接输入：发布',
    '2. 让 Copilot 读取 latest-request.json',
    '3. 先确认 tags，再预览或正式发布'
  ].join('\n');
  renderInference(result);
  await loadPendingRequests();
  showToast(mode === 'preview' ? '已生成预览 request' : '已生成发布 request');
}

async function validateCurrent() {
  await saveCurrent();
  const result = await requestJson('/api/validate', {
    method: 'POST',
    body: JSON.stringify({ fileName: state.selectedFileName })
  });
  renderValidation(result);
  showToast(result.valid ? '校验通过' : '发现需要修正的问题', result.valid ? 'info' : 'error');
}

async function loadPendingRequests() {
  const { requests } = await requestJson('/api/pending');
  renderPendingRequests(requests);
}

function createNewDraft() {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
  state.selectedFileName = '';
  elements.fileNameInput.value = `draft-${stamp}.md`;
  elements.contentInput.value = `---\naction: auto\nkind: auto\ntarget: auto\n---\n\n在这里写你的发布意图。\n例如：\n把下面 3 个内容点整理成一期 issue，并在第二个 capsule 后加一句短评。`;
  elements.promptOutput.value = '';
  elements.requestMeta.textContent = '保存后即可生成 request';
  renderInference({
    fileName: elements.fileNameInput.value,
    action: 'auto',
    kind: 'auto',
    target: 'auto',
    title: '新操作单',
    summary: '保存后自动推断'
  });
  renderDraftList();
}

function createTypedDraft(kind) {
  createNewDraft();
  normalizeFrontmatter(kind);
  if (kind === 'capsule') {
    elements.contentInput.value = `---\naction: create\nkind: capsule\ntarget: auto\n---\n\n我想发布一个 capsule。\n\n标题候选：\n内容来源：\n我的短评：`;
  }
  if (kind === 'issue') {
    elements.contentInput.value = `---\naction: create\nkind: issue\ntarget: auto\n---\n\n我想发布一期 issue。\n\n这期包含以下内容点：\n1. \n2. \n3. \n\n希望插入的 note：`;
  }
  showToast(`已创建 ${kind} 草稿模板`);
}

async function bootstrap() {
  try {
    const data = await requestJson('/api/data-source');
    state.dataSource = data;
    renderDataOverview(data);
    renderLibraries();
    await loadPendingRequests();
    await loadInbox();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

elements.refreshButton.addEventListener('click', () => bootstrap().catch((error) => showToast(error.message, 'error')));
elements.newDraftButton.addEventListener('click', createNewDraft);
elements.newCapsuleDraftButton.addEventListener('click', () => createTypedDraft('capsule'));
elements.newIssueDraftButton.addEventListener('click', () => createTypedDraft('issue'));
elements.normalizeFrontmatterButton.addEventListener('click', () => normalizeFrontmatter());
elements.saveButton.addEventListener('click', () => saveCurrent().catch((error) => showToast(error.message, 'error')));
elements.deleteButton.addEventListener('click', () => deleteCurrent().catch((error) => showToast(error.message, 'error')));
elements.archiveButton.addEventListener('click', () => archiveCurrent().catch((error) => showToast(error.message, 'error')));
elements.validateButton.addEventListener('click', () => validateCurrent().catch((error) => showToast(error.message, 'error')));
elements.preparePublishButton.addEventListener('click', () => prepare('publish').catch((error) => showToast(error.message, 'error')));
elements.preparePreviewButton.addEventListener('click', () => prepare('preview').catch((error) => showToast(error.message, 'error')));

bootstrap();
