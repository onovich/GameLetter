const state = {
  files: [],
  selectedFileName: '',
  dirty: false
};

const elements = {
  draftList: document.getElementById('draftList'),
  fileNameInput: document.getElementById('fileNameInput'),
  contentInput: document.getElementById('contentInput'),
  inferencePanel: document.getElementById('inferencePanel'),
  promptOutput: document.getElementById('promptOutput'),
  dataOverview: document.getElementById('dataOverview'),
  requestMeta: document.getElementById('requestMeta'),
  toast: document.getElementById('toast'),
  refreshButton: document.getElementById('refreshButton'),
  newDraftButton: document.getElementById('newDraftButton'),
  saveButton: document.getElementById('saveButton'),
  deleteButton: document.getElementById('deleteButton'),
  preparePublishButton: document.getElementById('preparePublishButton'),
  preparePreviewButton: document.getElementById('preparePreviewButton'),
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
  elements.contentInput.value = '';
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
  showToast(mode === 'preview' ? '已生成预览 request' : '已生成发布 request');
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

async function bootstrap() {
  try {
    const data = await requestJson('/api/data-source');
    renderDataOverview(data);
    await loadInbox();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

elements.refreshButton.addEventListener('click', () => bootstrap().catch((error) => showToast(error.message, 'error')));
elements.newDraftButton.addEventListener('click', createNewDraft);
elements.saveButton.addEventListener('click', () => saveCurrent().catch((error) => showToast(error.message, 'error')));
elements.deleteButton.addEventListener('click', () => deleteCurrent().catch((error) => showToast(error.message, 'error')));
elements.archiveButton.addEventListener('click', () => archiveCurrent().catch((error) => showToast(error.message, 'error')));
elements.preparePublishButton.addEventListener('click', () => prepare('publish').catch((error) => showToast(error.message, 'error')));
elements.preparePreviewButton.addEventListener('click', () => prepare('preview').catch((error) => showToast(error.message, 'error')));

bootstrap();
