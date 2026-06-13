import {
  PAGE_SIZE,
  SETTINGS_STORAGE_KEY,
  SETTINGS_DEFAULT_STORAGE_KEY,
  editorModes,
  defaultSettings,
  settingsSchema
} from './modules/settings.js';
import {
  actionToStatus,
  applyPanguSpacing,
  escapeHtml,
  extractTags,
  getStatusLabel,
  inferTitleFromText,
  normalizeLineEndings,
  parseFrontmatter,
  parseTagList,
  renderTextContent,
  serializeDraft,
  slugifyLabel
} from './modules/content-utils.js';
import { requestJson } from './modules/api-client.js';
import { createCapsuleWorkspace } from './modules/capsule-workspace.js';
import { createCommentsModule } from './modules/comments.js';
import { createIssueWorkspace } from './modules/issue-workspace.js';
import { createNavigation } from './modules/navigation.js';
import { createPlainWorkspace } from './modules/plain-workspace.js';
import { createToast } from './modules/render-utils.js';
import { createInitialState, toggleTagSelection } from './modules/state.js';
import { createToyWorkspace } from './modules/toy-workspace.js';
import {
  capsuleNeedsCollapse as sharedCapsuleNeedsCollapse,
  getCapsuleBlocks as getSharedCapsuleBlocks,
  getCapsulePreviewText as getSharedCapsulePreviewText,
  getCapsuleTextFromBlocks as getSharedCapsuleTextFromBlocks,
  isLikelyImageUrl as sharedIsLikelyImageUrl,
  isLikelyWebUrl as sharedIsLikelyWebUrl,
  parseCapsuleChunkToBlock,
  serializeCapsuleBlocks as serializeSharedCapsuleBlocks
} from '../shared/content-blocks.js';

const elements = {
  appTitle: document.getElementById('appTitle'),
  modeSubtitle: document.getElementById('modeSubtitle'),
  tabCapsule: document.getElementById('tabCapsule'),
  tabIssue: document.getElementById('tabIssue'),
  modeNav: document.getElementById('modeNav'),
  modePrimary: document.getElementById('modePrimary'),
  modeSecondary: document.getElementById('modeSecondary'),
  modeSide: document.getElementById('modeSide'),
  settingsToggle: document.getElementById('settingsToggle'),
  settingsPanel: document.getElementById('settingsPanel'),
  floatingSuggestion: document.getElementById('floatingSuggestion'),
  lightbox: document.getElementById('lightbox'),
  lightboxImage: document.getElementById('lightboxImage'),
  lightboxCaption: document.getElementById('lightboxCaption'),
  lightboxClose: document.getElementById('lightboxClose'),
  commandDialog: document.getElementById('commandDialog'),
  commandDialogTitle: document.getElementById('commandDialogTitle'),
  commandDialogBody: document.getElementById('commandDialogBody'),
  toast: document.getElementById('toast')
};

const showToast = createToast(elements.toast);

const state = createInitialState(loadStoredSettings());

const navigation = createNavigation({
  elements,
  editorModes,
  getMode: () => state.mode
});
const { renderModeNavigation, renderTagSidebar } = navigation;

const commentsModule = createCommentsModule({
  state,
  elements,
  renderModeNavigation,
  requestJson,
  showToast
});

const capsuleWorkspace = createCapsuleWorkspace({
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
  buildItems: buildCapsuleItems,
  getTagCounts,
  getInboxFileByName,
  parseBodyToBlocks: parseCapsuleBodyToBlocks,
  serializeBlocks: serializeCapsuleBlocks,
  cloneBlocks,
  extractTagsFromBlocks: extractCapsuleTagsFromBlocks,
  createTextBlock,
  createImageBlock,
  createLinkBlock,
  canInsertBetweenBlocks,
  capsuleNeedsCollapse,
  getPreviewTextFromBlocks: getSharedCapsulePreviewText,
  getSuggestion: () => state.suggestion,
  hideSuggestion,
  showToast,
  paginate,
  autoResizeTextarea
});

const issueWorkspace = createIssueWorkspace({
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
  buildItems: buildIssueItems,
  getTagCounts: getIssueTagCounts,
  getInboxFileByName,
  parseBodyToBlocks: parseIssueBodyToBlocks,
  serializeBlocks: serializeIssueBlocks,
  cloneBlocks,
  extractTagsFromBlocks: extractIssueTagsFromBlocks,
  createEmptyEditor: createEmptyIssueEditor,
  createTextBlock,
  createLinkBlock,
  canInsertBetweenBlocks,
  capsuleNeedsCollapse,
  inferTitleFromBlocks,
  getSuggestion: () => state.suggestion,
  hideSuggestion,
  showToast,
  paginate,
  autoResizeTextarea
});

const plainWorkspace = createPlainWorkspace({
  state,
  elements,
  renderModeNavigation,
  renderTagSidebar,
  renderPagination,
  renderStatusPill,
  renderDraftPublishTools,
  saveTask,
  deleteDraft,
  getConfig: getPlainModeConfig,
  buildItems: buildPlainModeItems,
  getTagCounts: getModeTagCounts,
  getColumnTitle,
  estimateReadingMinutes,
  openToyPickerDialog,
  showToast,
  paginate,
  autoResizeTextarea
});

const toyWorkspace = createToyWorkspace({
  state,
  elements,
  renderModeNavigation,
  renderTagSidebar,
  renderPagination,
  renderStatusPill,
  renderDraftPublishTools,
  saveTask,
  deleteDraft,
  getConfig: getPlainModeConfig,
  buildItems: buildToyItems,
  getTagCounts: getModeTagCounts,
  showToast,
  paginate,
  autoResizeTextarea
});

let uniqueIdSeed = 0;

function loadStoredDefaultSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_DEFAULT_STORAGE_KEY);
    if (!raw) {
      return { ...defaultSettings };
    }
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSettings };
  }
}

function loadStoredSettings() {
  try {
    const baseline = loadStoredDefaultSettings();
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...baseline };
    }
    return { ...baseline, ...JSON.parse(raw) };
  } catch {
    return { ...loadStoredDefaultSettings() };
  }
}

function persistSettings() {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
  window.localStorage.setItem(SETTINGS_DEFAULT_STORAGE_KEY, JSON.stringify(state.settings));
}

function ensureDefaultSettingsBaseline() {
  try {
    const hasDefault = window.localStorage.getItem(SETTINGS_DEFAULT_STORAGE_KEY);
    if (hasDefault) {
      return;
    }
    const current = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (current) {
      window.localStorage.setItem(SETTINGS_DEFAULT_STORAGE_KEY, current);
    }
  } catch {
    return;
  }
}

