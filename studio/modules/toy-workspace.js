import {
  escapeHtml,
  formatFlowTime,
  parseTagList,
  renderTextContent
} from './content-utils.js';

function normalizeToyEntry(entry = '') {
  const value = String(entry || '').trim();
  if (!value || /^https?:\/\//i.test(value)) {
    return value;
  }
  return `/${value.replace(/^\/+/, '')}`;
}

export function createToyWorkspace(deps) {
  const {
    state,
    elements,
    renderModeNavigation,
    renderTagSidebar,
    renderPagination,
    renderStatusPill,
    renderDraftPublishTools,
    saveTask,
    deleteDraft,
    getConfig,
    buildItems,
    getTagCounts,
    showToast,
    paginate,
    autoResizeTextarea
  } = deps;

  function renderPreviewMarkup(block) {
    const entry = normalizeToyEntry(block.entry);
    if (!entry) {
      return '<div class="toy-block-preview empty"><div class="toy-frame-wrap"><div class="image-placeholder">Toy 入口未填写</div></div></div>';
    }
    return `
      <div class="toy-block-preview">
        <div class="toy-frame-wrap" style="aspect-ratio: ${escapeHtml(block.aspectRatio || '16 / 9')}">
          ${block.allowFullscreen !== false ? `<a class="toy-fullscreen-link" href="${escapeHtml(entry)}" target="_blank" rel="noreferrer noopener" aria-label="全屏打开 Toy">全屏打开</a>` : ''}
          <iframe
            class="toy-frame"
            src="${escapeHtml(entry)}"
            title="${escapeHtml(block.title || 'Toy')}"
            loading="lazy"
            allow="fullscreen"
            sandbox="allow-scripts allow-pointer-lock allow-popups"
          ></iframe>
        </div>
      </div>
    `;
  }

  function renderEditorForm(item = null) {
    const config = getConfig('toy');
    const key = item?.key || 'composer';
    const tags = (item?.tags || []).join(', ');
    return `
      <div class="plain-editor-grid" data-plain-editor-kind="toy" data-key="${escapeHtml(key)}">
        <label>
          <span>标题</span>
          <input data-field="title" type="text" value="${escapeHtml(item?.title || '')}" placeholder="输入 ${escapeHtml(config.title)} 标题" />
        </label>
        <label>
          <span>入口 HTML</span>
          <input data-field="entry" type="text" value="${escapeHtml(item?.entry || '')}" placeholder="/toys/demo/index.html" />
        </label>
        <label>
          <span>显示比例</span>
          <input data-field="aspectRatio" type="text" value="${escapeHtml(item?.aspectRatio || '16 / 9')}" placeholder="16 / 9" />
        </label>
        <label class="plain-editor-wide">
          <span>${escapeHtml(config.primaryFieldLabel)}</span>
          <textarea data-field="body" rows="5" placeholder="${escapeHtml(config.primaryFieldPlaceholder)}">${escapeHtml(item?.body || '')}</textarea>
        </label>
        <label class="plain-editor-wide">
          <span>Tags</span>
          <input data-field="tags" type="text" value="${escapeHtml(tags)}" placeholder="TagA, TagB" />
        </label>
        ${item?.entry ? `<div class="plain-editor-wide">${renderPreviewMarkup(item)}</div>` : ''}
      </div>
    `;
  }

  function renderCard(item) {
    const config = getConfig('toy');
    const editing = Boolean(state.ui.toy?.editing?.[item.key]);
    const tags = item.tags || [];
    return `
      <article class="${config.cardClass} ${item.status} ${editing ? 'editing' : ''}">
        <div class="item-head">
          <div class="item-main">
            <button class="item-title-trigger" data-action="plain-edit" data-kind="toy" data-key="${escapeHtml(item.key)}" type="button">${renderTextContent(item.title || `未命名 ${config.title}`)}</button>
            <div class="item-meta">
              <span class="hint item-timestamp">${formatFlowTime(item)}</span>
            </div>
          </div>
          <div class="item-side item-side-compact">
            <div class="card-status">${renderStatusPill(item.status)}</div>
          </div>
        </div>
        ${editing ? `
          ${renderEditorForm(item)}
          <div class="editor-actions">
            <button data-action="plain-save-edit" data-kind="toy" data-key="${escapeHtml(item.key)}">保存</button>
            <button class="ghost" data-action="plain-cancel-edit" data-kind="toy" data-key="${escapeHtml(item.key)}">取消</button>
          </div>
        ` : `
          ${item.entry ? renderPreviewMarkup(item) : ''}
          ${item.summary ? `<div class="issue-summary">${renderTextContent(item.summary)}</div>` : ''}
          <div class="card-bottom-row">
            <div class="item-tags">${tags.map((tag) => `<button class="tag-chip ${(state.ui.toy?.activeTags || []).some((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase()) ? 'active' : ''}" data-action="plain-filter-tag" data-kind="toy" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join('')}</div>
            <div class="card-tools">
              ${renderDraftPublishTools(item)}
              ${item.status !== 'pendingDelete' ? `<button class="ghost small icon-button compact-tool" data-action="plain-edit" data-kind="toy" data-key="${escapeHtml(item.key)}" aria-label="编辑 ${escapeHtml(config.title)}">✎</button>` : ''}
              <button class="ghost small icon-button compact-tool danger" data-action="plain-delete" data-kind="toy" data-key="${escapeHtml(item.key)}" aria-label="删除 ${escapeHtml(config.title)}">${item.status === 'pendingDelete' ? '↺' : '🗑'}</button>
            </div>
          </div>
        `}
      </article>
    `;
  }

  function renderWorkspace() {
    const config = getConfig('toy');
    renderModeNavigation();
    const items = buildItems();
    const { currentPage, totalPages, entries } = paginate(items, state.ui.toy.page);
    state.ui.toy.page = currentPage;
    const selectedTags = state.ui.toy.activeTags || [];

    elements.modeSubtitle.textContent = '';
    elements.modePrimary.innerHTML = `
      <section class="card ${config.cardClass} section-card">
        <div class="section-head">
          <h2>${escapeHtml(config.composerTitle)}</h2>
        </div>
        ${renderEditorForm()}
        <div class="composer-actions">
          <button data-action="plain-save" data-kind="toy">${escapeHtml(config.saveLabel)}</button>
        </div>
      </section>
    `;
    elements.modeSecondary.innerHTML = `
      <section class="card section-card">
        <div class="toy-list">
          ${entries.length ? entries.map(renderCard).join('') : `<div class="empty-card"><h3>还没有 ${escapeHtml(config.title)}</h3><p class="hint">上面保存后会出现在这里。</p></div>`}
        </div>
        ${renderPagination(currentPage, totalPages, 'plain-page')}
      </section>
    `;
    elements.modeSecondary.querySelectorAll('[data-action="plain-page"]').forEach((button) => {
      button.dataset.kind = 'toy';
    });
    elements.modeSide.innerHTML = renderTagSidebar({
      selectedTags,
      tagCounts: getTagCounts('toy'),
      filterAction: 'plain-filter-tag',
      clearAction: 'plain-clear-tags',
      searchInputId: 'toySearchInput',
      searchPlaceholder: config.searchPlaceholder,
      searchValue: state.ui.toy.search
    });
    elements.modeSide.querySelectorAll('[data-action="plain-filter-tag"], [data-action="plain-clear-tags"]').forEach((item) => {
      item.dataset.kind = 'toy';
    });
    requestAnimationFrame(() => {
      document.querySelectorAll('[data-plain-editor-kind="toy"] textarea').forEach((textarea) => autoResizeTextarea(textarea, 88));
    });
  }

  function getEditorElement(key = 'composer') {
    return [...document.querySelectorAll('[data-plain-editor-kind="toy"]')]
      .find((item) => item.dataset.key === key);
  }

  function readEditorValues(key = 'composer') {
    const editor = getEditorElement(key);
    if (!editor) {
      return null;
    }
    const valueOf = (field) => editor.querySelector(`[data-field="${field}"]`)?.value || '';
    return {
      title: valueOf('title').trim(),
      body: valueOf('body').trim(),
      entry: valueOf('entry').trim(),
      aspectRatio: valueOf('aspectRatio').trim() || '16 / 9',
      tags: parseTagList(valueOf('tags'))
    };
  }

  function getItemByKey(key) {
    return buildItems().find((item) => item.key === key);
  }

  function createExtraFrontmatter(values) {
    return {
      summary: values.body || undefined,
      entry: values.entry || undefined,
      aspectRatio: values.aspectRatio || '16 / 9',
      allowFullscreen: 'true'
    };
  }

  async function saveFromComposer() {
    const config = getConfig('toy');
    const values = readEditorValues();
    if (!values || !values.title) {
      showToast(`先填写 ${config.title} 标题。`, 'error');
      return;
    }
    if (!values.entry) {
      showToast('Toy 需要填写入口 HTML。', 'error');
      return;
    }
    await saveTask({
      kind: 'toy',
      action: 'create',
      target: 'auto',
      title: values.title,
      body: values.body,
      tags: values.tags,
      extraFrontmatter: createExtraFrontmatter(values)
    });
    renderWorkspace();
    showToast(`已加入待发布 ${config.title}`);
  }

  async function saveCard(key) {
    const config = getConfig('toy');
    const item = getItemByKey(key);
    const values = readEditorValues(key);
    if (!item || !values || !values.title) {
      showToast('内容不完整，无法保存。', 'error');
      return;
    }
    if (!values.entry) {
      showToast('Toy 需要填写入口 HTML。', 'error');
      return;
    }
    await saveTask({
      kind: 'toy',
      action: item.status === 'pendingPublish' ? 'create' : 'update',
      target: item.status === 'pendingPublish' ? 'auto' : item.id,
      title: values.title,
      body: values.body,
      fileName: item.fileName || `update-${item.id}.md`,
      tags: values.tags,
      createdAt: item.createdAt,
      extraFrontmatter: createExtraFrontmatter(values)
    });
    delete state.ui.toy.editing[key];
    renderWorkspace();
    showToast(`已保存 ${config.title}`);
  }

  async function deleteItem(key) {
    const config = getConfig('toy');
    const item = getItemByKey(key);
    if (!item) {
      return;
    }
    if (item.status === 'pendingPublish' && item.fileName) {
      await deleteDraft(item.fileName);
      delete state.ui.toy.editing[key];
      renderWorkspace();
      showToast(`已删除待发布 ${config.title}`);
      return;
    }
    if (item.status === 'pendingDelete' && item.fileName) {
      await deleteDraft(item.fileName);
      delete state.ui.toy.editing[key];
      renderWorkspace();
      showToast('已取消删除任务');
      return;
    }
    await saveTask({
      kind: 'toy',
      action: 'delete',
      target: item.id,
      title: item.title,
      body: `删除 ${config.title}：${item.id}`,
      fileName: item.fileName || `delete-${item.id}.md`,
      createdAt: item.createdAt
    });
    delete state.ui.toy.editing[key];
    renderWorkspace();
    showToast(`已标记为待删除 ${config.title}`);
  }

  return {
    deleteItem,
    getEditorElement,
    getItemByKey,
    readEditorValues,
    renderCard,
    renderEditorForm,
    renderPreviewMarkup,
    renderWorkspace,
    saveCard,
    saveFromComposer
  };
}
