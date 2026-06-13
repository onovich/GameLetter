import { escapeHtml, formatFlowTime, renderTextContent } from './content-utils.js';

export function createIssueWorkspace(deps) {
  const {
    state,
    elements,
    renderModeNavigation,
    renderTagSidebar,
    renderPagination,
    renderStatusPill,
    renderDraftPublishTools,
    renderImagePreviewMarkup,
    renderLinkPreviewMarkup,
    collectLinkBlockInput,
    saveTask,
    deleteDraft,
    buildItems,
    getTagCounts,
    getInboxFileByName,
    parseBodyToBlocks,
    serializeBlocks,
    cloneBlocks,
    extractTagsFromBlocks,
    createEmptyEditor,
    createTextBlock,
    createLinkBlock,
    canInsertBetweenBlocks,
    capsuleNeedsCollapse,
    inferTitleFromBlocks,
    getSuggestion,
    hideSuggestion,
    showToast,
    paginate,
    autoResizeTextarea
  } = deps;

  function getEditor() {
    if (!state.ui.issue.editor) {
      state.ui.issue.editor = createEmptyEditor();
    }
    return state.ui.issue.editor;
  }

  function getEditorBlocks(owner = 'composer') {
    if (owner === 'composer') {
      return getEditor().blocks || [createTextBlock('')];
    }
    if (!state.ui.issue.editBlocks[owner]) {
      const item = getItemByKey(owner);
      state.ui.issue.editBlocks[owner] = getBlocksForEditing(item);
    }
    return state.ui.issue.editBlocks[owner];
  }

  function setEditorBlocks(owner = 'composer', blocks = [createTextBlock('')]) {
    const safeBlocks = blocks.length ? blocks : [createTextBlock('')];
    if (owner === 'composer') {
      getEditor().blocks = safeBlocks;
      return;
    }
    state.ui.issue.editBlocks[owner] = safeBlocks;
  }

  function getEditorTitle(owner = 'composer') {
    if (owner === 'composer') {
      return getEditor().title || '';
    }
    return state.ui.issue.editTitles[owner] || '';
  }

  function setEditorTitle(owner = 'composer', title = '') {
    if (owner === 'composer') {
      getEditor().title = title;
      return;
    }
    state.ui.issue.editTitles[owner] = title;
  }

  function getItemByKey(key) {
    return buildItems().find((item) => item.key === key);
  }

  function getBlocksForEditing(item) {
    const draft = item?.fileName ? getInboxFileByName(item.fileName) : null;
    if (draft?.body) {
      return parseBodyToBlocks(draft.body);
    }
    return cloneBlocks(item?.blocks || [createTextBlock('')]);
  }

  function cancelEditing(key) {
    delete state.ui.issue.editing[key];
    delete state.ui.issue.editBlocks[key];
    delete state.ui.issue.editTitles[key];
    renderWorkspace();
  }

  function resetEditor() {
    state.ui.issue.editor = createEmptyEditor();
    renderWorkspace();
  }

  function deletePreviousBlock(owner, blockId) {
    const blocks = [...getEditorBlocks(owner)];
    const index = blocks.findIndex((block) => block.id === blockId);
    if (index <= 0) {
      return false;
    }
    blocks.splice(index - 1, 1);
    setEditorBlocks(owner, blocks);
    state.ui.issue.focusTarget = `${owner}:${blockId}`;
    renderWorkspace();
    return true;
  }

  function removeBlock(owner, blockId) {
    const blocks = getEditorBlocks(owner).filter((block) => block.id !== blockId);
    setEditorBlocks(owner, blocks);
    renderWorkspace();
  }

  function findBlock(owner, blockId) {
    return getEditorBlocks(owner).find((block) => block.id === blockId);
  }

  function updateLink(owner, blockId) {
    const block = findBlock(owner, blockId);
    if (!block) {
      return;
    }
    collectLinkBlockInput({ text: block.text || '', url: block.url || '' }).then((link) => {
      if (!link) {
        return;
      }
      block.text = link.text || link.url;
      block.url = link.url;
      renderWorkspace();
    });
  }

  async function insertLinkFromCommand(owner, blockId) {
    const suggestionSnapshot = { ...getSuggestion() };
    const link = await collectLinkBlockInput();
    if (!link) {
      hideSuggestion();
      return;
    }
    const blocks = [...getEditorBlocks(owner)];
    const blockIndex = blocks.findIndex((block) => block.id === blockId);
    if (blockIndex === -1) {
      hideSuggestion();
      return;
    }

    const textBlock = blocks[blockIndex];
    const cleanedText = `${textBlock.text.slice(0, suggestionSnapshot.start)}${textBlock.text.slice(suggestionSnapshot.end)}`.trim();
    const nextBlocks = [];
    blocks.forEach((block, index) => {
      if (index !== blockIndex) {
        nextBlocks.push(block);
        return;
      }
      if (cleanedText) {
        nextBlocks.push({ ...block, text: cleanedText });
      }
      nextBlocks.push(createLinkBlock(link.text || link.url, link.url));
      const trailingTextBlock = createTextBlock('');
      nextBlocks.push(trailingTextBlock);
      state.ui.issue.focusTarget = `${owner}:${trailingTextBlock.id}`;
    });

    setEditorBlocks(owner, nextBlocks);
    renderWorkspace();
    hideSuggestion();
  }

  function insertBlock(owner, index) {
    const currentBlocks = [...getEditorBlocks(owner)];
    if (!canInsertBetweenBlocks(currentBlocks, index)) {
      showToast('两个空白 block 之间不能继续新增。', 'error');
      return;
    }
    const block = createTextBlock('');
    const blocks = currentBlocks;
    blocks.splice(index, 0, block);
    setEditorBlocks(owner, blocks);
    state.ui.issue.focusTarget = `${owner}:${block.id}`;
    renderWorkspace();
  }

  function moveBlock(owner, blockId, insertIndex) {
    const blocks = [...getEditorBlocks(owner)];
    const currentIndex = blocks.findIndex((block) => block.id === blockId);
    if (currentIndex === -1) {
      return;
    }
    const [movedBlock] = blocks.splice(currentIndex, 1);
    let safeIndex = Math.max(0, Math.min(insertIndex, blocks.length));
    if (currentIndex < insertIndex) {
      safeIndex -= 1;
    }
    blocks.splice(Math.max(0, safeIndex), 0, movedBlock);
    setEditorBlocks(owner, blocks);
    renderWorkspace();
  }

  function syncBlock(owner, blockId, text) {
    const block = getEditorBlocks(owner).find((item) => item.id === blockId);
    if (block) {
      block.text = text;
    }
  }

  function renderComposerTagPreview() {
    const container = document.getElementById('issueTagPreview');
    if (!container) {
      return;
    }
    const tags = extractTagsFromBlocks(getEditorBlocks('composer'));
    container.innerHTML = tags.map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('');
  }

  function renderCapsuleBlock(owner, block, expanded) {
    const contentBlocks = block.blocks?.length ? block.blocks : [createTextBlock(block.text || '')];
    return `
      <article class="capsule-preview-card draggable" draggable="true" data-drag-block-id="${block.id}" data-drag-context="issue" data-drag-owner="${owner}">
        <div class="item-head">
          <div class="item-main item-main-compact">
            <p class="hint">@ 引入的 Capsule block</p>
          </div>
          <div class="card-tools">
            <button class="ghost small" data-action="issue-toggle-capsule" data-block-id="${block.id}">${expanded ? '收起' : '展开'}</button>
            <button class="ghost small icon-button compact-tool danger" data-action="issue-remove-capsule" data-owner="${owner}" data-block-id="${block.id}" aria-label="删除引用">🗑</button>
          </div>
        </div>
        <div class="capsule-render-stack">
          ${contentBlocks.map((contentBlock) => {
            if (contentBlock.type === 'image') {
              return renderImagePreviewMarkup(contentBlock);
            }
            if (contentBlock.type === 'link') {
              return renderLinkPreviewMarkup(contentBlock);
            }
            const collapsed = capsuleNeedsCollapse(contentBlock.text || '') && !expanded;
            return `<div class="capsule-preview-body ${collapsed ? 'collapsed' : ''}">${renderTextContent(contentBlock.text || '')}</div>`;
          }).join('')}
        </div>
        <div class="item-tags">${(block.tags || []).map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('')}</div>
      </article>
    `;
  }

  function renderTitleField(owner, value = '', placeholder = '输入 Issue 标题') {
    return `
      <div class="issue-title-shell">
        <input class="issue-title-input" data-issue-title-target="${owner}" type="text" value="${escapeHtml(value || '')}" placeholder="${escapeHtml(placeholder)}" />
      </div>
    `;
  }

  function renderEditorBlocks(owner, blocks) {
    return blocks
      .map((block, index) => {
        const dropBefore = `<button class="block-insert-anchor" data-action="issue-insert-block" data-owner="${owner}" data-index="${index}" data-drop-index="${index}" data-drop-context="issue" data-drop-owner="${owner}" aria-label="在这里插入内容"></button>`;
        if (block.type === 'text') {
          return `
            ${dropBefore}
            <div class="issue-block text-block-row">
              <div class="text-shell compact">
                <textarea class="issue-text-block" data-issue-text-target="${owner}:${block.id}" rows="1" placeholder="${index === 0 ? '输入这一段内容，按 @ 可以插入 Capsule，按 # 可以补标签' : ''}">${escapeHtml(block.text)}</textarea>
              </div>
            </div>
          `;
        }
        if (block.type === 'image') {
          return `
            ${dropBefore}
            <div class="issue-block image-block draggable" draggable="true" data-drag-block-id="${block.id}" data-drag-context="issue" data-drag-owner="${owner}">
              ${renderImagePreviewMarkup(block, { removable: true })}
              <div class="image-inline-actions">
                ${block.url ? `<button class="ghost small" data-action="image-open-lightbox" data-url="${escapeHtml(block.url || '')}" data-caption="${escapeHtml(block.caption || '')}">查看</button>` : ''}
                <button class="ghost small danger" data-action="issue-remove-block" data-owner="${owner}" data-block-id="${block.id}">删除</button>
              </div>
            </div>
          `;
        }
        if (block.type === 'link') {
          return `
            ${dropBefore}
            <div class="issue-block link-block draggable" draggable="true" data-drag-block-id="${block.id}" data-drag-context="issue" data-drag-owner="${owner}">
              ${renderLinkPreviewMarkup(block, { editable: true, owner, blockId: block.id, editAction: 'issue-edit-link' })}
              <div class="image-inline-actions">
                ${block.url ? `<a class="ghost small" href="${escapeHtml(block.url || '')}" target="_blank" rel="noreferrer noopener">打开</a>` : ''}
                <button class="ghost small" data-action="issue-edit-link" data-owner="${owner}" data-block-id="${block.id}">编辑</button>
                <button class="ghost small danger" data-action="issue-remove-block" data-owner="${owner}" data-block-id="${block.id}">删除</button>
              </div>
            </div>
          `;
        }
        return `${dropBefore}${renderCapsuleBlock(owner, block, Boolean(state.ui.issue.expandedPreview[block.id]))}`;
      })
      .join('') + `<button class="block-insert-anchor" data-action="issue-insert-block" data-owner="${owner}" data-index="${blocks.length}" data-drop-index="${blocks.length}" data-drop-context="issue" data-drop-owner="${owner}" aria-label="在这里插入内容"></button>`;
  }

  function renderCard(item) {
    const editing = Boolean(state.ui.issue.editing[item.key]);
    const blocks = editing ? getEditorBlocks(item.key) : item.blocks;
    const tags = editing ? extractTagsFromBlocks(blocks) : (item.tags || []);
    return `
      <article class="issue-list-item ${item.status} ${editing ? 'editing' : ''}">
        <div class="item-head">
          <div class="item-main">
            ${editing
              ? renderTitleField(item.key, getEditorTitle(item.key), '点击输入标题')
              : `<button class="item-title-trigger" data-action="issue-load" data-key="${item.key}" type="button">${renderTextContent(item.title)}</button>`}
            <div class="item-meta">
              <span class="hint item-timestamp">${formatFlowTime(item)}</span>
            </div>
          </div>
          <div class="item-side">
            <div class="card-status">${renderStatusPill(item.status)}</div>
          </div>
        </div>
        ${editing ? `
          <div class="issue-block-list">
            ${renderEditorBlocks(item.key, blocks)}
          </div>
          <div class="card-bottom-row">
            <div class="item-tags">${tags.map((tag) => `<button class="tag-chip" data-action="issue-filter-tag" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join('')}</div>
          </div>
          <div class="editor-actions">
            <button data-action="issue-save-edit" data-key="${item.key}">保存</button>
            <button class="ghost" data-action="issue-cancel-edit" data-key="${item.key}">取消</button>
          </div>
        ` : `
          ${item.summary ? `<div class="issue-summary">${renderTextContent(item.summary)}</div>` : ''}
          <div class="card-bottom-row">
            <div class="item-tags">${tags.map((tag) => `<button class="tag-chip ${state.ui.issue.activeTags.some((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase()) ? 'active' : ''}" data-action="issue-filter-tag" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join('')}</div>
            <div class="card-tools">
              ${renderDraftPublishTools(item)}
              ${item.status !== 'pendingDelete' ? `<button class="ghost small icon-button compact-tool" data-action="issue-load" data-key="${item.key}" aria-label="编辑 Issue">✎</button>` : ''}
              <button class="ghost small icon-button compact-tool danger" data-action="issue-delete" data-key="${item.key}" aria-label="删除 Issue">${item.status === 'pendingDelete' ? '↺' : '🗑'}</button>
            </div>
          </div>
        `}
      </article>
    `;
  }

  function renderWorkspace() {
    renderModeNavigation();
    const editor = getEditor();
    const blocksHtml = renderEditorBlocks('composer', editor.blocks);
    const items = buildItems();
    const { currentPage, totalPages, entries } = paginate(items, state.ui.issue.page);
    state.ui.issue.page = currentPage;
    const selectedIssueTags = state.ui.issue.activeTags || [];

    elements.modeSubtitle.textContent = '';
    elements.modePrimary.innerHTML = `
      <section class="card issue-editor-card section-card">
        ${renderTitleField('composer', editor.title || '', '输入这一期的标题')}
        <div class="issue-block-list">
          ${blocksHtml}
        </div>
        <div id="issueTagPreview" class="tag-chips"></div>
        <div class="composer-actions">
          <button data-action="issue-save">保存</button>
        </div>
      </section>
    `;

    elements.modeSecondary.innerHTML = `
      <section class="card section-card">
        <div class="issue-list">
          ${entries.length ? entries.map(renderCard).join('') : '<div class="empty-card"><h3>还没有 Issue</h3><p class="hint">开始写一篇内容，保存后就会出现在这里。</p></div>'}
        </div>
        ${renderPagination(currentPage, totalPages, 'issue-page')}
      </section>
    `;
    elements.modeSide.innerHTML = renderTagSidebar({
      selectedTags: selectedIssueTags,
      tagCounts: getTagCounts(),
      filterAction: 'issue-filter-tag',
      clearAction: 'issue-clear-tags',
      searchInputId: 'issueSearchInput',
      searchPlaceholder: '搜索 Issue',
      searchValue: state.ui.issue.search
    });
    requestAnimationFrame(() => {
      document.querySelectorAll('[data-issue-text-target]').forEach((textarea) => autoResizeTextarea(textarea, 44));
      if (state.ui.issue.focusTarget) {
        const target = document.querySelector(`[data-issue-text-target="${state.ui.issue.focusTarget}"]`);
        if (target) {
          target.focus();
        }
        state.ui.issue.focusTarget = '';
      } else {
        const titleInput = document.querySelector('[data-issue-title-target="composer"]');
        if (titleInput && !editor.title) {
          titleInput.focus();
        }
      }
      renderComposerTagPreview();
    });
  }

  async function saveEditor() {
    const editor = getEditor();
    const body = serializeBlocks(editor.blocks);
    if (!body.trim()) {
      showToast('先写一点内容，再保存。', 'error');
      return;
    }
    await saveTask({
      kind: 'issue',
      action: 'create',
      target: 'auto',
      title: String(editor.title || '').trim() || inferTitleFromBlocks(editor.blocks, '未命名 Issue'),
      body,
      fileName: editor.fileName || '',
      tags: extractTagsFromBlocks(editor.blocks),
      createdAt: editor.createdAt || ''
    });
    state.ui.issue.editor = createEmptyEditor();
    renderWorkspace();
    showToast('已加入待发布列表');
  }

  async function saveCard(key) {
    const item = getItemByKey(key);
    const blocks = getEditorBlocks(key);
    const body = serializeBlocks(blocks);
    const title = String(getEditorTitle(key) || '').trim() || inferTitleFromBlocks(blocks, item?.title || '未命名 Issue');
    if (!item || !body.trim()) {
      showToast('内容不能为空。', 'error');
      return;
    }
    if (item.status === 'pendingPublish' && item.fileName) {
      await saveTask({ kind: 'issue', action: 'create', target: 'auto', title, body, fileName: item.fileName, tags: extractTagsFromBlocks(blocks), createdAt: item.createdAt });
    } else {
      await saveTask({ kind: 'issue', action: 'update', target: item.id, title, body, fileName: item.fileName || `update-${item.id}.md`, tags: extractTagsFromBlocks(blocks), createdAt: item.createdAt });
    }
    delete state.ui.issue.editing[key];
    delete state.ui.issue.editBlocks[key];
    delete state.ui.issue.editTitles[key];
    renderWorkspace();
    showToast(item.status === 'pendingPublish' ? '已更新待发布 Issue' : '已保存，状态已更新为待刷新');
  }

  async function deleteItem(key) {
    const item = getItemByKey(key);
    if (!item) {
      return;
    }
    if (item.status === 'pendingPublish' && item.fileName) {
      await deleteDraft(item.fileName);
      delete state.ui.issue.editing[key];
      delete state.ui.issue.editBlocks[key];
      delete state.ui.issue.editTitles[key];
      renderWorkspace();
      showToast('已删除待发布 Issue');
      return;
    }
    if (item.status === 'pendingDelete' && item.fileName) {
      await deleteDraft(item.fileName);
      delete state.ui.issue.editing[key];
      delete state.ui.issue.editBlocks[key];
      delete state.ui.issue.editTitles[key];
      renderWorkspace();
      showToast('已取消删除任务');
      return;
    }
    await saveTask({ kind: 'issue', action: 'delete', target: item.id, body: `删除 Issue：${item.id}`, fileName: item.fileName || `delete-${item.id}.md`, createdAt: item.createdAt });
    delete state.ui.issue.editing[key];
    delete state.ui.issue.editBlocks[key];
    delete state.ui.issue.editTitles[key];
    renderWorkspace();
    showToast('已标记为待删除');
  }

  return {
    cancelEditing,
    deleteItem,
    deletePreviousBlock,
    findBlock,
    getBlocksForEditing,
    getEditorBlocks,
    getEditorTitle,
    getItemByKey,
    insertBlock,
    insertLinkFromCommand,
    moveBlock,
    removeBlock,
    renderCapsuleBlock,
    renderCard,
    renderComposerTagPreview,
    renderEditorBlocks,
    renderTitleField,
    renderWorkspace,
    resetEditor,
    saveCard,
    saveEditor,
    setEditorBlocks,
    setEditorTitle,
    syncBlock,
    updateLink
  };
}
