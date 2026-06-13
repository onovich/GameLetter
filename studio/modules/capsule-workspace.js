import { escapeHtml, formatFlowTime, renderTextContent } from './content-utils.js';

export function createCapsuleWorkspace(deps) {
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
    collectImageBlockInput,
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
    createTextBlock,
    createImageBlock,
    createLinkBlock,
    canInsertBetweenBlocks,
    capsuleNeedsCollapse,
    getPreviewTextFromBlocks,
    getSuggestion,
    hideSuggestion,
    showToast,
    paginate,
    autoResizeTextarea
  } = deps;

  function getEditorBlocks(owner) {
    if (owner === 'composer') {
      if (!state.ui.capsule.composerBlocks.length) {
        state.ui.capsule.composerBlocks = [createTextBlock('')];
      }
      return state.ui.capsule.composerBlocks;
    }
    if (!state.ui.capsule.editBlocks[owner]) {
      const item = getItemByKey(owner);
      state.ui.capsule.editBlocks[owner] = getBlocksForEditing(item);
    }
    return state.ui.capsule.editBlocks[owner];
  }

  function setEditorBlocks(owner, blocks) {
    const safeBlocks = blocks.length ? blocks : [createTextBlock('')];
    if (owner === 'composer') {
      state.ui.capsule.composerBlocks = safeBlocks;
      return;
    }
    state.ui.capsule.editBlocks[owner] = safeBlocks;
  }

  function findBlock(owner, blockId) {
    return getEditorBlocks(owner).find((block) => block.id === blockId);
  }

  function syncTextBlock(owner, blockId, text) {
    const block = findBlock(owner, blockId);
    if (block) {
      block.text = text;
    }
  }

  function syncImageBlock(owner, blockId, field, value) {
    const block = findBlock(owner, blockId);
    if (block && block.type === 'image') {
      block[field] = value;
    }
  }

  function updateImage(owner, blockId) {
    const block = findBlock(owner, blockId);
    if (!block || block.type !== 'image') {
      return;
    }
    collectImageBlockInput({ url: block.url || '', caption: block.caption || '' }).then((image) => {
      if (!image) {
        return;
      }
      block.url = image.url;
      block.caption = image.caption;
      renderWorkspace();
    });
  }

  function updateLink(owner, blockId) {
    const block = findBlock(owner, blockId);
    if (!block || block.type !== 'link') {
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

  function setSelectedImage(owner, blockId) {
    const nextValue = `${owner}:${blockId}`;
    state.ui.capsule.selectedImageTarget = state.ui.capsule.selectedImageTarget === nextValue ? '' : nextValue;
    renderWorkspace();
  }

  function addTextBlock(owner) {
    const block = createTextBlock('');
    setEditorBlocks(owner, [...getEditorBlocks(owner), block]);
    state.ui.capsule.focusTarget = `${owner}:${block.id}`;
    renderWorkspace();
  }

  function insertTextBlock(owner, index) {
    const blocks = [...getEditorBlocks(owner)];
    if (!canInsertBetweenBlocks(blocks, index)) {
      showToast('两个空白 block 之间不能继续新增。', 'error');
      return;
    }
    const block = createTextBlock('');
    blocks.splice(index, 0, block);
    setEditorBlocks(owner, blocks);
    state.ui.capsule.focusTarget = `${owner}:${block.id}`;
    renderWorkspace();
  }

  function addImageBlock(owner) {
    const block = createImageBlock('', '');
    setEditorBlocks(owner, [...getEditorBlocks(owner), block]);
    renderWorkspace();
  }

  function removeBlock(owner, blockId) {
    setEditorBlocks(owner, getEditorBlocks(owner).filter((block) => block.id !== blockId));
    if (state.ui.capsule.selectedImageTarget === `${owner}:${blockId}`) {
      state.ui.capsule.selectedImageTarget = '';
    }
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

  function renderComposerTagPreview() {
    const container = document.getElementById('capsuleTagPreview');
    if (!container) {
      return;
    }
    const tags = extractTagsFromBlocks(getEditorBlocks('composer'));
    container.innerHTML = tags.map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('');
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
    delete state.ui.capsule.editing[key];
    delete state.ui.capsule.editBlocks[key];
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
    state.ui.capsule.focusTarget = `${owner}:${blockId}`;
    renderWorkspace();
    return true;
  }

  async function insertImageFromCommand(owner, blockId) {
    const suggestionSnapshot = { ...getSuggestion() };
    const image = await collectImageBlockInput();
    if (!image?.url) {
      hideSuggestion();
      return;
    }
    const blocks = [...getEditorBlocks(owner)];
    const index = blocks.findIndex((block) => block.id === blockId);
    if (index === -1) {
      hideSuggestion();
      return;
    }

    const textBlock = blocks[index];
    const cleanedText = `${textBlock.text.slice(0, suggestionSnapshot.start)}${textBlock.text.slice(suggestionSnapshot.end)}`.trim();
    const nextBlocks = [];
    blocks.forEach((block, blockIndex) => {
      if (blockIndex !== index) {
        nextBlocks.push(block);
        return;
      }

      if (cleanedText) {
        nextBlocks.push({ ...block, text: cleanedText });
      }
      nextBlocks.push(createImageBlock(image.url, image.caption));
      const trailingTextBlock = createTextBlock('');
      nextBlocks.push(trailingTextBlock);
      state.ui.capsule.focusTarget = `${owner}:${trailingTextBlock.id}`;
    });

    setEditorBlocks(owner, nextBlocks);
    renderWorkspace();
    hideSuggestion();
  }

  async function insertLinkFromCommand(owner, blockId) {
    const suggestionSnapshot = { ...getSuggestion() };
    const link = await collectLinkBlockInput();
    if (!link) {
      hideSuggestion();
      return;
    }
    const blocks = [...getEditorBlocks(owner)];
    const index = blocks.findIndex((block) => block.id === blockId);
    if (index === -1) {
      hideSuggestion();
      return;
    }

    const textBlock = blocks[index];
    const cleanedText = `${textBlock.text.slice(0, suggestionSnapshot.start)}${textBlock.text.slice(suggestionSnapshot.end)}`.trim();
    const nextBlocks = [];
    blocks.forEach((block, blockIndex) => {
      if (blockIndex !== index) {
        nextBlocks.push(block);
        return;
      }
      if (cleanedText) {
        nextBlocks.push({ ...block, text: cleanedText });
      }
      nextBlocks.push(createLinkBlock(link.text || link.url, link.url));
      const trailingTextBlock = createTextBlock('');
      nextBlocks.push(trailingTextBlock);
      state.ui.capsule.focusTarget = `${owner}:${trailingTextBlock.id}`;
    });

    setEditorBlocks(owner, nextBlocks);
    renderWorkspace();
    hideSuggestion();
  }

  function renderDisplayBlocks(blocks, expanded = false) {
    return blocks.map((block) => {
      if (block.type === 'image') {
        return renderImagePreviewMarkup(block);
      }
      if (block.type === 'link') {
        return renderLinkPreviewMarkup(block);
      }
      const collapsed = capsuleNeedsCollapse(block.text) && !expanded;
      return `<div class="capsule-content ${collapsed ? 'collapsed' : ''}">${renderTextContent(block.text || '')}</div>`;
    }).join('');
  }

  function renderPreviewBlocks(blocks = [], fallbackText = '') {
    const previewBlocks = [];
    const firstMedia = blocks.find((block) => block.type === 'image' || block.type === 'link');
    const firstText = blocks.find((block) => block.type === 'text' && String(block.text || '').trim());

    if (firstMedia) {
      if (firstMedia.type === 'image') {
        previewBlocks.push(renderImagePreviewMarkup(firstMedia));
      } else {
        previewBlocks.push(renderLinkPreviewMarkup(firstMedia));
      }
    }

    if (firstText) {
      previewBlocks.push(`<div class="capsule-content collapsed">${renderTextContent(firstText.text || '')}</div>`);
    } else if (String(fallbackText || '').trim()) {
      previewBlocks.push(`<div class="capsule-content collapsed">${renderTextContent(fallbackText)}</div>`);
    }

    if (!previewBlocks.length) {
      previewBlocks.push('<div class="capsule-content collapsed">暂无正文</div>');
    }

    return previewBlocks.join('');
  }

  function getPreviewText(blocks = [], fallbackText = '') {
    return getPreviewTextFromBlocks(blocks, fallbackText);
  }

  function renderEditorBlocks(owner, blocks) {
    return blocks.map((block, index) => {
      const dropZone = `<button class="block-insert-anchor" data-action="capsule-insert-text" data-index="${index}" data-owner="${owner}" data-drop-index="${index}" data-drop-context="capsule" data-drop-owner="${owner}" aria-label="在这里插入内容"></button>`;
      if (block.type === 'image') {
        return `
          ${dropZone}
          <div class="capsule-block image-block draggable" draggable="true" data-drag-block-id="${block.id}" data-drag-context="capsule" data-drag-owner="${owner}">
            ${renderImagePreviewMarkup(block, { removable: true })}
            <div class="image-inline-actions">
              ${block.url ? `<button class="ghost small" data-action="image-open-lightbox" data-url="${escapeHtml(block.url || '')}" data-caption="${escapeHtml(block.caption || '')}">查看</button>` : ''}
              <button class="ghost small" data-action="capsule-edit-image" data-owner="${owner}" data-block-id="${block.id}">编辑</button>
              <button class="ghost small danger" data-action="capsule-remove-block" data-owner="${owner}" data-block-id="${block.id}">删除</button>
            </div>
          </div>
        `;
      }
      if (block.type === 'link') {
        return `
          ${dropZone}
          <div class="capsule-block link-block draggable" draggable="true" data-drag-block-id="${block.id}" data-drag-context="capsule" data-drag-owner="${owner}">
            ${renderLinkPreviewMarkup(block, { editable: true, owner, blockId: block.id, editAction: 'capsule-edit-link' })}
            <div class="image-inline-actions">
              ${block.url ? `<a class="ghost small" href="${escapeHtml(block.url || '')}" target="_blank" rel="noreferrer noopener">打开</a>` : ''}
              <button class="ghost small" data-action="capsule-edit-link" data-owner="${owner}" data-block-id="${block.id}">编辑</button>
              <button class="ghost small danger" data-action="capsule-remove-block" data-owner="${owner}" data-block-id="${block.id}">删除</button>
            </div>
          </div>
        `;
      }
      return `
        ${dropZone}
        <div class="capsule-block text-block-row">
          <div class="text-shell compact">
            <textarea class="capsule-card-editor" data-capsule-text-target="${owner}:${block.id}" placeholder="${index === 0 ? '写点内容，输入 / 可插入图片和链接，输入 # 可以补标签' : ''}">${escapeHtml(block.text || '')}</textarea>
          </div>
        </div>
      `;
    }).join('') + `<button class="block-insert-anchor" data-action="capsule-insert-text" data-index="${blocks.length}" data-owner="${owner}" data-drop-index="${blocks.length}" data-drop-context="capsule" data-drop-owner="${owner}" aria-label="在这里插入内容"></button>`;
  }

  function renderCard(item) {
    const expanded = Boolean(state.ui.capsule.expanded[item.key]);
    const editing = Boolean(state.ui.capsule.editing[item.key]);
    const blocks = editing ? getEditorBlocks(item.key) : item.blocks;
    const tags = editing ? extractTagsFromBlocks(blocks) : (item.tags || []);
    const previewText = editing ? '' : getPreviewText(blocks, item.text);
    return `
      <article class="capsule-card ${item.status}">
        <div class="item-head">
          <div class="item-main item-main-compact">
            <div class="item-meta">
              <span class="hint item-timestamp">${formatFlowTime(item)}</span>
            </div>
          </div>
          <div class="item-side item-side-compact">
            <div class="card-status">${renderStatusPill(item.status)}</div>
          </div>
        </div>
        ${editing ? `
          <div class="capsule-block-list">
            ${renderEditorBlocks(item.key, blocks)}
          </div>
          <div class="card-bottom-row">
            <div class="item-tags">${tags.map((tag) => `<button class="tag-chip" data-action="capsule-filter-tag" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join('')}</div>
          </div>
          <div class="editor-actions">
            <button data-action="capsule-save-edit" data-key="${item.key}">保存</button>
            <button class="ghost" data-action="capsule-cancel-edit" data-key="${item.key}">取消</button>
          </div>
        ` : `
          ${previewText ? `<div class="capsule-preview-body collapsed">${renderTextContent(previewText)}</div>` : ''}
          <div class="capsule-render-stack">${expanded ? renderDisplayBlocks(blocks, true) : renderPreviewBlocks(blocks, item.text)}</div>
          <div class="card-bottom-row">
            <div class="item-tags">${tags.map((tag) => `<button class="tag-chip ${state.ui.capsule.activeTags.some((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase()) ? 'active' : ''}" data-action="capsule-filter-tag" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join('')}</div>
            <div class="card-tools">
              ${renderDraftPublishTools(item)}
              ${blocks.some((block) => block.type === 'text' && capsuleNeedsCollapse(block.text || '')) ? `<button class="ghost small compact-tool" data-action="capsule-toggle-expand" data-key="${item.key}">${expanded ? '收起' : '展开'}</button>` : ''}
              ${item.status !== 'pendingDelete' ? `<button class="ghost small icon-button compact-tool" data-action="capsule-edit" data-key="${item.key}" aria-label="编辑 Capsule">✎</button>` : ''}
              <button class="ghost small icon-button compact-tool danger" data-action="capsule-delete" data-key="${item.key}" aria-label="删除 Capsule">${item.status === 'pendingDelete' ? '↺' : '🗑'}</button>
            </div>
          </div>
        `}
      </article>
    `;
  }

  function renderWorkspace() {
    renderModeNavigation();
    const items = buildItems();
    const { currentPage, totalPages, entries } = paginate(items, state.ui.capsule.page);
    state.ui.capsule.page = currentPage;
    const selectedCapsuleTags = state.ui.capsule.activeTags || [];

    elements.modeSubtitle.textContent = '';
    elements.modePrimary.innerHTML = `
      <section class="card composer-card section-card">
        <div class="capsule-block-list">
          ${renderEditorBlocks('composer', getEditorBlocks('composer'))}
        </div>
        <div id="capsuleTagPreview" class="tag-chips"></div>
        <div class="composer-actions">
          <button id="capsulePublishButton" data-action="capsule-publish">发布</button>
        </div>
      </section>
    `;

    elements.modeSecondary.innerHTML = `
      <section class="card section-card">
        <div class="capsule-list">
          ${entries.length ? entries.map(renderCard).join('') : '<div class="empty-card"><h3>还没有 Capsule</h3><p class="hint">上面写一条内容，点击发布后就会出现在这里。</p></div>'}
        </div>
        ${renderPagination(currentPage, totalPages, 'capsule-page')}
      </section>
    `;

    elements.modeSide.innerHTML = renderTagSidebar({
      selectedTags: selectedCapsuleTags,
      tagCounts: getTagCounts(),
      filterAction: 'capsule-filter-tag',
      clearAction: 'capsule-clear-tags',
      searchInputId: 'capsuleSearchInput',
      searchPlaceholder: '搜索 Capsule',
      searchValue: state.ui.capsule.search
    });
    requestAnimationFrame(() => {
      document.querySelectorAll('[data-capsule-text-target]').forEach((textarea) => autoResizeTextarea(textarea, 44));
      if (state.ui.capsule.focusTarget) {
        const target = document.querySelector(`[data-capsule-text-target="${state.ui.capsule.focusTarget}"]`);
        if (target) {
          target.focus();
        }
        state.ui.capsule.focusTarget = '';
      }
      renderComposerTagPreview();
    });
  }

  async function publishFromComposer() {
    const blocks = getEditorBlocks('composer');
    const body = serializeBlocks(blocks);
    if (!body.trim()) {
      showToast('先写点内容，再发布。', 'error');
      return;
    }
    await saveTask({ kind: 'capsule', action: 'create', target: 'auto', body, tags: extractTagsFromBlocks(blocks) });
    state.ui.capsule.composerBlocks = [createTextBlock('')];
    renderWorkspace();
    showToast('已加入待发布列表');
  }

  async function saveCard(key) {
    const item = getItemByKey(key);
    const blocks = getEditorBlocks(key);
    const body = serializeBlocks(blocks);
    if (!item || !body.trim()) {
      showToast('内容不能为空。', 'error');
      return;
    }
    if (item.status === 'pendingPublish' && item.fileName) {
      await saveTask({ kind: 'capsule', action: 'create', target: 'auto', body, fileName: item.fileName, tags: extractTagsFromBlocks(blocks), createdAt: item.createdAt });
    } else {
      await saveTask({ kind: 'capsule', action: 'update', target: item.id, body, fileName: item.fileName || `update-${item.id}.md`, tags: extractTagsFromBlocks(blocks), createdAt: item.createdAt });
    }
    delete state.ui.capsule.editing[key];
    delete state.ui.capsule.editBlocks[key];
    renderWorkspace();
    showToast('已保存，状态已更新为待刷新');
  }

  async function deleteItem(key) {
    const item = getItemByKey(key);
    if (!item) {
      return;
    }
    if (item.status === 'pendingPublish' && item.fileName) {
      await deleteDraft(item.fileName);
      delete state.ui.capsule.editing[key];
      delete state.ui.capsule.editBlocks[key];
      renderWorkspace();
      showToast('已删除待发布 Capsule');
      return;
    }
    if (item.status === 'pendingDelete' && item.fileName) {
      await deleteDraft(item.fileName);
      renderWorkspace();
      showToast('已取消删除任务');
      return;
    }
    await saveTask({ kind: 'capsule', action: 'delete', target: item.id, body: `删除 Capsule：${item.id}`, fileName: item.fileName || `delete-${item.id}.md`, createdAt: item.createdAt });
    delete state.ui.capsule.editing[key];
    delete state.ui.capsule.editBlocks[key];
    renderWorkspace();
    showToast('已标记为待删除');
  }

  return {
    addImageBlock,
    addTextBlock,
    cancelEditing,
    deleteItem,
    deletePreviousBlock,
    findBlock,
    getBlocksForEditing,
    getEditorBlocks,
    getItemByKey,
    getPreviewText,
    insertImageFromCommand,
    insertLinkFromCommand,
    insertTextBlock,
    moveBlock,
    publishFromComposer,
    removeBlock,
    renderCard,
    renderComposerTagPreview,
    renderDisplayBlocks,
    renderEditorBlocks,
    renderPreviewBlocks,
    renderWorkspace,
    saveCard,
    setEditorBlocks,
    setSelectedImage,
    syncImageBlock,
    syncTextBlock,
    updateImage,
    updateLink
  };
}