function hexToRgba(hex, alpha = 1) {
  const normalized = String(hex || '').replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(110, 145, 190, ${alpha})`;
  }
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function applySettingsTheme() {
  const root = document.documentElement;
  const settings = state.settings;
  const isCapsuleMode = state.mode === 'capsule';
  root.style.setProperty('--bg', settings.bgColor);
  root.style.setProperty('--bg-accent', settings.bgAccentColor);
  root.style.setProperty('--capsule-mode-bg', settings.capsuleModeBgColor);
  root.style.setProperty('--capsule-mode-bg-accent', settings.capsuleModeBgAccentColor);
  root.style.setProperty('--panel', hexToRgba(settings.panelColor, settings.panelOpacity / 100));
  root.style.setProperty('--panel-strong', hexToRgba(settings.panelColor, Math.min((settings.panelOpacity + 12) / 100, 0.98)));
  root.style.setProperty('--border', hexToRgba(settings.cardBorderColor, 0.22));
  root.style.setProperty('--card-border', hexToRgba(settings.cardBorderColor, 0.24));
  root.style.setProperty('--embed-border', hexToRgba(settings.embedBorderColor, 0.28));
  root.style.setProperty('--icon-border', hexToRgba(settings.iconBorderColor, 0.34));
  root.style.setProperty('--search-border', hexToRgba(settings.searchBorderColor, 0.3));
  root.style.setProperty('--clear-filter-border', hexToRgba(settings.clearButtonBorderColor, 0.38));
  root.style.setProperty('--clear-filter-bg', hexToRgba(settings.clearButtonBgColor, 0.9));
  root.style.setProperty('--clear-filter-text', settings.clearButtonTextColor);
  root.style.setProperty('--link-color', settings.linkColor);
  root.style.setProperty('--link-border', hexToRgba(settings.linkBorderColor, 0.46));
  root.style.setProperty('--link-bg', hexToRgba(settings.linkBgColor, 0.94));
  root.style.setProperty('--border-strong', hexToRgba(settings.accentColor, 0.28));
  root.style.setProperty('--accent', settings.accentColor);
  root.style.setProperty('--capsule-tab-color', settings.capsuleTabColor);
  root.style.setProperty('--issue-tab-color', settings.issueTabColor);
  root.style.setProperty('--flow-tab-color', settings.flowTabColor);
  root.style.setProperty('--article-tab-color', settings.articleTabColor);
  root.style.setProperty('--toy-tab-color', settings.toyTabColor);
  root.style.setProperty('--text', settings.textColor);
  root.style.setProperty('--issue-body-color', settings.issueBodyColor);
  root.style.setProperty('--capsule-body-color', settings.capsuleBodyColor);
  root.style.setProperty('--muted', settings.mutedColor);
  root.style.setProperty('--heading', settings.headingColor);
  root.style.setProperty('--theme-transition-duration', `${settings.themeTransitionMs}ms`);
  root.style.setProperty('--shell-padding', `${settings.shellPadding}px`);
  root.style.setProperty('--workspace-gap', `${settings.workspaceGap}px`);
  root.style.setProperty('--card-radius', `${settings.cardRadius}px`);
  root.style.setProperty('--card-padding', `${settings.cardPadding}px`);
  root.style.setProperty('--thumbnail-width', `${settings.thumbnailWidth}px`);
  root.style.setProperty('--app-title-font-size', `${settings.appTitleFontSize}px`);
  root.style.setProperty('--tab-font-size', `${settings.tabFontSize}px`);
  root.style.setProperty('--card-title-font-size', `${settings.cardTitleFontSize}px`);
  root.style.setProperty('--capsule-body-font-size', `${settings.capsuleBodyFontSize}px`);
  root.style.setProperty('--issue-body-font-size', `${settings.issueBodyFontSize}px`);
  root.style.setProperty('--meta-font-size', `${settings.metaFontSize}px`);
  root.style.setProperty('--tag-font-size', `${settings.tagFontSize}px`);
  const activeShadowColor = isCapsuleMode ? settings.capsuleModeShadowColor : settings.shadowColor;
  root.style.setProperty('--shadow', `0 ${settings.shadowY}px ${settings.shadowBlur}px ${hexToRgba(activeShadowColor, settings.shadowOpacity / 100)}`);
  root.style.setProperty('--shadow-soft', `0 ${Math.max(8, Math.round(settings.shadowY * 0.7))}px ${Math.max(18, Math.round(settings.shadowBlur * 0.6))}px ${hexToRgba(activeShadowColor, Math.max(settings.shadowOpacity / 180, 0.06))}`);
  document.body.dataset.mode = state.mode;
  if (elements.appTitle) {
    elements.appTitle.textContent = settings.appTitle;
  }
  if (elements.modeSubtitle) {
    elements.modeSubtitle.textContent = '';
  }
}

function formatSettingValue(control, value) {
  if (control.type !== 'range') {
    return '';
  }
  return `${value}${control.unit || ''}`;
}

function renderSettingsPanel() {
  if (!elements.settingsPanel) {
    return;
  }
  elements.settingsPanel.innerHTML = `
    <div class="settings-panel-head">
      <div>
        <p class="eyebrow">Style Lab</p>
        <h2 class="side-title">样式调参</h2>
      </div>
      <button class="ghost small" data-action="settings-reset" type="button">重置</button>
    </div>
    ${settingsSchema.map((section) => `
      <section class="settings-section-card">
        <div class="settings-group-head">
          <h3>${escapeHtml(section.title)}</h3>
        </div>
        <div class="settings-control-grid ${section.columns === 2 ? 'two-column' : ''}">
          ${section.controls.map((control) => `
            <div class="settings-control ${control.span === 2 ? 'settings-control-wide' : ''}">
              <div class="settings-control-row">
                <label for="setting-${control.key}">${escapeHtml(control.label)}</label>
                ${control.type === 'range' ? `<span class="settings-range-value">${formatSettingValue(control, state.settings[control.key])}</span>` : ''}
              </div>
              <input
                id="setting-${control.key}"
                data-setting-key="${control.key}"
                type="${control.type}"
                ${control.type === 'range' ? `min="${control.min}" max="${control.max}" step="${control.step}"` : ''}
                value="${escapeHtml(String(state.settings[control.key] ?? ''))}"
              />
            </div>
          `).join('')}
        </div>
      </section>
    `).join('')}
  `;
}

function setSettingsPanelOpen(open) {
  state.ui.settingsOpen = open;
  elements.settingsPanel?.classList.toggle('hidden', !open);
  if (elements.settingsToggle) {
    elements.settingsToggle.setAttribute('aria-expanded', String(open));
  }
}

function openLightbox(url, caption = '') {
  if (!url || !elements.lightbox || !elements.lightboxImage) {
    return;
  }
  state.lightbox = { open: true, url, caption };
  elements.lightboxImage.src = url;
  elements.lightboxImage.alt = caption || '图片';
  if (elements.lightboxCaption) {
    elements.lightboxCaption.textContent = applyPanguSpacing(caption || '');
  }
  elements.lightbox.classList.remove('hidden');
  elements.lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  state.lightbox = { open: false, url: '', caption: '' };
  elements.lightbox?.classList.add('hidden');
  elements.lightbox?.setAttribute('aria-hidden', 'true');
  if (elements.lightboxImage) {
    elements.lightboxImage.src = '';
    elements.lightboxImage.alt = '';
  }
  if (elements.lightboxCaption) {
    elements.lightboxCaption.textContent = '';
  }
}

function renderCommandDialog() {
  if (!elements.commandDialog || !elements.commandDialogBody || !elements.commandDialogTitle) {
    return;
  }

  if (!state.commandDialog.open) {
    elements.commandDialog.classList.add('hidden');
    elements.commandDialog.setAttribute('aria-hidden', 'true');
    elements.commandDialogBody.innerHTML = '';
    return;
  }

  elements.commandDialog.classList.remove('hidden');
  elements.commandDialog.setAttribute('aria-hidden', 'false');
  elements.commandDialogTitle.textContent = state.commandDialog.title || '插入内容';

  if (state.commandDialog.variant === 'toy-picker') {
    const query = state.commandDialog.query || '';
    const candidates = getToyCandidates(query);
    elements.commandDialogBody.innerHTML = `
      <div class="action-dialog-field">
        <label for="command-field-toy-query">Toy 名称</label>
        <input id="command-field-toy-query" data-toy-picker-query type="text" value="${escapeHtml(query)}" placeholder="输入名称检索 Toy" />
      </div>
      <div class="toy-picker-list">
        ${candidates.length ? candidates.map((item) => `
          <button class="toy-picker-item ${state.commandDialog.selectedToyId === item.sourceId ? 'active' : ''}" type="button" data-action="toy-picker-select" data-value="${escapeHtml(item.sourceId)}">
            <strong>${escapeHtml(item.title || 'Toy')}</strong>
            <small>${escapeHtml(item.text || item.entry || '')}</small>
          </button>
        `).join('') : '<p class="hint">没有找到匹配的 Toy。</p>'}
      </div>
    `;

    requestAnimationFrame(() => {
      const input = elements.commandDialogBody.querySelector('[data-toy-picker-query]');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
    return;
  }

  if (state.commandDialog.variant === 'publish-preview') {
    const preview = state.commandDialog.preview || {};
    const afterJson = preview.afterItem ? JSON.stringify(preview.afterItem, null, 2) : '';
    const beforeJson = preview.beforeItem ? JSON.stringify(preview.beforeItem, null, 2) : '';
    const statusClass = preview.valid ? 'published' : 'pendingDelete';
    elements.commandDialogBody.innerHTML = `
      <div class="publish-preview">
        <div class="publish-preview-summary">
          <span class="status-pill ${statusClass}">${preview.valid ? '可发布' : '需修正'}</span>
          <strong>${escapeHtml(preview.kind || '')} / ${escapeHtml(preview.action || '')}</strong>
          <span>${escapeHtml(preview.summary?.collection || '')}: ${preview.summary?.beforeCount ?? 0} → ${preview.summary?.afterCount ?? 0}</span>
        </div>
        ${preview.errors?.length ? `<div class="publish-preview-list error"><strong>Errors</strong>${preview.errors.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}</div>` : ''}
        ${preview.warnings?.length ? `<div class="publish-preview-list warning"><strong>Warnings</strong>${preview.warnings.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}</div>` : ''}
        ${preview.infos?.length ? `<div class="publish-preview-list"><strong>Info</strong>${preview.infos.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}</div>` : ''}
        ${beforeJson ? `<label class="publish-preview-json"><span>Before</span><textarea readonly>${escapeHtml(beforeJson)}</textarea></label>` : ''}
        ${afterJson ? `<label class="publish-preview-json"><span>After</span><textarea readonly>${escapeHtml(afterJson)}</textarea></label>` : ''}
        <div class="editor-actions">
          <button type="button" data-action="draft-publish" data-file-name="${escapeHtml(preview.fileName || '')}" ${preview.valid ? '' : 'disabled'}>应用发布</button>
        </div>
      </div>
    `;
    return;
  }

  elements.commandDialogBody.innerHTML = state.commandDialog.fields.map((field) => `
    <div class="action-dialog-field">
      <label for="command-field-${field.key}">${escapeHtml(field.label)}</label>
      <input id="command-field-${field.key}" data-command-field="${field.key}" type="text" value="${escapeHtml(field.value || '')}" placeholder="${escapeHtml(field.placeholder || '')}" />
    </div>
  `).join('');

  requestAnimationFrame(() => {
    elements.commandDialogBody.querySelector('[data-command-field]')?.focus();
  });
}

function openCommandDialog({ title = '插入内容', fields = [] } = {}) {
  return new Promise((resolve) => {
    state.commandDialog = {
      open: true,
      title,
      fields: fields.map((field) => ({ ...field })),
      variant: '',
      query: '',
      selectedToyId: '',
      preview: null,
      resolve
    };
    renderCommandDialog();
  });
}

function openToyPickerDialog(initialQuery = '') {
  return new Promise((resolve) => {
    state.commandDialog = {
      open: true,
      title: '选择 Toy',
      fields: [],
      variant: 'toy-picker',
      query: initialQuery,
      selectedToyId: '',
      preview: null,
      resolve
    };
    renderCommandDialog();
  });
}

function openPublishPreviewDialog(preview) {
  state.commandDialog = {
    open: true,
    title: '发布预览',
    fields: [],
    variant: 'publish-preview',
    query: '',
    selectedToyId: '',
    preview,
    resolve: null
  };
  renderCommandDialog();
}

function closeCommandDialog(result = null) {
  const resolver = state.commandDialog.resolve;
  state.commandDialog = {
    open: false,
    title: '',
    fields: [],
    variant: '',
    query: '',
    selectedToyId: '',
    preview: null,
    resolve: null
  };
  renderCommandDialog();
  if (resolver) {
    resolver(result);
  }
}

function confirmCommandDialog() {
  if (state.commandDialog.variant === 'toy-picker') {
    const candidates = getToyCandidates(state.commandDialog.query || '');
    const selected = candidates.find((item) => item.sourceId === state.commandDialog.selectedToyId) || candidates[0] || null;
    closeCommandDialog(selected);
    return;
  }

  const values = {};
  elements.commandDialogBody?.querySelectorAll('[data-command-field]').forEach((input) => {
    values[input.dataset.commandField] = input.value;
  });
  closeCommandDialog(values);
}

function uid(prefix = 'id') {
  uniqueIdSeed += 1;
  return `${prefix}-${uniqueIdSeed}`;
}

function createTextBlock(text = '') {
  return { id: uid('text'), type: 'text', text };
}

function createImageBlock(url = '', caption = '') {
  return { id: uid('image'), type: 'image', url, caption };
}

function createLinkBlock(text = '', url = '') {
  return { id: uid('link'), type: 'link', text, url };
}

function createToyBlock(toy = {}) {
  return {
    id: uid('toy'),
    type: 'toy',
    toyId: toy.id || toy.toyId || '',
    entry: toy.entry || toy.src || toy.url || '',
    title: toy.title || 'Toy',
    caption: toy.summary || toy.caption || '',
    aspectRatio: toy.aspectRatio || '16 / 9',
    allowFullscreen: toy.allowFullscreen !== false,
    tags: toy.tags || []
  };
}

function createEmptyIssueEditor() {
  return {
    itemKey: 'new',
    fileName: '',
    targetId: 'auto',
    title: '',
    status: 'draft',
    createdAt: '',
    blocks: [createTextBlock('')]
  };
}

function createCapsuleBlock(capsule) {
  const blocks = getPublishedCapsuleBlocks(capsule);
  return {
    id: uid('capsule'),
    type: 'capsule',
    capsuleId: capsule.id,
    title: capsule.title,
    text: getCapsuleTextFromBlocks(blocks),
    blocks,
    tags: capsule.tags || []
  };
}

function toEditorBlock(block) {
  if (!block) {
    return null;
  }
  if (block.id && block.type) {
    return { ...block, tags: [...(block.tags || [])] };
  }
  if (block.type === 'image') {
    return createImageBlock(block.url || '', block.caption || '');
  }
  if (block.type === 'link') {
    return createLinkBlock(block.text || block.title || block.url || '', block.url || '');
  }
  if (block.type === 'toy') {
    return createToyBlock(block);
  }
  return createTextBlock(block.text || block.content || '');
}

function isLikelyImageUrl(url = '') {
  return sharedIsLikelyImageUrl(url);
}

function isLikelyWebUrl(url = '') {
  return sharedIsLikelyWebUrl(url);
}

function getCapsuleTextFromBlocks(blocks = []) {
  return getSharedCapsuleTextFromBlocks(blocks);
}

function extractCapsuleTagsFromBlocks(blocks = []) {
  return extractTags(getCapsuleTextFromBlocks(blocks));
}

function getIssueTextFromBlocks(blocks = []) {
  return blocks
    .filter((block) => ['text', 'link'].includes(block.type))
    .map((block) => (block.type === 'link' ? (block.text || block.url || '') : (block.text || '')))
    .join('\n\n')
    .trim();
}

function extractIssueTagsFromBlocks(blocks = []) {
  return extractTags(getIssueTextFromBlocks(blocks));
}

function isBlankTextBlock(block) {
  return block?.type === 'text' && !String(block.text || '').trim();
}

function canInsertBetweenBlocks(blocks = [], index = 0) {
  if (index <= 0 || index >= blocks.length) {
    return true;
  }
  return !(isBlankTextBlock(blocks[index - 1]) && isBlankTextBlock(blocks[index]));
}

function parseEditorTarget(target = '') {
  const normalized = String(target || '');
  const separatorIndex = normalized.lastIndexOf(':');
  if (separatorIndex === -1) {
    return { owner: normalized, blockId: '' };
  }
  return {
    owner: normalized.slice(0, separatorIndex),
    blockId: normalized.slice(separatorIndex + 1)
  };
}

function parseStructuredFields(lines = []) {
  const fields = {};
  lines.forEach((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      return;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) {
      fields[key] = value;
    }
  });
  return fields;
}

function inferTitleFromBlocks(blocks = [], fallback = '未命名') {
  const candidate = blocks
    .map((block) => {
      if (block.type === 'text') {
        return block.text || '';
      }
      if (block.type === 'image') {
        return block.caption || '';
      }
      if (block.type === 'link') {
        return block.text || block.url || '';
      }
      return block.title || '';
    })
    .find((value) => String(value || '').trim());
  return inferTitleFromText(candidate || '', fallback);
}

function needsDerivedTitle(title = '') {
  const normalized = String(title || '').trim();
  return !normalized || /^\[(图片|链接|引用 Capsule)\]$/u.test(normalized) || isLikelyWebUrl(normalized);
}

function parseChunkToBlock(chunk = '', capsuleMap = new Map()) {
  const normalized = String(chunk || '').trim();
  if (!normalized) {
    return null;
  }

  const lines = normalized.split('\n').map((line) => line.trim());
  const marker = lines[0];
  const fields = parseStructuredFields(lines.slice(1));

  if (marker === '[引用 Capsule]') {
    const capsuleId = String(fields.capsuleId || '').trim();
    if (!capsuleId) {
      return createTextBlock(normalized);
    }
    const capsule = capsuleMap.get(capsuleId);
    return capsule
      ? createCapsuleBlock(capsule)
      : {
          id: uid('capsule'),
          type: 'capsule',
          capsuleId,
          title: 'Capsule已删除',
          text: '',
          tags: []
        };
  }

  return toEditorBlock(parseCapsuleChunkToBlock(normalized));
}

function parseCapsuleBodyToBlocks(body = '') {
  const blocks = normalizeLineEndings(body)
    .split(/\n{2,}/)
    .map((chunk) => parseCapsuleChunkToBlock(chunk))
    .map(toEditorBlock)
    .filter(Boolean);
  return blocks.length ? blocks : [createTextBlock('')];
}

function serializeCapsuleBlocks(blocks = []) {
  return serializeSharedCapsuleBlocks(blocks);
}

function getPublishedCapsuleBlocks(capsule) {
  if (!capsule) {
    return [createTextBlock('')];
  }

  const normalizedBlocks = getSharedCapsuleBlocks(capsule)
    .map(toEditorBlock)
    .filter(Boolean);

  return normalizedBlocks.length ? normalizedBlocks : [createTextBlock(capsule.summary || capsule.title || '')];
}

function generateAutoFileName(kind, body, existingName = '') {
  const trimmed = String(existingName || '').trim();
  if (trimmed) {
    return trimmed.endsWith('.md') ? trimmed : `${trimmed}.md`;
  }
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${kind}-${stamp}-${slugifyLabel(inferTitleFromText(body, kind)).slice(0, 30)}.md`;
}

