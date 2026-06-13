import { escapeHtml } from './content-utils.js';

const modeColorVarByKey = {
  capsule: ['--capsule-tab-color', '#74a7f7'],
  issue: ['--issue-tab-color', '#86cbbf'],
  flow: ['--flow-tab-color', '#f59e0b'],
  article: ['--article-tab-color', '#8b5cf6'],
  toy: ['--toy-tab-color', '#14b8a6'],
  comments: ['--comments-tab-color', '#64748b']
};

function sortTagCountsWithSelection(tagCounts, selectedTags = []) {
  const selectedSet = new Set(selectedTags.map((tag) => tag.toLowerCase()));
  return [...tagCounts].sort((left, right) => {
    const leftSelected = selectedSet.has(left[0].toLowerCase());
    const rightSelected = selectedSet.has(right[0].toLowerCase());
    if (leftSelected !== rightSelected) {
      return leftSelected ? -1 : 1;
    }
    return right[1] - left[1];
  });
}

export function createNavigation({ elements, editorModes, getMode }) {
  function renderModeNavigation() {
    const activeMode = getMode();
    if (!elements.modeNav.querySelector('.mode-tabs')) {
      elements.modeNav.innerHTML = `
        <nav class="mode-tabs" aria-label="编辑模式切换">
          <span class="mode-tab-indicator" aria-hidden="true"></span>
          ${editorModes.map((mode) => `<button class="mode-tab" type="button" data-mode-tab="${mode.key}">${mode.label}</button>`).join('')}
        </nav>
      `;
    }

    const modeTabs = elements.modeNav.querySelector('.mode-tabs');
    if (!modeTabs) {
      return;
    }
    editorModes.forEach((mode) => {
      modeTabs.classList.toggle(`${mode.key}-active`, activeMode === mode.key);
    });
    const activeModeIndex = Math.max(0, editorModes.findIndex((mode) => mode.key === activeMode));
    modeTabs.style.setProperty('--active-offset', `${activeModeIndex * 60}px`);
    const activeModeColorVar = modeColorVarByKey[activeMode] || modeColorVarByKey.issue;
    modeTabs.style.setProperty('--active-color', `var(${activeModeColorVar[0]}, ${activeModeColorVar[1]})`);
    modeTabs.dataset.mode = activeMode;
    modeTabs.querySelectorAll('[data-mode-tab]').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.modeTab === activeMode);
    });
  }

  function renderTagSidebar({ selectedTags = [], tagCounts = [], filterAction, clearAction, searchInputId, searchPlaceholder, searchValue }) {
    const orderedTagCounts = sortTagCountsWithSelection(tagCounts, selectedTags);
    return `
      <section class="card side-card">
        <input id="${searchInputId}" class="search-input" type="text" placeholder="${escapeHtml(searchPlaceholder)}" value="${escapeHtml(searchValue || '')}" />
        <div class="filter-head ${selectedTags.length ? '' : 'filter-head-compact'}">
          ${selectedTags.length ? `<button class="clear-filter-button" data-action="${clearAction}">清除</button>` : ''}
        </div>
        <div class="tag-sidebar-list">
          ${orderedTagCounts.length ? orderedTagCounts.map(([tag, count]) => `<button class="tag-chip sidebar-tag-chip ${selectedTags.some((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase()) ? 'active' : ''}" data-action="${filterAction}" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)} · ${count}</button>`).join('') : '<p class="hint">还没有标签。</p>'}
        </div>
      </section>
    `;
  }

  return {
    renderModeNavigation,
    renderTagSidebar
  };
}
