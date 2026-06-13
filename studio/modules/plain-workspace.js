import {
  escapeHtml,
  formatFlowTime,
  normalizeLineEndings,
  parseTagList,
  renderTextContent
} from './content-utils.js';

export function createPlainWorkspace(deps) {
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
    getColumnTitle,
    estimateReadingMinutes,
    openToyPickerDialog,
    showToast,
    paginate,
    autoResizeTextarea
  } = deps;

  function renderEditorForm(kind, item = null) {
    const config = getConfig(kind);
    const key = item?.key || 'composer';
    const isArticle = kind === 'article';
    const tags = (item?.tags || []).join(', ');
    const columns = state.dataSource.columns || [];
    return `
      <div class="plain-editor-grid" data-plain-editor-kind="${kind}" data-key="${escapeHtml(key)}">
        <label>
          <span>标题</span>
          <input data-field="title" type="text" value="${escapeHtml(item?.title || '')}" placeholder="输入 ${escapeHtml(config.title)} 标题" />
        </label>
        ${isArticle ? `
          <label>
            <span>栏目</span>
            <select data-field="columnId">
              <option value="">不选择栏目</option>
              ${columns.map((column) => `<option value="${escapeHtml(column.id)}" ${item?.columnId === column.id ? 'selected' : ''}>${escapeHtml(column.title || column.id)}</option>`).join('')}
            </select>
          </label>
          <label>
            <span>摘要</span>
            <input data-field="summary" type="text" value="${escapeHtml(item?.summary || '')}" placeholder="长文摘要" />
          </label>
        ` : ''}
        ${isArticle ? `
          <div class="plain-editor-wide article-editor-tools" aria-label="Article 结构工具">
            <button class="ghost small" type="button" data-action="article-insert-template" data-kind="${kind}" data-key="${escapeHtml(key)}" data-template="heading">小标题</button>
            <button class="ghost small" type="button" data-action="article-insert-template" data-kind="${kind}" data-key="${escapeHtml(key)}" data-template="quote">引文</button>
            <button class="ghost small" type="button" data-action="article-insert-template" data-kind="${kind}" data-key="${escapeHtml(key)}" data-template="capsule">Capsule 引用</button>
            <button class="ghost small" type="button" data-action="article-insert-template" data-kind="${kind}" data-key="${escapeHtml(key)}" data-template="toy">Toy 论据</button>
          </div>
        ` : ''}
        <label class="plain-editor-wide">
          <span>${escapeHtml(config.primaryFieldLabel)}</span>
          <textarea data-field="body" rows="${isArticle ? 10 : 5}" placeholder="${escapeHtml(config.primaryFieldPlaceholder)}">${escapeHtml(item?.body || '')}</textarea>
        </label>
        <label class="plain-editor-wide">
          <span>Tags</span>
          <input data-field="tags" type="text" value="${escapeHtml(tags)}" placeholder="TagA, TagB" />
        </label>
      </div>
    `;
  }

  function renderCard(kind, item) {
    const config = getConfig(kind);
    const editing = Boolean(state.ui[kind]?.editing?.[item.key]);
    const tags = item.tags || [];
    return `
      <article class="${config.cardClass} ${item.status} ${editing ? 'editing' : ''}">
        <div class="item-head">
          <div class="item-main">
            <button class="item-title-trigger" data-action="plain-edit" data-kind="${kind}" data-key="${escapeHtml(item.key)}" type="button">${renderTextContent(item.title || `未命名 ${config.title}`)}</button>
            <div class="item-meta">
              ${kind === 'article' && item.columnId ? `<span class="hint item-timestamp">${renderTextContent(getColumnTitle(item.columnId))}</span>` : ''}
              <span class="hint item-timestamp">${formatFlowTime(item)}</span>
              ${kind === 'article' ? `<span class="hint item-timestamp">约 ${estimateReadingMinutes([item.title, item.summary, item.body].filter(Boolean).join(' '))} 分钟</span>` : ''}
            </div>
          </div>
          <div class="item-side item-side-compact">
            <div class="card-status">${renderStatusPill(item.status)}</div>
          </div>
        </div>
        ${editing ? `
          ${renderEditorForm(kind, item)}
          <div class="editor-actions">
            <button data-action="plain-save-edit" data-kind="${kind}" data-key="${escapeHtml(item.key)}">保存</button>
            <button class="ghost" data-action="plain-cancel-edit" data-kind="${kind}" data-key="${escapeHtml(item.key)}">取消</button>
          </div>
        ` : `
          ${item.summary ? `<div class="issue-summary">${renderTextContent(item.summary)}</div>` : ''}
          ${item.body ? `<div class="flow-body">${normalizeLineEndings(item.body).split(/\n{2,}/).filter(Boolean).slice(0, 3).map((paragraph) => `<p>${renderTextContent(paragraph)}</p>`).join('')}</div>` : ''}
          <div class="card-bottom-row">
            <div class="item-tags">${tags.map((tag) => `<button class="tag-chip ${(state.ui[kind]?.activeTags || []).some((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase()) ? 'active' : ''}" data-action="plain-filter-tag" data-kind="${kind}" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join('')}</div>
            <div class="card-tools">
              ${renderDraftPublishTools(item)}
              ${item.status !== 'pendingDelete' ? `<button class="ghost small icon-button compact-tool" data-action="plain-edit" data-kind="${kind}" data-key="${escapeHtml(item.key)}" aria-label="编辑 ${escapeHtml(config.title)}">✎</button>` : ''}
              <button class="ghost small icon-button compact-tool danger" data-action="plain-delete" data-kind="${kind}" data-key="${escapeHtml(item.key)}" aria-label="删除 ${escapeHtml(config.title)}">${item.status === 'pendingDelete' ? '↺' : '🗑'}</button>
            </div>
          </div>
        `}
      </article>
    `;
  }

  function renderWorkspace(kind) {
    const config = getConfig(kind);
    renderModeNavigation();
    const items = buildItems(kind);
    const { currentPage, totalPages, entries } = paginate(items, state.ui[kind].page);
    state.ui[kind].page = currentPage;
    const selectedTags = state.ui[kind].activeTags || [];

    elements.modeSubtitle.textContent = '';
    elements.modePrimary.innerHTML = `
      <section class="card ${config.cardClass} section-card">
        <div class="section-head">
          <h2>${escapeHtml(config.composerTitle)}</h2>
        </div>
        ${renderEditorForm(kind)}
        <div class="composer-actions">
          <button data-action="plain-save" data-kind="${kind}">${escapeHtml(config.saveLabel)}</button>
        </div>
      </section>
    `;
    elements.modeSecondary.innerHTML = `
      <section class="card section-card">
        <div class="${kind}-list">
          ${entries.length ? entries.map((item) => renderCard(kind, item)).join('') : `<div class="empty-card"><h3>还没有 ${escapeHtml(config.title)}</h3><p class="hint">上面保存后会出现在这里。</p></div>`}
        </div>
        ${renderPagination(currentPage, totalPages, 'plain-page')}
      </section>
    `;
    elements.modeSecondary.querySelectorAll('[data-action="plain-page"]').forEach((button) => {
      button.dataset.kind = kind;
    });
    elements.modeSide.innerHTML = renderTagSidebar({
      selectedTags,
      tagCounts: getTagCounts(kind),
      filterAction: 'plain-filter-tag',
      clearAction: 'plain-clear-tags',
      searchInputId: `${kind}SearchInput`,
      searchPlaceholder: config.searchPlaceholder,
      searchValue: state.ui[kind].search
    });
    elements.modeSide.querySelectorAll('[data-action="plain-filter-tag"], [data-action="plain-clear-tags"]').forEach((item) => {
      item.dataset.kind = kind;
    });
    requestAnimationFrame(() => {
      document.querySelectorAll('[data-plain-editor-kind] textarea').forEach((textarea) => autoResizeTextarea(textarea, 88));
    });
  }

  function getEditorElement(kind, key = 'composer') {
    return [...document.querySelectorAll(`[data-plain-editor-kind="${kind}"]`)]
      .find((item) => item.dataset.key === key);
  }

  function readEditorValues(kind, key = 'composer') {
    const editor = getEditorElement(kind, key);
    if (!editor) {
      return null;
    }
    const valueOf = (field) => editor.querySelector(`[data-field="${field}"]`)?.value || '';
    return {
      title: valueOf('title').trim(),
      body: valueOf('body').trim(),
      summary: valueOf('summary').trim(),
      columnId: valueOf('columnId').trim(),
      tags: parseTagList(valueOf('tags'))
    };
  }

  function getItemByKey(kind, key) {
    return buildItems(kind).find((item) => item.key === key);
  }

  function getArticleTemplateSnippet(template, selectedItem = null) {
    return {
      heading: '## 小标题',
      quote: '> 引文内容',
      capsule: '[引用 Capsule]\ncapsuleId: capsule-',
      toy: `[引用 Toy]\ntoyId: ${selectedItem?.sourceId || selectedItem?.id || 'toy-'}`
    }[template] || '';
  }

  async function insertArticleTemplate(kind, key, template) {
    if (kind !== 'article') {
      return;
    }
    const editor = getEditorElement(kind, key || 'composer');
    const textarea = editor?.querySelector('[data-field="body"]');
    const selectedItem = template === 'toy' ? await openToyPickerDialog() : null;
    if (template === 'toy' && !selectedItem) {
      return;
    }
    const snippet = getArticleTemplateSnippet(template, selectedItem);
    if (!textarea || !snippet) {
      return;
    }

    const value = textarea.value || '';
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? start;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const prefix = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    const suffix = after && !after.startsWith('\n\n') ? (after.startsWith('\n') ? '\n' : '\n\n') : '';
    const insertion = `${prefix}${snippet}${suffix}`;
    textarea.value = `${before}${insertion}${after}`;
    const cursor = before.length + insertion.length;
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
    autoResizeTextarea(textarea, 88);
  }

  function createExtraFrontmatter(kind, values) {
    if (kind === 'article') {
      return {
        summary: values.summary || undefined,
        columnId: values.columnId || undefined
      };
    }
    return {};
  }

  async function saveFromComposer(kind) {
    const config = getConfig(kind);
    const values = readEditorValues(kind);
    if (!values || !values.title) {
      showToast(`先填写 ${config.title} 标题。`, 'error');
      return;
    }
    if (!values.body) {
      showToast('先写一点正文。', 'error');
      return;
    }
    await saveTask({
      kind,
      action: 'create',
      target: 'auto',
      title: values.title,
      body: values.body,
      tags: values.tags,
      extraFrontmatter: createExtraFrontmatter(kind, values)
    });
    renderWorkspace(kind);
    showToast(`已加入待发布 ${config.title}`);
  }

  async function saveCard(kind, key) {
    const config = getConfig(kind);
    const item = getItemByKey(kind, key);
    const values = readEditorValues(kind, key);
    if (!item || !values || !values.title) {
      showToast('内容不完整，无法保存。', 'error');
      return;
    }
    await saveTask({
      kind,
      action: item.status === 'pendingPublish' ? 'create' : 'update',
      target: item.status === 'pendingPublish' ? 'auto' : item.id,
      title: values.title,
      body: values.body,
      fileName: item.fileName || `update-${item.id}.md`,
      tags: values.tags,
      createdAt: item.createdAt,
      extraFrontmatter: createExtraFrontmatter(kind, values)
    });
    delete state.ui[kind].editing[key];
    renderWorkspace(kind);
    showToast(`已保存 ${config.title}`);
  }

  async function deleteItem(kind, key) {
    const config = getConfig(kind);
    const item = getItemByKey(kind, key);
    if (!item) {
      return;
    }
    if (item.status === 'pendingPublish' && item.fileName) {
      await deleteDraft(item.fileName);
      delete state.ui[kind].editing[key];
      renderWorkspace(kind);
      showToast(`已删除待发布 ${config.title}`);
      return;
    }
    if (item.status === 'pendingDelete' && item.fileName) {
      await deleteDraft(item.fileName);
      delete state.ui[kind].editing[key];
      renderWorkspace(kind);
      showToast('已取消删除任务');
      return;
    }
    await saveTask({
      kind,
      action: 'delete',
      target: item.id,
      title: item.title,
      body: `删除 ${config.title}：${item.id}`,
      fileName: item.fileName || `delete-${item.id}.md`,
      createdAt: item.createdAt
    });
    delete state.ui[kind].editing[key];
    renderWorkspace(kind);
    showToast(`已标记为待删除 ${config.title}`);
  }

  return {
    deleteItem,
    getEditorElement,
    getItemByKey,
    insertArticleTemplate,
    readEditorValues,
    renderCard,
    renderEditorForm,
    renderWorkspace,
    saveCard,
    saveFromComposer
  };
}