function normalizeInboxFile(file) {
  const parsed = file.content
    ? parseFrontmatter(file.content)
    : {
        frontmatter: { ...(file.frontmatter || {}) },
        body: String(file.body || '').trim()
      };
  const frontmatter = parsed.frontmatter || {};
  const body = parsed.body || '';
  const parsedTags = parseTagList(frontmatter.tags || '');
  return {
    ...file,
    frontmatter,
    body,
    title: frontmatter.title || file.title || inferTitleFromText(body, file.fileName),
    tags: parsedTags.length ? parsedTags : extractTags(body || ''),
    status: actionToStatus(file.action || frontmatter.action),
    kind: file.kind || frontmatter.kind,
    target: file.target || frontmatter.target || 'auto',
    createdAt: file.createdAt || frontmatter.createdAt || file.modifiedAt || new Date().toISOString()
  };
}

function resolveItemCreatedAt(...values) {
  return values.find((value) => value) || new Date().toISOString();
}

function getCapsuleMap() {
  return new Map((state.dataSource.capsules || []).map((item) => [item.id, item]));
}

function getToyMap() {
  return new Map((state.dataSource.toys || []).map((item) => [item.id, item]));
}

function getPublishedCapsuleText(capsule) {
  return getCapsuleTextFromBlocks(getPublishedCapsuleBlocks(capsule));
}

function convertPublishedIssueToBlocks(issue) {
  const capsuleMap = getCapsuleMap();
  const serializedBody = [issue.body, issue.content, issue.payload?.body]
    .find((value) => typeof value === 'string' && String(value).trim());

  if (serializedBody) {
    return parseIssueBodyToBlocks(serializedBody);
  }

  const blocks = [];
  const sourceBlocks = [
    ...(Array.isArray(issue.blocks) ? issue.blocks : []),
    ...(Array.isArray(issue.payload?.blocks) ? issue.payload.blocks : [])
  ];

  sourceBlocks.forEach((block) => {
    if (!block) {
      return;
    }
    if (typeof block === 'string') {
      const parsed = parseChunkToBlock(block, capsuleMap);
      if (parsed) {
        blocks.push(parsed);
      }
      return;
    }
    if (block.type === 'note' || block.type === 'text' || block.type === 'thought') {
      blocks.push(createTextBlock(block.content || block.text || ''));
      return;
    }
    if (block.type === 'link') {
      blocks.push(createLinkBlock(block.text || block.title || block.url || '', block.url || ''));
      return;
    }
    if (block.type === 'image') {
      const imageUrl = String(block.url || block.image || block.src || '').trim();
      if (imageUrl) {
        blocks.push(createImageBlock(imageUrl, block.caption || block.text || ''));
      }
      return;
    }
    if (block.type === 'capsule-ref' || (block.type === 'capsule' && block.capsuleId)) {
      const capsuleId = block.capsuleId;
      const capsule = capsuleMap.get(capsuleId);
      blocks.push(
        capsule
          ? createCapsuleBlock(capsule)
          : {
              id: uid('capsule'),
              type: 'capsule',
              capsuleId,
              title: 'Capsule已删除',
              text: '',
              tags: []
            }
      );
    }
  });
  return blocks.length ? blocks : [createTextBlock('')];
}

function parseIssueBodyToBlocks(body = '') {
  const normalizedBody = normalizeLineEndings(body);
  const capsuleMap = getCapsuleMap();
  const blocks = normalizedBody
    .split(/\n{2,}/)
    .map((chunk) => parseChunkToBlock(chunk, capsuleMap))
    .filter(Boolean);
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
    if (block.type === 'link') {
      parts.push([
        '[链接]',
        `text: ${String(block.text || '').trim()}`,
        `url: ${String(block.url || '').trim()}`
      ].join('\n'));
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
    .map((block) => {
      if (block.type === 'text') {
        return block.text;
      }
      if (block.type === 'link') {
        return block.text || block.url;
      }
      return block.title;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return summary.slice(0, 90);
}

function getCapsuleDrafts() {
  return state.inboxFiles.filter((file) => file.kind === 'capsule').sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
}

function getIssueDrafts() {
  return state.inboxFiles.filter((file) => file.kind === 'issue').sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
}

function getModeDrafts(kind) {
  return state.inboxFiles.filter((file) => file.kind === kind).sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
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

  const items = drafts.filter((draft) => !draft.target || draft.target === 'auto').map((draft) => {
    const blocks = parseCapsuleBodyToBlocks(draft.body || '');
    const displayTitle = needsDerivedTitle(draft.title) ? inferTitleFromBlocks(blocks, '未命名 Capsule') : (draft.title || '未命名 Capsule');
    return {
      key: `draft:${draft.fileName}`,
      fileName: draft.fileName,
      id: '',
      title: displayTitle,
      text: getCapsuleTextFromBlocks(blocks),
      blocks,
      tags: draft.tags,
      status: draft.status,
      createdAt: draft.createdAt,
      updatedAt: draft.modifiedAt,
      isPublished: false
    };
  });

  published.forEach((capsule) => {
    const draft = overlayMap.get(capsule.id);
    const blocks = draft && draft.status === 'pendingRefresh'
      ? parseCapsuleBodyToBlocks(draft.body || '')
      : getPublishedCapsuleBlocks(capsule);
    const displayTitle = draft && draft.status === 'pendingRefresh'
      ? (needsDerivedTitle(draft.title) ? inferTitleFromBlocks(blocks, capsule.title) : (draft.title || capsule.title))
      : capsule.title;
    items.push({
      key: capsule.id,
      fileName: draft?.fileName || '',
      id: capsule.id,
      title: displayTitle,
      text: getCapsuleTextFromBlocks(blocks),
      blocks,
      tags: draft && draft.status === 'pendingRefresh' && draft.tags.length ? draft.tags : (capsule.tags || []),
      status: draft ? draft.status : 'published',
      createdAt: resolveItemCreatedAt(capsule.publishedAt, draft?.createdAt),
      updatedAt: draft?.modifiedAt || capsule.publishedAt,
      isPublished: true
    });
  });

  const searchQuery = state.ui.capsule.search.trim().toLowerCase();
  const searched = !searchQuery
    ? items
    : items.filter((item) => `${item.title} ${item.text} ${(item.tags || []).join(' ')}`.toLowerCase().includes(searchQuery));

  const selectedTags = state.ui.capsule.activeTags || [];
  const tagFiltered = !selectedTags.length
    ? searched
    : searched.filter((item) => {
      const itemTags = (item.tags || []).map((tag) => tag.toLowerCase());
      return selectedTags.every((selectedTag) => itemTags.includes(selectedTag.toLowerCase()));
    });

  return tagFiltered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    const displayTitle = needsDerivedTitle(draft.title) ? inferTitleFromBlocks(blocks, '未命名 Issue') : (draft.title || '未命名 Issue');
    return {
      key: `draft:${draft.fileName}`,
      fileName: draft.fileName,
      id: '',
      title: displayTitle,
      summary: issueSummaryFromBlocks(blocks),
      blocks,
      tags: draft.tags || [],
      status: draft.status,
      createdAt: draft.createdAt,
      updatedAt: draft.modifiedAt,
      isPublished: false
    };
  });

  published.forEach((issue) => {
    const draft = overlayMap.get(issue.id);
    const blocks = draft && draft.status === 'pendingRefresh' ? parseIssueBodyToBlocks(draft.body || '') : convertPublishedIssueToBlocks(issue);
    const displayTitle = draft && draft.status === 'pendingRefresh'
      ? (needsDerivedTitle(draft.title) ? inferTitleFromBlocks(blocks, issue.title) : (draft.title || issue.title))
      : issue.title;
    items.push({
      key: issue.id,
      fileName: draft?.fileName || '',
      id: issue.id,
      title: displayTitle,
      summary: draft && draft.status === 'pendingRefresh' ? issueSummaryFromBlocks(blocks) : issue.summary,
      blocks,
      tags: draft?.tags?.length ? draft.tags : (issue.tags || []),
      status: draft ? draft.status : 'published',
      createdAt: resolveItemCreatedAt(issue.publishedAt, draft?.createdAt),
      updatedAt: draft?.modifiedAt || issue.publishedAt,
      isPublished: true
    });
  });

  const query = state.ui.issue.search.trim().toLowerCase();
  const filtered = !query ? items : items.filter((item) => `${item.title} ${item.summary} ${(item.tags || []).join(' ')}`.toLowerCase().includes(query));
  const selectedTags = state.ui.issue.activeTags || [];
  const tagFiltered = !selectedTags.length
    ? filtered
    : filtered.filter((item) => {
      const itemTags = (item.tags || []).map((tag) => tag.toLowerCase());
      return selectedTags.every((selectedTag) => itemTags.includes(selectedTag.toLowerCase()));
    });
  return tagFiltered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function articleBlocksToPlainText(blocks = []) {
  return blocks
    .map((block) => {
      if (!block) {
        return '';
      }
      if (typeof block === 'string') {
        return block;
      }
      if (block.type === 'heading') {
        return `## ${block.content || block.text || ''}`;
      }
      if (block.type === 'quote') {
        return `> ${block.content || block.text || ''}`;
      }
      if (block.type === 'list') {
        const ordered = block.ordered;
        return (block.items || [])
          .map((item, index) => ordered ? `${index + 1}. ${item}` : `- ${item}`)
          .join('\n');
      }
      if (block.type === 'code') {
        return [
          `\`\`\`${block.language || ''}`,
          block.content || block.text || '',
          '```'
        ].join('\n');
      }
      if (block.type === 'capsule-ref') {
        return `[引用 Capsule]\ncapsuleId: ${block.capsuleId || ''}`;
      }
      if (block.type === 'toy-ref') {
        return `[引用 Toy]\ntoyId: ${block.toyId || ''}`;
      }
      return block.content || block.text || '';
    })
    .filter((value) => String(value || '').trim())
    .join('\n\n');
}

function estimateReadingMinutes(value = '') {
  const compact = String(value || '').replace(/\s+/g, '');
  return Math.max(1, Math.ceil(compact.length / 500));
}

function getColumnTitle(columnId = '') {
  const column = (state.dataSource.columns || []).find((item) => item.id === columnId);
  return column?.title || '';
}

function getPlainModeConfig(kind) {
  return {
    flow: {
      collection: 'flows',
      cardClass: 'flow-card',
      title: 'Flow',
      composerTitle: '写一条 Flow',
      primaryFieldLabel: '正文',
      primaryFieldPlaceholder: '写一点纯文本碎碎念。',
      saveLabel: '保存 Flow',
      searchPlaceholder: '搜索 Flow',
      bodyFromPublished: (item) => item.body || item.content || item.summary || '',
      summaryFromPublished: (item) => item.summary || ''
    },
    article: {
      collection: 'articles',
      cardClass: 'article-card',
      title: 'Article',
      composerTitle: '写一篇 Article',
      primaryFieldLabel: '长文正文',
      primaryFieldPlaceholder: '写长文正文。可用空行分段，后续会升级为块编辑。',
      saveLabel: '保存 Article',
      searchPlaceholder: '搜索 Article',
      bodyFromPublished: (item) => item.body || item.content || articleBlocksToPlainText(item.blocks || []),
      summaryFromPublished: (item) => item.summary || ''
    },
    toy: {
      collection: 'toys',
      cardClass: 'toy-card',
      title: 'Toy',
      composerTitle: '添加 Toy',
      primaryFieldLabel: '说明',
      primaryFieldPlaceholder: '写一句这个 Toy 可以演示什么。',
      saveLabel: '保存 Toy',
      searchPlaceholder: '搜索 Toy',
      bodyFromPublished: (item) => item.summary || item.description || '',
      summaryFromPublished: (item) => item.summary || item.description || ''
    }
  }[kind];
}

function buildPlainModeItems(kind) {
  const config = getPlainModeConfig(kind);
  if (!config) {
    return [];
  }
  const drafts = getModeDrafts(kind);
  const published = [...(state.dataSource[config.collection] || [])].sort((a, b) => new Date(b.publishedAt || b.id) - new Date(a.publishedAt || a.id));
  const overlayMap = new Map();

  drafts.filter((draft) => draft.target && draft.target !== 'auto').forEach((draft) => {
    if (!overlayMap.has(draft.target)) {
      overlayMap.set(draft.target, draft);
    }
  });

  const draftItems = drafts.filter((draft) => !draft.target || draft.target === 'auto').map((draft) => ({
    key: `draft:${draft.fileName}`,
    fileName: draft.fileName,
    id: '',
    title: draft.title || `未命名 ${config.title}`,
    summary: draft.frontmatter.summary || draft.body.slice(0, 100),
    body: draft.body || '',
    tags: draft.tags || [],
    status: draft.status,
    createdAt: draft.createdAt,
    updatedAt: draft.modifiedAt,
    isPublished: false,
    columnId: draft.frontmatter.columnId || '',
    entry: draft.frontmatter.entry || '',
    aspectRatio: draft.frontmatter.aspectRatio || '16 / 9',
    allowFullscreen: draft.frontmatter.allowFullscreen !== 'false'
  }));

  const publishedItems = published.map((item) => {
    const draft = overlayMap.get(item.id);
    const body = draft && draft.status === 'pendingRefresh' ? draft.body : config.bodyFromPublished(item);
    return {
      key: item.id,
      fileName: draft?.fileName || '',
      id: item.id,
      title: draft && draft.status === 'pendingRefresh' ? (draft.title || item.title) : item.title,
      summary: draft && draft.status === 'pendingRefresh' ? (draft.frontmatter.summary || draft.body.slice(0, 100)) : config.summaryFromPublished(item),
      body,
      tags: draft?.tags?.length ? draft.tags : (item.tags || []),
      status: draft ? draft.status : 'published',
      createdAt: resolveItemCreatedAt(item.publishedAt, draft?.createdAt),
      updatedAt: draft?.modifiedAt || item.publishedAt,
      isPublished: true,
      columnId: draft?.frontmatter?.columnId || item.columnId || '',
      entry: draft?.frontmatter?.entry || item.entry || item.src || item.url || '',
      aspectRatio: draft?.frontmatter?.aspectRatio || item.aspectRatio || '16 / 9',
      allowFullscreen: draft?.frontmatter?.allowFullscreen !== 'false' && item.allowFullscreen !== false
    };
  });

  const items = [...draftItems, ...publishedItems];
  const query = (state.ui[kind]?.search || '').trim().toLowerCase();
  const searched = !query
    ? items
    : items.filter((item) => `${item.title} ${item.summary} ${item.body} ${item.entry} ${(item.tags || []).join(' ')}`.toLowerCase().includes(query));
  const selectedTags = state.ui[kind]?.activeTags || [];
  const tagFiltered = !selectedTags.length
    ? searched
    : searched.filter((item) => {
      const itemTags = (item.tags || []).map((tag) => tag.toLowerCase());
      return selectedTags.every((selectedTag) => itemTags.includes(selectedTag.toLowerCase()));
    });
  return tagFiltered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function buildFlowItems() {
  return buildPlainModeItems('flow');
}

function buildArticleItems() {
  return buildPlainModeItems('article');
}

function buildToyItems() {
  return buildPlainModeItems('toy');
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
  [...(state.dataSource.issues || [])]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .forEach((issue) => (issue.tags || []).forEach(addTag));
  [...(state.dataSource.flows || []), ...(state.dataSource.articles || []), ...(state.dataSource.toys || [])]
    .sort((a, b) => new Date(b.publishedAt || b.id) - new Date(a.publishedAt || a.id))
    .forEach((item) => (item.tags || []).forEach(addTag));
  getCapsuleDrafts().forEach((draft) => draft.tags.forEach(addTag));
  getIssueDrafts().forEach((draft) => draft.tags.forEach(addTag));
  ['flow', 'article', 'toy'].forEach((kind) => getModeDrafts(kind).forEach((draft) => draft.tags.forEach(addTag)));
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
  (state.dataSource.issues || []).forEach((issue) => (issue.tags || []).forEach(addTag));
  (state.dataSource.flows || []).forEach((flow) => (flow.tags || []).forEach(addTag));
  (state.dataSource.articles || []).forEach((article) => (article.tags || []).forEach(addTag));
  (state.dataSource.toys || []).forEach((toy) => (toy.tags || []).forEach(addTag));
  getCapsuleDrafts().forEach((draft) => draft.tags.forEach(addTag));
  getIssueDrafts().forEach((draft) => draft.tags.forEach(addTag));
  ['flow', 'article', 'toy'].forEach((kind) => getModeDrafts(kind).forEach((draft) => draft.tags.forEach(addTag)));
  return tags;
}

function getTagCounts() {
  const counts = new Map();
  buildCapsuleItems().forEach((item) => {
    item.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function getIssueTagCounts() {
  const counts = new Map();
  buildIssueItems().forEach((item) => {
    (item.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function getModeTagCounts(kind) {
  if (kind === 'capsule') {
    return getTagCounts();
  }
  if (kind === 'issue') {
    return getIssueTagCounts();
  }
  const counts = new Map();
  buildPlainModeItems(kind).forEach((item) => {
    (item.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
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

function getToyCandidates(query = '') {
  const normalizedQuery = query.trim().toLowerCase();
  const items = buildToyItems().filter((item) => item.status !== 'pendingDelete' && item.entry);
  const filtered = normalizedQuery
    ? items.filter((item) => `${item.title} ${item.summary} ${item.body} ${item.entry} ${(item.tags || []).join(' ')}`.toLowerCase().includes(normalizedQuery))
    : items;
  return filtered.slice(0, 8).map((item) => ({
    id: item.id || item.key,
    title: item.title,
    text: item.summary || item.body || item.entry,
    tags: item.tags,
    sourceId: item.id || item.key,
    entry: item.entry,
    aspectRatio: item.aspectRatio,
    allowFullscreen: item.allowFullscreen
  }));
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
  return sharedCapsuleNeedsCollapse(text);
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

function getSlashContext(value, selectionStart) {
  const left = value.slice(0, selectionStart);
  const match = left.match(/(?:^|\n|\s)\/([A-Za-z-]*)$/);
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

  if (state.suggestion.type === 'slash') {
    panel.innerHTML = state.suggestion.options
      .map((item) => `
        <button class="suggestion-item" data-action="suggest-command" data-value="${escapeHtml(item.id)}">
          <strong>/${escapeHtml(item.id)}</strong>
          <small>${escapeHtml(item.description || '')}</small>
        </button>
      `)
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

function updateSlashSuggestion(textarea, targetKey) {
  const context = getSlashContext(textarea.value, textarea.selectionStart);
  if (!context) {
    return false;
  }
  const options = (textarea.matches('[data-capsule-text-target]')
    ? [
        { id: 'image', description: '插入图片并输入链接' },
        { id: 'link', description: '插入链接卡片并填写标题与地址' },
      ]
    : [
        { id: 'link', description: '插入链接卡片并填写标题与地址' }
      ])
    .filter((item) => item.id.startsWith((context.query || '').toLowerCase()));
  if (!options.length) {
    hideSuggestion();
    return true;
  }
  state.suggestion = {
    visible: true,
    type: 'slash',
    target: targetKey,
    query: context.query,
    start: context.start,
    end: context.end,
    options,
    top: 0,
    left: 0,
    width: 280
  };
  positionSuggestion(textarea);
  renderFloatingSuggestion();
  return true;
}

function updateMentionSuggestion(textarea, blockId) {
  const context = getMentionContext(textarea.value, textarea.selectionStart);
  if (!context) {
    return false;
  }
  const options = getCapsuleCandidates(context.query);
  if (!options.length) {
    hideSuggestion();
    return true;
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
  return true;
}

function applyTagSuggestion(tag) {
  const textarea = document.querySelector(`[data-capsule-text-target="${state.suggestion.target}"]`) || document.querySelector(`[data-issue-text-target="${state.suggestion.target}"]`);
  if (!textarea) {
    hideSuggestion();
    return;
  }

  const nextValue = `${textarea.value.slice(0, state.suggestion.start)}#${tag} ${textarea.value.slice(state.suggestion.end)}`;
  textarea.value = nextValue;
  const cursor = state.suggestion.start + tag.length + 2;
  textarea.setSelectionRange(cursor, cursor);

  const { owner, blockId } = parseEditorTarget(state.suggestion.target);
  if (textarea.matches('[data-capsule-text-target]')) {
    syncCapsuleTextBlock(owner, blockId, nextValue);
    renderCapsuleComposerTagPreview();
  } else {
    syncIssueBlock(owner, blockId, nextValue);
    if (owner === 'composer') {
      renderIssueComposerTagPreview();
    }
  }

  autoResizeTextarea(textarea, 32);
  hideSuggestion();
}

function applyMentionSuggestion(capsuleId) {
  const { owner, blockId } = parseEditorTarget(state.suggestion.target);
  const blocks = [...getIssueEditorBlocks(owner || 'composer')];
  const blockIndex = blocks.findIndex((block) => block.id === blockId);
  if (blockIndex === -1) {
    hideSuggestion();
    return;
  }
  const block = blocks[blockIndex];
  const nextText = `${block.text.slice(0, state.suggestion.start)}${block.text.slice(state.suggestion.end)}`.trimEnd();
  const publishedCapsule = getCapsuleMap().get(capsuleId);
  if (!publishedCapsule) {
    showToast('没有找到这个 Capsule。', 'error');
    return;
  }
  blocks.splice(blockIndex, 1, { ...block, text: nextText }, createCapsuleBlock(publishedCapsule), createTextBlock(''));
  setIssueEditorBlocks(owner || 'composer', blocks);
  renderIssueWorkspace();
  hideSuggestion();
}

async function collectImageBlockInput(initialValue = {}) {
  const values = await openCommandDialog({
    title: '插入图片',
    fields: [
      { key: 'url', label: '图片链接', value: initialValue.url || '', placeholder: 'https://example.com/image.jpg' },
      { key: 'caption', label: '图片说明', value: initialValue.caption || '', placeholder: '可选' }
    ]
  });

  if (!values) {
    return null;
  }

  return {
    url: String(values.url || '').trim(),
    caption: String(values.caption || '').trim()
  };
}

async function collectLinkBlockInput(initialValue = {}) {
  const values = await openCommandDialog({
    title: '插入链接',
    fields: [
      { key: 'text', label: '链接文字', value: initialValue.text || '', placeholder: '例如：打开原文' },
      { key: 'url', label: '链接地址', value: initialValue.url || '', placeholder: 'https://example.com' }
    ]
  });

  if (!values) {
    return null;
  }

  return {
    text: String(values.text || '').trim(),
    url: String(values.url || '').trim()
  };
}

async function insertCapsuleImageFromCommand(owner, blockId) {
  return capsuleWorkspace.insertImageFromCommand(owner, blockId);
}

async function insertCapsuleLinkFromCommand(owner, blockId) {
  return capsuleWorkspace.insertLinkFromCommand(owner, blockId);
}

async function insertIssueLinkFromCommand(owner, blockId) {
  return issueWorkspace.insertLinkFromCommand(owner, blockId);
}

async function applySlashSuggestion(commandId) {
  const { owner, blockId } = parseEditorTarget(state.suggestion.target);
  const textarea = document.querySelector(`[data-capsule-text-target="${state.suggestion.target}"]`) || document.querySelector(`[data-issue-text-target="${state.suggestion.target}"]`);
  if (!owner || !blockId || !textarea) {
    return;
  }
  if (commandId === 'image' && textarea.matches('[data-capsule-text-target]')) {
    await insertCapsuleImageFromCommand(owner, blockId);
    return;
  }
  if (commandId === 'link') {
    if (textarea.matches('[data-capsule-text-target]')) {
      await insertCapsuleLinkFromCommand(owner, blockId);
    } else {
      await insertIssueLinkFromCommand(owner, blockId);
    }
  }
}

function autoResizeTextarea(textarea, minHeight = 40) {
  if (!String(textarea.value || '').trim()) {
    textarea.style.height = `${minHeight}px`;
    return;
  }
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
}

function getCapsuleEditorBlocks(owner) {
  return capsuleWorkspace.getEditorBlocks(owner);
}

function setCapsuleEditorBlocks(owner, blocks) {
  capsuleWorkspace.setEditorBlocks(owner, blocks);
}

function findCapsuleBlock(owner, blockId) {
  return capsuleWorkspace.findBlock(owner, blockId);
}

function syncCapsuleTextBlock(owner, blockId, text) {
  capsuleWorkspace.syncTextBlock(owner, blockId, text);
}

function syncCapsuleImageBlock(owner, blockId, field, value) {
  capsuleWorkspace.syncImageBlock(owner, blockId, field, value);
}

function updateCapsuleImage(owner, blockId) {
  capsuleWorkspace.updateImage(owner, blockId);
}

function updateCapsuleLink(owner, blockId) {
  capsuleWorkspace.updateLink(owner, blockId);
}

function setSelectedCapsuleImage(owner, blockId) {
  capsuleWorkspace.setSelectedImage(owner, blockId);
}

function addCapsuleTextBlock(owner) {
  capsuleWorkspace.addTextBlock(owner);
}

function insertCapsuleTextBlock(owner, index) {
  capsuleWorkspace.insertTextBlock(owner, index);
}

function addCapsuleImageBlock(owner) {
  capsuleWorkspace.addImageBlock(owner);
}

function removeCapsuleBlock(owner, blockId) {
  capsuleWorkspace.removeBlock(owner, blockId);
}

function moveCapsuleBlock(owner, blockId, insertIndex) {
  capsuleWorkspace.moveBlock(owner, blockId, insertIndex);
}

function renderImagePreviewMarkup(block, options = {}) {
  const { removable = false } = options;
  const rawUrl = String(block.url || '').trim();
  const url = escapeHtml(rawUrl);
  const caption = renderTextContent(block.caption || '图片');
  const buttonAttrs = rawUrl
    ? `type="button" class="image-frame-button" data-action="image-open-lightbox" data-url="${url}" data-caption="${escapeHtml(block.caption || '')}" aria-label="查看大图"`
    : 'type="button" class="image-frame-button" disabled aria-label="图片预览不可用"';
  return `
    <div class="image-block-preview ${removable ? 'removable' : ''}">
      <button ${buttonAttrs}>
        <div class="image-frame">
          <img
            class="image-block-media ${rawUrl ? '' : 'hidden'}"
            src="${url}"
            alt="${caption}"
            loading="lazy"
            onerror="this.classList.add('hidden');this.closest('.image-frame').querySelector('.image-placeholder').classList.remove('hidden');"
            onload="this.classList.remove('hidden');this.closest('.image-frame').querySelector('.image-placeholder').classList.add('hidden');"
          />
          <div class="image-placeholder ${rawUrl ? 'hidden' : ''}">图片预览失败</div>
        </div>
      </button>
      ${block.caption ? `<div class="image-caption">${caption}</div>` : ''}
    </div>
  `;
}

function renderLinkPreviewMarkup(block, options = {}) {
  const { editable = false, owner = '', blockId = '', editAction = '' } = options;
  const rawUrl = String(block.url || '').trim();
  const safeUrl = escapeHtml(rawUrl);
  const title = renderTextContent(block.text || rawUrl || '未命名链接');
  const urlText = renderTextContent(rawUrl || '待填写链接地址');
  const inner = `
    <div class="link-block-copy">
      <span class="link-block-badge">LINK</span>
      <div class="link-block-title">${title}</div>
      <div class="link-block-url">${urlText}</div>
    </div>
    <span class="link-block-arrow" aria-hidden="true">↗</span>
  `;
  if (editable) {
    return `
      <div class="link-block-preview editable">
        <button type="button" class="link-block-surface" data-action="${editAction}" data-owner="${owner}" data-block-id="${blockId}" aria-label="编辑链接">
          ${inner}
        </button>
      </div>
    `;
  }
  if (rawUrl) {
    return `
      <div class="link-block-preview">
        <a class="link-block-surface" href="${safeUrl}" target="_blank" rel="noreferrer noopener">
          ${inner}
        </a>
      </div>
    `;
  }
  return `
    <div class="link-block-preview empty">
      <div class="link-block-surface">${inner}</div>
    </div>
  `;
}

function refreshImagePreview(container, block) {
  if (!container || !block) {
    return;
  }
  const img = container.querySelector('.image-block-media');
  const placeholder = container.querySelector('.image-placeholder');
  const caption = container.querySelector('.image-caption');
  if (img) {
    img.src = block.url || '';
    img.alt = block.caption || '图片';
    if (!block.url) {
      img.classList.add('hidden');
      placeholder?.classList.remove('hidden');
    }
  }
  if (caption) {
    caption.textContent = block.caption || '';
  }
}

function renderCapsuleComposerTagPreview() {
  capsuleWorkspace.renderComposerTagPreview();
}

function renderIssueComposerTagPreview() {
  issueWorkspace.renderComposerTagPreview();
}

function getCapsuleItemByKey(key) {
  return capsuleWorkspace.getItemByKey(key);
}

function getIssueItemByKey(key) {
  return issueWorkspace.getItemByKey(key);
}

function getInboxFileByName(fileName = '') {
  return state.inboxFiles.find((file) => file.fileName === fileName) || null;
}

function getCapsuleBlocksForEditing(item) {
  return capsuleWorkspace.getBlocksForEditing(item);
}

function getIssueBlocksForEditing(item) {
  return issueWorkspace.getBlocksForEditing(item);
}

function getIssueEditorBlocks(owner = 'composer') {
  return issueWorkspace.getEditorBlocks(owner);
}

function setIssueEditorBlocks(owner = 'composer', blocks = [createTextBlock('')]) {
  issueWorkspace.setEditorBlocks(owner, blocks);
}

function cancelCapsuleEditing(key) {
  capsuleWorkspace.cancelEditing(key);
}

function cancelIssueEditing(key) {
  issueWorkspace.cancelEditing(key);
}

function resetIssueEditor() {
  issueWorkspace.resetEditor();
}

function deletePreviousIssueBlock(owner, blockId) {
  return issueWorkspace.deletePreviousBlock(owner, blockId);
}

function deletePreviousCapsuleBlock(owner, blockId) {
  return capsuleWorkspace.deletePreviousBlock(owner, blockId);
}

async function refreshInbox() {
  const result = await requestJson('/api/inbox');
  state.inboxFiles = result.files.map(normalizeInboxFile);
}

async function refreshDataSource() {
  state.dataSource = await requestJson('/api/data-source');
}

async function previewDraftPublish(fileName) {
  if (!fileName) {
    return;
  }
  const preview = await requestJson('/api/publish/preview', {
    method: 'POST',
    body: JSON.stringify({ fileName })
  });
  openPublishPreviewDialog(preview);
}

async function applyDraftPublish(fileName) {
  if (!fileName) {
    return;
  }
  const result = await requestJson('/api/publish/apply', {
    method: 'POST',
    body: JSON.stringify({ fileName })
  });
  closeCommandDialog(null);
  await refreshDataSource();
  await refreshInbox();
  renderWorkspace();
  showToast(`已发布 ${result.kind}：${result.itemId}`);
}

async function undoLatestPublishFromCms() {
  const result = await requestJson('/api/publish/undo', {
    method: 'POST',
    body: JSON.stringify({})
  });
  await refreshDataSource();
  await refreshInbox();
  renderWorkspace();
  showToast(`已撤销发布：${result.restoredFileName || result.undoFileName}`);
}

async function saveTask({ kind, action, target = 'auto', title = '', body, fileName = '', tags = [], createdAt = '', extraFrontmatter = {} }) {
  const finalName = generateAutoFileName(kind, title || body, fileName);
  const stableCreatedAt = createdAt || new Date().toISOString();
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
      title: title || undefined,
      tags: tags.length ? tags.join(', ') : undefined,
      createdAt: stableCreatedAt,
      ...extraFrontmatter
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

function renderDraftPublishTools(item) {
  if (!item?.fileName || item.status === 'published') {
    return '';
  }
  const publishLabel = item.status === 'pendingDelete' ? '确认删除' : '发布';
  return `
    <button class="ghost small compact-tool" data-action="draft-preview" data-file-name="${escapeHtml(item.fileName)}">预览发布</button>
    <button class="small compact-tool" data-action="draft-publish" data-file-name="${escapeHtml(item.fileName)}">${publishLabel}</button>
  `;
}

function renderCapsuleDisplayBlocks(blocks, expanded = false) {
  return capsuleWorkspace.renderDisplayBlocks(blocks, expanded);
}

function renderCapsulePreviewBlocks(blocks = [], fallbackText = '') {
  return capsuleWorkspace.renderPreviewBlocks(blocks, fallbackText);
}

function getCapsulePreviewText(blocks = [], fallbackText = '') {
  return capsuleWorkspace.getPreviewText(blocks, fallbackText);
}

function renderCapsuleEditorBlocks(owner, blocks) {
  return capsuleWorkspace.renderEditorBlocks(owner, blocks);
}

function renderCapsuleCard(item) {
  return capsuleWorkspace.renderCard(item);
}

function renderCapsuleWorkspace() {
  capsuleWorkspace.renderWorkspace();
}

function renderIssueCapsuleBlock(owner, block, expanded) {
  return issueWorkspace.renderCapsuleBlock(owner, block, expanded);
}

function getIssueEditorTitle(owner = 'composer') {
  return issueWorkspace.getEditorTitle(owner);
}

function setIssueEditorTitle(owner = 'composer', title = '') {
  issueWorkspace.setEditorTitle(owner, title);
}

function renderIssueTitleField(owner, value = '', placeholder = '输入 Issue 标题') {
  return issueWorkspace.renderTitleField(owner, value, placeholder);
}

function renderIssueEditorBlocks(owner, blocks) {
  return issueWorkspace.renderEditorBlocks(owner, blocks);
}

function renderIssueCard(item) {
  return issueWorkspace.renderCard(item);
}

function renderIssueWorkspace() {
  issueWorkspace.renderWorkspace();
}

function renderPlainModeWorkspace(kind) {
  if (kind === 'toy') {
    toyWorkspace.renderWorkspace();
    return;
  }
  plainWorkspace.renderWorkspace(kind);
}

function renderWorkspace() {
  hideSuggestion();
  if (state.mode === 'capsule') {
    renderCapsuleWorkspace();
  } else if (state.mode === 'issue') {
    renderIssueWorkspace();
  } else if (state.mode === 'comments') {
    commentsModule.renderWorkspace();
  } else {
    renderPlainModeWorkspace(state.mode);
  }
}

async function insertArticleTemplate(kind, key, template) {
  return plainWorkspace.insertArticleTemplate(kind, key, template);
}

async function savePlainFromComposer(kind) {
  return kind === 'toy'
    ? toyWorkspace.saveFromComposer()
    : plainWorkspace.saveFromComposer(kind);
}

async function savePlainCard(kind, key) {
  return kind === 'toy'
    ? toyWorkspace.saveCard(key)
    : plainWorkspace.saveCard(kind, key);
}

async function deletePlainItem(kind, key) {
  return kind === 'toy'
    ? toyWorkspace.deleteItem(key)
    : plainWorkspace.deleteItem(kind, key);
}

async function publishCapsuleFromComposer() {
  return capsuleWorkspace.publishFromComposer();
}

async function saveCapsuleCard(key) {
  return capsuleWorkspace.saveCard(key);
}

async function deleteCapsuleItem(key) {
  return capsuleWorkspace.deleteItem(key);
}

async function saveIssueEditor() {
  return issueWorkspace.saveEditor();
}

async function saveIssueCard(key) {
  return issueWorkspace.saveCard(key);
}

async function deleteIssueItem(key) {
  return issueWorkspace.deleteItem(key);
}

function removeIssueBlock(owner, blockId) {
  issueWorkspace.removeBlock(owner, blockId);
}

function findIssueBlock(owner, blockId) {
  return issueWorkspace.findBlock(owner, blockId);
}

function updateIssueLink(owner, blockId) {
  issueWorkspace.updateLink(owner, blockId);
}

function insertIssueBlock(owner, index) {
  issueWorkspace.insertBlock(owner, index);
}

function moveIssueBlock(owner, blockId, insertIndex) {
  issueWorkspace.moveBlock(owner, blockId, insertIndex);
}

function syncIssueBlock(owner, blockId, text) {
  issueWorkspace.syncBlock(owner, blockId, text);
}

function setMode(mode) {
  state.mode = mode;
  applySettingsTheme();
  renderWorkspace();
}

function renderAfterSearchInput() {
  renderWorkspace();
  requestAnimationFrame(() => {
    const searchInput = document.getElementById(`${state.mode}SearchInput`);
    if (searchInput) {
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  });
}

function handleMouseDown(event) {
  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) {
    return;
  }

  const action = actionTarget.dataset.action;
  if (!['suggest-tag', 'suggest-command', 'suggest-capsule'].includes(action)) {
    return;
  }

  event.preventDefault();
  actionTarget.dataset.pointerHandled = 'true';

  if (action === 'suggest-tag') {
    applyTagSuggestion(actionTarget.dataset.value || '');
    return;
  }

  if (action === 'suggest-command') {
    applySlashSuggestion(actionTarget.dataset.value || '');
    return;
  }

  applyMentionSuggestion(actionTarget.dataset.value || '');
}

function handleClick(event) {
  if (event.target === elements.lightbox) {
    closeLightbox();
    return;
  }

  const modeTab = event.target.closest('[data-mode-tab]');
  if (modeTab) {
    setMode(modeTab.dataset.modeTab || 'issue');
    return;
  }

  const actionTarget = event.target.closest('[data-action]');

  if (!actionTarget) {
    if (state.ui.settingsOpen && !event.target.closest('#settingsPanel') && !event.target.closest('#settingsToggle')) {
      setSettingsPanelOpen(false);
    }
    if (!event.target.closest('#floatingSuggestion')) {
      hideSuggestion();
    }
    return;
  }

  const action = actionTarget.dataset.action;
  if (actionTarget.dataset.pointerHandled === 'true') {
    delete actionTarget.dataset.pointerHandled;
    return;
  }
  const key = actionTarget.dataset.key;
  const kind = actionTarget.dataset.kind || state.mode;
  const fileName = actionTarget.dataset.fileName || '';
  const page = Number(actionTarget.dataset.page || '1');

  switch (action) {
    case 'settings-toggle':
      setSettingsPanelOpen(!state.ui.settingsOpen);
      break;
    case 'settings-reset':
      state.settings = loadStoredDefaultSettings();
      persistSettings();
      applySettingsTheme();
      renderSettingsPanel();
      renderWorkspace();
      break;
    case 'preview-open':
      window.location.href = '/browse/';
      break;
    case 'publish-undo':
      undoLatestPublishFromCms().catch((error) => showToast(error.message, 'error'));
      break;
    case 'image-open-lightbox':
      openLightbox(actionTarget.dataset.url || '', actionTarget.dataset.caption || '');
      break;
    case 'lightbox-close':
      closeLightbox();
      break;
    case 'command-dialog-cancel':
      closeCommandDialog(null);
      break;
    case 'command-dialog-confirm':
      confirmCommandDialog();
      break;
    case 'toy-picker-select':
      state.commandDialog.selectedToyId = actionTarget.dataset.value || '';
      renderCommandDialog();
      break;
    case 'draft-preview':
      previewDraftPublish(fileName).catch((error) => showToast(error.message, 'error'));
      break;
    case 'draft-publish':
      applyDraftPublish(fileName).catch((error) => showToast(error.message, 'error'));
      break;
    case 'capsule-publish':
      publishCapsuleFromComposer().catch((error) => showToast(error.message, 'error'));
      break;
    case 'capsule-toggle-expand':
      state.ui.capsule.expanded[key] = !state.ui.capsule.expanded[key];
      renderCapsuleWorkspace();
      break;
    case 'capsule-edit': {
      const item = getCapsuleItemByKey(key);
      if (state.ui.capsule.editing[key]) {
        cancelCapsuleEditing(key);
        break;
      }
      state.ui.capsule.editing[key] = true;
      state.ui.capsule.expanded[key] = true;
      state.ui.capsule.editBlocks[key] = getCapsuleBlocksForEditing(item);
      renderCapsuleWorkspace();
      break;
    }
    case 'capsule-cancel-edit':
      cancelCapsuleEditing(key);
      break;
    case 'capsule-insert-text':
      insertCapsuleTextBlock(actionTarget.dataset.owner || 'composer', Number(actionTarget.dataset.index || '0'));
      break;
    case 'capsule-remove-block':
      removeCapsuleBlock(actionTarget.dataset.owner || 'composer', actionTarget.dataset.blockId);
      break;
    case 'capsule-edit-image':
      updateCapsuleImage(actionTarget.dataset.owner || 'composer', actionTarget.dataset.blockId);
      break;
    case 'capsule-edit-link':
      updateCapsuleLink(actionTarget.dataset.owner || 'composer', actionTarget.dataset.blockId);
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
    case 'capsule-filter-tag': {
      const tag = actionTarget.dataset.tag || '';
      state.ui.capsule.activeTags = toggleTagSelection(state.ui.capsule.activeTags, tag);
      state.ui.capsule.page = 1;
      renderCapsuleWorkspace();
      break;
    }
    case 'capsule-clear-tags':
      state.ui.capsule.activeTags = [];
      renderCapsuleWorkspace();
      break;
    case 'issue-load': {
      const item = getIssueItemByKey(key);
      if (item) {
        if (state.ui.issue.editing[key]) {
          cancelIssueEditing(key);
          break;
        }
        state.ui.issue.editing[key] = true;
        state.ui.issue.editBlocks[key] = getIssueBlocksForEditing(item);
        state.ui.issue.editTitles[key] = item.title || '';
        renderIssueWorkspace();
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
    case 'issue-filter-tag': {
      const tag = actionTarget.dataset.tag || '';
      state.ui.issue.activeTags = toggleTagSelection(state.ui.issue.activeTags, tag);
      state.ui.issue.page = 1;
      renderIssueWorkspace();
      break;
    }
    case 'issue-clear-tags':
      state.ui.issue.activeTags = [];
      renderIssueWorkspace();
      break;
    case 'issue-insert-block':
      insertIssueBlock(actionTarget.dataset.owner || 'composer', Number(actionTarget.dataset.index || '0'));
      break;
    case 'issue-save':
      saveIssueEditor().catch((error) => showToast(error.message, 'error'));
      break;
    case 'issue-save-edit':
      saveIssueCard(key).catch((error) => showToast(error.message, 'error'));
      break;
    case 'issue-cancel-edit':
      cancelIssueEditing(key);
      break;
    case 'issue-remove-block':
      removeIssueBlock(actionTarget.dataset.owner || 'composer', actionTarget.dataset.blockId);
      break;
    case 'issue-edit-link':
      updateIssueLink(actionTarget.dataset.owner || 'composer', actionTarget.dataset.blockId);
      break;
    case 'issue-toggle-capsule': {
      const blockId = actionTarget.dataset.blockId;
      state.ui.issue.expandedPreview[blockId] = !state.ui.issue.expandedPreview[blockId];
      renderIssueWorkspace();
      break;
    }
    case 'issue-remove-capsule':
      removeIssueBlock(actionTarget.dataset.owner || 'composer', actionTarget.dataset.blockId);
      break;
    case 'article-insert-template':
      insertArticleTemplate(kind, key, actionTarget.dataset.template || '').catch((error) => showToast(error.message, 'error'));
      break;
    case 'plain-save':
      savePlainFromComposer(kind).catch((error) => showToast(error.message, 'error'));
      break;
    case 'plain-edit':
      if (getPlainModeConfig(kind)) {
        state.ui[kind].editing[key] = !state.ui[kind].editing[key];
        renderPlainModeWorkspace(kind);
      }
      break;
    case 'plain-save-edit':
      savePlainCard(kind, key).catch((error) => showToast(error.message, 'error'));
      break;
    case 'plain-cancel-edit':
      if (getPlainModeConfig(kind)) {
        delete state.ui[kind].editing[key];
        renderPlainModeWorkspace(kind);
      }
      break;
    case 'plain-delete':
      deletePlainItem(kind, key).catch((error) => showToast(error.message, 'error'));
      break;
    case 'plain-page':
      if (getPlainModeConfig(kind)) {
        state.ui[kind].page = page;
        renderPlainModeWorkspace(kind);
      }
      break;
    case 'plain-filter-tag': {
      if (!getPlainModeConfig(kind)) {
        break;
      }
      const tag = actionTarget.dataset.tag || '';
      state.ui[kind].activeTags = toggleTagSelection(state.ui[kind].activeTags, tag);
      state.ui[kind].page = 1;
      renderPlainModeWorkspace(kind);
      break;
    }
    case 'plain-clear-tags':
      if (getPlainModeConfig(kind)) {
        state.ui[kind].activeTags = [];
        renderPlainModeWorkspace(kind);
      }
      break;
    case 'comments-refresh':
      commentsModule.refreshComments().catch((error) => showToast(error.message, 'error'));
      break;
    case 'comment-filter-issue':
      commentsModule.setIssueFilter(actionTarget.dataset.issueId || 'all');
      break;
    case 'comment-delete':
      commentsModule.deleteComment(actionTarget.dataset.commentId || '').catch((error) => showToast(error.message, 'error'));
      break;
    case 'suggest-tag':
      applyTagSuggestion(actionTarget.dataset.value || '');
      break;
    case 'suggest-command':
      applySlashSuggestion(actionTarget.dataset.value || '');
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

  if (target.matches('[data-setting-key]')) {
    const settingKey = target.dataset.settingKey;
    const currentValue = target.type === 'range' ? Number(target.value) : target.value;
    state.settings = {
      ...state.settings,
      [settingKey]: currentValue
    };
    persistSettings();
    applySettingsTheme();
    if (target.type === 'text') {
      renderWorkspace();
    } else {
      const valueNode = target.closest('.settings-control')?.querySelector('.settings-range-value');
      const control = settingsSchema.flatMap((section) => section.controls).find((item) => item.key === settingKey);
      if (valueNode && control) {
        valueNode.textContent = formatSettingValue(control, currentValue);
      }
    }
    return;
  }

  if (target.matches('[data-toy-picker-query]')) {
    state.commandDialog.query = target.value;
    state.commandDialog.selectedToyId = '';
    renderCommandDialog();
    return;
  }

  if (target.matches('[data-capsule-text-target]')) {
    const { owner, blockId } = parseEditorTarget(target.dataset.capsuleTextTarget);
    syncCapsuleTextBlock(owner, blockId, target.value);
    autoResizeTextarea(target, 44);
    renderCapsuleComposerTagPreview();
    if (updateSlashSuggestion(target, target.dataset.capsuleTextTarget)) {
      return;
    }
    updateTagSuggestion(target, target.dataset.capsuleTextTarget);
    return;
  }

  if (target.id === 'capsuleSearchInput') {
    state.ui.capsule.search = target.value;
    state.ui.capsule.page = 1;
    renderAfterSearchInput();
    return;
  }

  if (target.id === 'issueSearchInput') {
    state.ui.issue.search = target.value;
    state.ui.issue.page = 1;
    renderAfterSearchInput();
    return;
  }

  const plainSearchKind = ['flow', 'article', 'toy'].find((kind) => target.id === `${kind}SearchInput`);
  if (plainSearchKind) {
    state.ui[plainSearchKind].search = target.value;
    state.ui[plainSearchKind].page = 1;
    renderAfterSearchInput();
    return;
  }

  if (target.id === 'commentsSearchInput') {
    commentsModule.setSearch(target.value);
    renderAfterSearchInput();
    return;
  }

  if (target.matches('[data-issue-text-target]')) {
    const { owner, blockId } = parseEditorTarget(target.dataset.issueTextTarget);
    syncIssueBlock(owner, blockId, target.value);
    autoResizeTextarea(target, 44);
    if (owner === 'composer') {
      renderIssueComposerTagPreview();
    }
    if (updateSlashSuggestion(target, target.dataset.issueTextTarget)) {
      return;
    }
    if (updateMentionSuggestion(target, target.dataset.issueTextTarget)) {
      return;
    }
    updateTagSuggestion(target, target.dataset.issueTextTarget);
    return;
  }

  if (target.matches('[data-issue-title-target]')) {
    setIssueEditorTitle(target.dataset.issueTitleTarget || 'composer', target.value);
    return;
  }

  if (target.matches('[data-plain-editor-kind] textarea')) {
    autoResizeTextarea(target, 88);
  }
}

function handleKeyDown(event) {
  if (event.key === 'Escape') {
    if (state.commandDialog.open) {
      closeCommandDialog(null);
      return;
    }
    if (state.lightbox.open) {
      closeLightbox();
      return;
    }
    if (state.ui.settingsOpen) {
      setSettingsPanelOpen(false);
    }
    hideSuggestion();
    state.ui.capsule.selectedImageTarget = '';
  }

  const target = event.target;
  if (event.key === 'Backspace' && target instanceof HTMLTextAreaElement && target.matches('[data-issue-text-target]')) {
    if (!target.value && target.selectionStart === 0 && target.selectionEnd === 0) {
      const { owner, blockId } = parseEditorTarget(target.dataset.issueTextTarget);
      if (deletePreviousIssueBlock(owner, blockId)) {
        event.preventDefault();
      }
    }
  }

  if (event.key === 'Backspace' && target instanceof HTMLTextAreaElement && target.matches('[data-capsule-text-target]')) {
    if (!target.value && target.selectionStart === 0 && target.selectionEnd === 0) {
      const { owner, blockId } = parseEditorTarget(target.dataset.capsuleTextTarget);
      if (deletePreviousCapsuleBlock(owner, blockId)) {
        event.preventDefault();
      }
    }
  }
}

function handleDragStart(event) {
  const card = event.target.closest('[data-drag-block-id]');
  if (!card) {
    return;
  }
  state.draggingBlockId = card.dataset.dragBlockId;
  state.draggingContext = card.dataset.dragContext || 'issue';
  state.draggingOwner = card.dataset.dragOwner || '';
  card.classList.add('dragging');
}

function handleDragOver(event) {
  const zone = event.target.closest('[data-drop-index]');
  if (!zone) {
    return;
  }
  if (state.draggingContext && zone.dataset.dropContext && zone.dataset.dropContext !== state.draggingContext) {
    return;
  }
  if (state.draggingContext === 'capsule' && zone.dataset.dropOwner !== state.draggingOwner) {
    return;
  }
  if (state.draggingContext === 'issue' && state.draggingOwner && zone.dataset.dropOwner !== state.draggingOwner) {
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
  if (state.draggingContext === 'capsule') {
    moveCapsuleBlock(zone.dataset.dropOwner || 'composer', state.draggingBlockId, Number(zone.dataset.dropIndex));
  } else {
    moveIssueBlock(zone.dataset.dropOwner || 'composer', state.draggingBlockId, Number(zone.dataset.dropIndex));
  }
  state.draggingBlockId = null;
  state.draggingContext = null;
  state.draggingOwner = null;
}

function handleDragEnd() {
  state.draggingBlockId = null;
  state.draggingContext = null;
  state.draggingOwner = null;
  document.querySelectorAll('.drop-zone.active').forEach((item) => item.classList.remove('active'));
  document.querySelectorAll('.dragging').forEach((item) => item.classList.remove('dragging'));
}

async function bootstrap() {
  ensureDefaultSettingsBaseline();
  state.settings = loadStoredSettings();
  applySettingsTheme();
  renderSettingsPanel();
  renderCommandDialog();
  setSettingsPanelOpen(false);
  state.ui.issue.editor = createEmptyIssueEditor();
  state.ui.capsule.composerBlocks = [createTextBlock('')];
  await refreshDataSource();
  await refreshInbox();
  renderWorkspace();
}

document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('click', handleClick);
document.addEventListener('input', handleInput);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('dragstart', handleDragStart);
document.addEventListener('dragover', handleDragOver);
document.addEventListener('drop', handleDrop);
document.addEventListener('dragend', handleDragEnd);

bootstrap().catch((error) => showToast(error.message, 'error'));
