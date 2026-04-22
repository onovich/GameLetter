const PAGE_SIZE = 20;
const SETTINGS_STORAGE_KEY = 'prompt-cms-style-settings';
const SETTINGS_DEFAULT_STORAGE_KEY = 'prompt-cms-style-default-settings';

const defaultSettings = {
  shellPadding: 28,
  workspaceGap: 24,
  cardRadius: 26,
  cardPadding: 20,
  thumbnailWidth: 240,
  themeTransitionMs: 420,
  shadowBlur: 50,
  shadowY: 20,
  shadowOpacity: 18,
  panelOpacity: 78,
  bgColor: '#ecf6ff',
  bgAccentColor: '#d5ebff',
  capsuleModeBgColor: '#edf2ff',
  capsuleModeBgAccentColor: '#d8dcff',
  panelColor: '#ffffff',
  cardBorderColor: '#809dc4',
  embedBorderColor: '#b4c4df',
  iconBorderColor: '#c4d4e6',
  searchBorderColor: '#bfd0e4',
  clearButtonBorderColor: '#d7dde8',
  clearButtonBgColor: '#f6f8fc',
  clearButtonTextColor: '#72839d',
  shadowColor: '#6e91be',
  capsuleModeShadowColor: '#8187d8',
  accentColor: '#74a7f7',
  capsuleTabColor: '#74a7f7',
  issueTabColor: '#86cbbf',
  linkColor: '#2f6fb2',
  linkBorderColor: '#bcd2ea',
  linkBgColor: '#f6fbff',
  headingColor: '#264056',
  textColor: '#355065',
  issueBodyColor: '#355065',
  capsuleBodyColor: '#314f77',
  mutedColor: '#7b8ca5',
  appTitleFontSize: 34,
  tabFontSize: 16,
  cardTitleFontSize: 18,
  capsuleBodyFontSize: 16,
  issueBodyFontSize: 16,
  metaFontSize: 11,
  tagFontSize: 12,
  appTitle: '编辑模式',
  capsuleSubtitle: '',
  issueSubtitle: ''
};

const settingsSchema = [
  {
    title: '通用 · 布局与动效',
    columns: 2,
    controls: [
      { key: 'shellPadding', label: '页面边距', type: 'range', min: 12, max: 48, step: 1, unit: 'px' },
      { key: 'workspaceGap', label: '三栏间距', type: 'range', min: 12, max: 36, step: 1, unit: 'px' },
      { key: 'cardRadius', label: '卡片圆角', type: 'range', min: 18, max: 34, step: 1, unit: 'px' },
      { key: 'cardPadding', label: '卡片内边距', type: 'range', min: 14, max: 28, step: 1, unit: 'px' },
      { key: 'thumbnailWidth', label: '图片缩略宽度', type: 'range', min: 180, max: 320, step: 2, unit: 'px' },
      { key: 'themeTransitionMs', label: '模式切换补间时长', type: 'range', min: 120, max: 1200, step: 20, unit: 'ms' },
      { key: 'shadowBlur', label: '通用阴影模糊', type: 'range', min: 12, max: 80, step: 1, unit: 'px' },
      { key: 'shadowY', label: '通用阴影位移', type: 'range', min: 0, max: 30, step: 1, unit: 'px' },
      { key: 'shadowOpacity', label: '通用阴影透明度', type: 'range', min: 4, max: 32, step: 1, unit: '%' }
    ]
  },
  {
    title: '通用 · 容器与边框',
    columns: 2,
    controls: [
      { key: 'panelColor', label: '卡片底色', type: 'color' },
      { key: 'panelOpacity', label: '卡片透明度', type: 'range', min: 62, max: 96, step: 1, unit: '%' },
      { key: 'cardBorderColor', label: '卡片边框', type: 'color' },
      { key: 'embedBorderColor', label: '内嵌卡片边框', type: 'color' },
      { key: 'iconBorderColor', label: '图标按钮边框', type: 'color' },
      { key: 'searchBorderColor', label: '搜索框边框', type: 'color' },
      { key: 'linkBorderColor', label: '链接卡片边框', type: 'color' },
      { key: 'linkBgColor', label: '链接卡片底色', type: 'color' },
      { key: 'clearButtonBorderColor', label: '清除按钮边框', type: 'color' },
      { key: 'clearButtonBgColor', label: '清除按钮底色', type: 'color' },
      { key: 'clearButtonTextColor', label: '清除按钮文字', type: 'color' }
    ]
  },
  {
    title: '通用 · 文字与标题',
    columns: 2,
    controls: [
      { key: 'appTitle', label: '标题栏主标题', type: 'text', span: 2 },
      { key: 'appTitleFontSize', label: '标题栏字号', type: 'range', min: 24, max: 44, step: 1, unit: 'px' },
      { key: 'tabFontSize', label: 'Tab 字号', type: 'range', min: 13, max: 20, step: 1, unit: 'px' },
      { key: 'cardTitleFontSize', label: '卡片标题字号', type: 'range', min: 14, max: 24, step: 1, unit: 'px' },
      { key: 'metaFontSize', label: '时间/状态字号', type: 'range', min: 10, max: 16, step: 1, unit: 'px' },
      { key: 'tagFontSize', label: 'Tag 字号', type: 'range', min: 10, max: 16, step: 1, unit: 'px' },
      { key: 'accentColor', label: '通用强调色', type: 'color' },
      { key: 'linkColor', label: '链接文字颜色', type: 'color' },
      { key: 'headingColor', label: '标题颜色', type: 'color' },
      { key: 'mutedColor', label: '说明文字颜色', type: 'color' }
    ]
  },
  {
    title: 'Capsule 专属',
    columns: 2,
    controls: [
      { key: 'capsuleModeBgColor', label: 'Capsule 模式背景主色', type: 'color' },
      { key: 'capsuleModeBgAccentColor', label: 'Capsule 模式背景高光', type: 'color' },
      { key: 'capsuleModeShadowColor', label: 'Capsule 模式卡片阴影', type: 'color' },
      { key: 'capsuleTabColor', label: 'Capsule Tab 选中色', type: 'color' },
      { key: 'capsuleBodyColor', label: 'Capsule 正文颜色', type: 'color' },
      { key: 'capsuleBodyFontSize', label: 'Capsule 正文字号', type: 'range', min: 13, max: 22, step: 1, unit: 'px' }
    ]
  },
  {
    title: 'Issue 专属',
    columns: 2,
    controls: [
      { key: 'bgColor', label: 'Issue 背景主色', type: 'color' },
      { key: 'bgAccentColor', label: 'Issue 背景高光', type: 'color' },
      { key: 'shadowColor', label: 'Issue 阴影颜色', type: 'color' },
      { key: 'issueTabColor', label: 'Issue Tab 颜色', type: 'color' },
      { key: 'issueBodyColor', label: 'Issue 正文颜色', type: 'color' },
      { key: 'issueBodyFontSize', label: 'Issue 正文字号', type: 'range', min: 13, max: 22, step: 1, unit: 'px' }
    ]
  }
];

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

const state = {
  mode: 'capsule',
  dataSource: { capsules: [], issues: [], features: {} },
  inboxFiles: [],
  draggingBlockId: null,
  draggingContext: null,
  draggingOwner: null,
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
  lightbox: {
    open: false,
    url: '',
    caption: ''
  },
  commandDialog: {
    open: false,
    title: '',
    fields: [],
    resolve: null
  },
  settings: loadStoredSettings(),
  ui: {
    settingsOpen: false,
    capsule: {
      composerBlocks: [],
      page: 1,
      search: '',
      activeTags: [],
      expanded: {},
      editing: {},
      editBlocks: {},
      focusTarget: '',
      selectedImageTarget: ''
    },
    issue: {
      page: 1,
      search: '',
      activeTags: [],
      expandedPreview: {},
      editor: null,
      editing: {},
      editTitles: {},
      editBlocks: {},
      focusTarget: ''
    }
  }
};

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
      resolve
    };
    renderCommandDialog();
  });
}

function closeCommandDialog(result = null) {
  const resolver = state.commandDialog.resolve;
  state.commandDialog = {
    open: false,
    title: '',
    fields: [],
    resolve: null
  };
  renderCommandDialog();
  if (resolver) {
    resolver(result);
  }
}

function confirmCommandDialog() {
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

function isLikelyImageUrl(url = '') {
  if (!url) {
    return false;
  }
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url)
    || /images\.unsplash\.com|cdn\.|image\.|imgur\.com|cloudinary\.com/i.test(url);
}

function isLikelyWebUrl(url = '') {
  return /^https?:\/\/\S+$/i.test(String(url || '').trim());
}

function getCapsuleTextFromBlocks(blocks = []) {
  return blocks
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
      return block.title || block.text || '';
    })
    .join('\n\n')
    .trim();
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

function applyPanguSpacing(value = '') {
  return String(value)
    .replace(/([\u2e80-\u9fff])([A-Za-z0-9]+)/g, '$1 $2')
    .replace(/([A-Za-z0-9]+)([\u2e80-\u9fff])/g, '$1 $2');
}

function renderTextContent(value = '') {
  return escapeHtml(applyPanguSpacing(value));
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

function normalizeLineEndings(value = '') {
  return String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
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

  if (marker === '[图片]') {
    return createImageBlock(fields.url || '', fields.caption || '');
  }

  if (marker === '[链接]') {
    return createLinkBlock(fields.text || fields.title || fields.url || '', fields.url || '');
  }

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

  if (isLikelyImageUrl(normalized)) {
    return createImageBlock(normalized, '');
  }

  if (isLikelyWebUrl(normalized)) {
    return createLinkBlock(normalized, normalized);
  }

  return createTextBlock(normalized);
}

function parseCapsuleBodyToBlocks(body = '') {
  const normalizedBody = normalizeLineEndings(body);
  const blocks = normalizedBody
    .split(/\n{2,}/)
    .map((chunk) => parseChunkToBlock(chunk))
    .filter(Boolean);
  return blocks.length ? blocks : [createTextBlock('')];
}

function normalizePublishedCapsuleBlock(block) {
  if (!block) {
    return null;
  }

  if (typeof block === 'string') {
    return parseChunkToBlock(block);
  }

  const type = String(block.type || '').trim();
  if (type === 'image') {
    const imageUrl = String(block.url || block.image || block.src || '').trim();
    return imageUrl ? createImageBlock(imageUrl, block.caption || block.text || '') : null;
  }

  if (type === 'link') {
    const url = String(block.url || '').trim();
    const text = String(block.text || block.title || block.label || url).trim();
    return url || text ? createLinkBlock(text, url) : null;
  }

  if (type === 'text' || type === 'note' || type === 'thought') {
    return createTextBlock(block.text || block.content || '');
  }

  if (String(block.content || '').trim()) {
    return createTextBlock(block.content);
  }

  return null;
}

function serializeCapsuleBlocks(blocks = []) {
  return blocks
    .map((block) => {
      if (block.type === 'image') {
        return [
          '[图片]',
          `url: ${String(block.url || '').trim()}`,
          `caption: ${String(block.caption || '').trim()}`
        ].join('\n').trim();
      }
      if (block.type === 'link') {
        return [
          '[链接]',
          `text: ${String(block.text || '').trim()}`,
          `url: ${String(block.url || '').trim()}`
        ].join('\n').trim();
      }
      return String(block.text || '').trim();
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function getPublishedCapsuleBlocks(capsule) {
  if (!capsule) {
    return [createTextBlock('')];
  }

  const payload = capsule.payload || {};
  const normalizedBlocks = [
    ...(Array.isArray(capsule.blocks) ? capsule.blocks : []),
    ...(Array.isArray(payload.blocks) ? payload.blocks : [])
  ]
    .map((block) => normalizePublishedCapsuleBlock(block))
    .filter(Boolean);

  if (normalizedBlocks.length) {
    return normalizedBlocks;
  }

  const serializedBody = [capsule.body, capsule.content, payload.body]
    .find((value) => typeof value === 'string' && String(value).trim());

  if (serializedBody) {
    return parseCapsuleBodyToBlocks(serializedBody);
  }

  const blocks = [];

  if (payload.type === 'image' && payload.url) {
    blocks.push(createImageBlock(payload.url, payload.caption || capsule.title || ''));
  }

  if (payload.image) {
    blocks.push(createImageBlock(payload.image, payload.caption || capsule.title || ''));
  }

  if (payload.content) {
    blocks.push(createTextBlock(payload.content));
  }
  if (payload.caption && payload.type !== 'image') {
    blocks.push(createTextBlock(payload.caption));
  }
  if (payload.commentary) {
    blocks.push(createTextBlock(payload.commentary));
  }
  if (payload.url && payload.type !== 'image') {
    blocks.push(createTextBlock(payload.url));
  }

  return blocks.length ? blocks : [createTextBlock(capsule.summary || capsule.title || '')];
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

function formatFlowTime(item) {
  const flowTime = item.createdAt || item.updatedAt;
  return new Date(flowTime).toLocaleString('zh-CN');
}

function renderModeNavigation() {
  if (!elements.modeNav.querySelector('.mode-tabs')) {
    elements.modeNav.innerHTML = `
      <section class="card nav-card">
        <nav class="mode-tabs" aria-label="编辑模式切换">
          <span class="mode-tab-indicator" aria-hidden="true"></span>
          <button id="tabCapsule" class="mode-tab" type="button">Capsule</button>
          <button id="tabIssue" class="mode-tab" type="button">Issue</button>
        </nav>
      </section>
    `;
    elements.tabCapsule = document.getElementById('tabCapsule');
    elements.tabIssue = document.getElementById('tabIssue');
  }

  const modeTabs = elements.modeNav.querySelector('.mode-tabs');
  if (!modeTabs) {
    return;
  }
  modeTabs.classList.toggle('capsule-active', state.mode === 'capsule');
  modeTabs.classList.toggle('issue-active', state.mode === 'issue');
  modeTabs.dataset.mode = state.mode;
  elements.tabCapsule?.classList.toggle('active', state.mode === 'capsule');
  elements.tabIssue?.classList.toggle('active', state.mode === 'issue');
}

function getCapsuleMap() {
  return new Map((state.dataSource.capsules || []).map((item) => [item.id, item]));
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
    : searched.filter((item) => item.tags.some((tag) => selectedTags.some((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase())));

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
    : filtered.filter((item) => item.tags.some((tag) => selectedTags.some((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase())));
  return tagFiltered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
  getCapsuleDrafts().forEach((draft) => draft.tags.forEach(addTag));
  getIssueDrafts().forEach((draft) => draft.tags.forEach(addTag));
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
  getCapsuleDrafts().forEach((draft) => draft.tags.forEach(addTag));
  getIssueDrafts().forEach((draft) => draft.tags.forEach(addTag));
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
        { id: 'link', description: '插入链接卡片并填写标题与地址' }
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
  const suggestionSnapshot = { ...state.suggestion };
  const image = await collectImageBlockInput();
  if (!image?.url) {
    hideSuggestion();
    return;
  }
  const blocks = [...getCapsuleEditorBlocks(owner)];
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
    nextBlocks.push(createImageBlock(image.url, image.caption));
    const trailingTextBlock = createTextBlock('');
    nextBlocks.push(trailingTextBlock);
    state.ui.capsule.focusTarget = `${owner}:${trailingTextBlock.id}`;
  });

  setCapsuleEditorBlocks(owner, nextBlocks);
  renderCapsuleWorkspace();
  hideSuggestion();
}

async function insertCapsuleLinkFromCommand(owner, blockId) {
  const suggestionSnapshot = { ...state.suggestion };
  const link = await collectLinkBlockInput();
  if (!link) {
    hideSuggestion();
    return;
  }
  const blocks = [...getCapsuleEditorBlocks(owner)];
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
    state.ui.capsule.focusTarget = `${owner}:${trailingTextBlock.id}`;
  });

  setCapsuleEditorBlocks(owner, nextBlocks);
  renderCapsuleWorkspace();
  hideSuggestion();
}

async function insertIssueLinkFromCommand(owner, blockId) {
  const suggestionSnapshot = { ...state.suggestion };
  const link = await collectLinkBlockInput();
  if (!link) {
    hideSuggestion();
    return;
  }
  const blocks = [...getIssueEditorBlocks(owner)];
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

  setIssueEditorBlocks(owner, nextBlocks);
  renderIssueWorkspace();
  hideSuggestion();
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
  if (owner === 'composer') {
    if (!state.ui.capsule.composerBlocks.length) {
      state.ui.capsule.composerBlocks = [createTextBlock('')];
    }
    return state.ui.capsule.composerBlocks;
  }
  if (!state.ui.capsule.editBlocks[owner]?.length) {
    const item = getCapsuleItemByKey(owner);
    state.ui.capsule.editBlocks[owner] = cloneBlocks(item?.blocks || [createTextBlock('')]);
  }
  return state.ui.capsule.editBlocks[owner];
}

function setCapsuleEditorBlocks(owner, blocks) {
  const normalized = blocks.length ? blocks : [createTextBlock('')];
  if (owner === 'composer') {
    state.ui.capsule.composerBlocks = normalized;
    return;
  }
  state.ui.capsule.editBlocks[owner] = normalized;
}

function findCapsuleBlock(owner, blockId) {
  return getCapsuleEditorBlocks(owner).find((block) => block.id === blockId);
}

function syncCapsuleTextBlock(owner, blockId, text) {
  const block = findCapsuleBlock(owner, blockId);
  if (block) {
    block.text = text;
  }
}

function syncCapsuleImageBlock(owner, blockId, field, value) {
  const block = findCapsuleBlock(owner, blockId);
  if (block) {
    block[field] = value;
  }
}

function updateCapsuleImage(owner, blockId) {
  const block = findCapsuleBlock(owner, blockId);
  if (!block) {
    return;
  }
  collectImageBlockInput({ url: block.url || '', caption: block.caption || '' }).then((image) => {
    if (!image) {
      return;
    }
    block.url = image.url;
    block.caption = image.caption;
    renderCapsuleWorkspace();
  });
}

function updateCapsuleLink(owner, blockId) {
  const block = findCapsuleBlock(owner, blockId);
  if (!block) {
    return;
  }
  collectLinkBlockInput({ text: block.text || '', url: block.url || '' }).then((link) => {
    if (!link) {
      return;
    }
    block.text = link.text || link.url;
    block.url = link.url;
    renderCapsuleWorkspace();
  });
}

function setSelectedCapsuleImage(owner, blockId) {
  const nextValue = `${owner}:${blockId}`;
  state.ui.capsule.selectedImageTarget = state.ui.capsule.selectedImageTarget === nextValue ? '' : nextValue;
  renderCapsuleWorkspace();
}

function addCapsuleTextBlock(owner) {
  const block = createTextBlock('');
  setCapsuleEditorBlocks(owner, [...getCapsuleEditorBlocks(owner), block]);
  state.ui.capsule.focusTarget = `${owner}:${block.id}`;
  renderCapsuleWorkspace();
}

function insertCapsuleTextBlock(owner, index) {
  const blocks = [...getCapsuleEditorBlocks(owner)];
  if (!canInsertBetweenBlocks(blocks, index)) {
    showToast('两个空白 block 之间不能继续新增。', 'error');
    return;
  }
  const block = createTextBlock('');
  blocks.splice(index, 0, block);
  setCapsuleEditorBlocks(owner, blocks);
  state.ui.capsule.focusTarget = `${owner}:${block.id}`;
  renderCapsuleWorkspace();
}

function addCapsuleImageBlock(owner) {
  const block = createImageBlock('', '');
  setCapsuleEditorBlocks(owner, [...getCapsuleEditorBlocks(owner), block]);
  renderCapsuleWorkspace();
}

function removeCapsuleBlock(owner, blockId) {
  setCapsuleEditorBlocks(owner, getCapsuleEditorBlocks(owner).filter((block) => block.id !== blockId));
  if (state.ui.capsule.selectedImageTarget === `${owner}:${blockId}`) {
    state.ui.capsule.selectedImageTarget = '';
  }
  renderCapsuleWorkspace();
}

function moveCapsuleBlock(owner, blockId, insertIndex) {
  const blocks = [...getCapsuleEditorBlocks(owner)];
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
  setCapsuleEditorBlocks(owner, blocks);
  renderCapsuleWorkspace();
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
  const container = document.getElementById('capsuleTagPreview');
  if (!container) {
    return;
  }
  const tags = extractCapsuleTagsFromBlocks(getCapsuleEditorBlocks('composer'));
  container.innerHTML = tags.map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('');
}

function renderIssueComposerTagPreview() {
  const container = document.getElementById('issueTagPreview');
  if (!container) {
    return;
  }
  const tags = extractIssueTagsFromBlocks(getIssueEditorBlocks('composer'));
  container.innerHTML = tags.map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('');
}

function getCapsuleItemByKey(key) {
  return buildCapsuleItems().find((item) => item.key === key);
}

function getIssueItemByKey(key) {
  return buildIssueItems().find((item) => item.key === key);
}

function getInboxFileByName(fileName = '') {
  return state.inboxFiles.find((file) => file.fileName === fileName) || null;
}

function getCapsuleBlocksForEditing(item) {
  const draft = item?.fileName ? getInboxFileByName(item.fileName) : null;
  if (draft?.body) {
    return parseCapsuleBodyToBlocks(draft.body);
  }
  return cloneBlocks(item?.blocks || [createTextBlock('')]);
}

function getIssueBlocksForEditing(item) {
  const draft = item?.fileName ? getInboxFileByName(item.fileName) : null;
  if (draft?.body) {
    return parseIssueBodyToBlocks(draft.body);
  }
  return cloneBlocks(item?.blocks || [createTextBlock('')]);
}

function getIssueEditorBlocks(owner = 'composer') {
  if (owner === 'composer') {
    return state.ui.issue.editor?.blocks || [createTextBlock('')];
  }
  if (!state.ui.issue.editBlocks[owner]) {
    const item = getIssueItemByKey(owner);
    state.ui.issue.editBlocks[owner] = getIssueBlocksForEditing(item);
  }
  return state.ui.issue.editBlocks[owner];
}

function setIssueEditorBlocks(owner = 'composer', blocks = [createTextBlock('')]) {
  const safeBlocks = blocks.length ? blocks : [createTextBlock('')];
  if (owner === 'composer') {
    if (!state.ui.issue.editor) {
      state.ui.issue.editor = createEmptyIssueEditor();
    }
    state.ui.issue.editor.blocks = safeBlocks;
    return;
  }
  state.ui.issue.editBlocks[owner] = safeBlocks;
}

function cancelCapsuleEditing(key) {
  delete state.ui.capsule.editing[key];
  delete state.ui.capsule.editBlocks[key];
  renderCapsuleWorkspace();
}

function cancelIssueEditing(key) {
  delete state.ui.issue.editing[key];
  delete state.ui.issue.editBlocks[key];
  delete state.ui.issue.editTitles[key];
  renderIssueWorkspace();
}

function resetIssueEditor() {
  state.ui.issue.editor = createEmptyIssueEditor();
  renderIssueWorkspace();
}

function deletePreviousIssueBlock(owner, blockId) {
  const blocks = [...getIssueEditorBlocks(owner)];
  const index = blocks.findIndex((block) => block.id === blockId);
  if (index <= 0) {
    return false;
  }
  blocks.splice(index - 1, 1);
  setIssueEditorBlocks(owner, blocks);
  state.ui.issue.focusTarget = `${owner}:${blockId}`;
  renderIssueWorkspace();
  return true;
}

function deletePreviousCapsuleBlock(owner, blockId) {
  const blocks = [...getCapsuleEditorBlocks(owner)];
  const index = blocks.findIndex((block) => block.id === blockId);
  if (index <= 0) {
    return false;
  }
  blocks.splice(index - 1, 1);
  setCapsuleEditorBlocks(owner, blocks);
  state.ui.capsule.focusTarget = `${owner}:${blockId}`;
  renderCapsuleWorkspace();
  return true;
}

async function refreshInbox() {
  const result = await requestJson('/api/inbox');
  state.inboxFiles = result.files.map(normalizeInboxFile);
}

async function saveTask({ kind, action, target = 'auto', title = '', body, fileName = '', tags = [], createdAt = '' }) {
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
      createdAt: stableCreatedAt
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

function renderCapsuleDisplayBlocks(blocks, expanded = false) {
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

function renderCapsulePreviewBlocks(blocks = [], fallbackText = '') {
  const previewBlocks = [];
  const firstMedia = blocks.find((block) => block.type === 'image' || block.type === 'link');
  const firstText = blocks.find((block) => block.type === 'text' && String(block.text || '').trim());

  if (firstMedia) {
    previewBlocks.push(firstMedia.type === 'image' ? renderImagePreviewMarkup(firstMedia) : renderLinkPreviewMarkup(firstMedia));
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

function getCapsulePreviewText(blocks = [], fallbackText = '') {
  const firstText = blocks.find((block) => block.type === 'text' && String(block.text || '').trim());
  if (firstText) {
    return firstText.text || '';
  }
  return String(fallbackText || '').trim();
}

function renderCapsuleEditorBlocks(owner, blocks) {
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

function renderCapsuleCard(item) {
  const expanded = Boolean(state.ui.capsule.expanded[item.key]);
  const editing = Boolean(state.ui.capsule.editing[item.key]);
  const blocks = editing ? getCapsuleEditorBlocks(item.key) : item.blocks;
  const tags = editing ? extractCapsuleTagsFromBlocks(blocks) : (item.tags || []);
  const previewText = editing ? '' : getCapsulePreviewText(blocks, item.text);
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
          ${renderCapsuleEditorBlocks(item.key, blocks)}
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
        <div class="capsule-render-stack">${expanded ? renderCapsuleDisplayBlocks(blocks, true) : renderCapsulePreviewBlocks(blocks, item.text)}</div>
        <div class="card-bottom-row">
          <div class="item-tags">${tags.map((tag) => `<button class="tag-chip ${state.ui.capsule.activeTags.some((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase()) ? 'active' : ''}" data-action="capsule-filter-tag" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join('')}</div>
          <div class="card-tools">
            ${blocks.some((block) => block.type === 'text' && capsuleNeedsCollapse(block.text || '')) ? `<button class="ghost small compact-tool" data-action="capsule-toggle-expand" data-key="${item.key}">${expanded ? '收起' : '展开'}</button>` : ''}
            ${item.status !== 'pendingDelete' ? `<button class="ghost small icon-button compact-tool" data-action="capsule-edit" data-key="${item.key}" aria-label="编辑 Capsule">✎</button>` : ''}
            <button class="ghost small icon-button compact-tool danger" data-action="capsule-delete" data-key="${item.key}" aria-label="删除 Capsule">${item.status === 'pendingDelete' ? '↺' : '🗑'}</button>
          </div>
        </div>
      `}
    </article>
  `;
}

function renderCapsuleWorkspace() {
  renderModeNavigation();
  const settings = state.settings;
  const items = buildCapsuleItems();
  const { currentPage, totalPages, entries } = paginate(items, state.ui.capsule.page);
  state.ui.capsule.page = currentPage;
  const selectedCapsuleTags = state.ui.capsule.activeTags || [];

  elements.modeSubtitle.textContent = '';
  elements.modePrimary.innerHTML = `
    <section class="card composer-card section-card">
      <div class="capsule-block-list">
        ${renderCapsuleEditorBlocks('composer', getCapsuleEditorBlocks('composer'))}
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
        ${entries.length ? entries.map(renderCapsuleCard).join('') : '<div class="empty-card"><h3>还没有 Capsule</h3><p class="hint">上面写一条内容，点击发布后就会出现在这里。</p></div>'}
      </div>
      ${renderPagination(currentPage, totalPages, 'capsule-page')}
    </section>
  `;

  const tagCounts = getTagCounts();
  elements.modeSide.innerHTML = renderTagSidebar({
    selectedTags: selectedCapsuleTags,
    tagCounts,
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
    renderCapsuleComposerTagPreview();
  });
}

function renderIssueCapsuleBlock(owner, block, expanded) {
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

function getIssueEditorTitle(owner = 'composer') {
  if (owner === 'composer') {
    return state.ui.issue.editor?.title || '';
  }
  return state.ui.issue.editTitles[owner] || '';
}

function setIssueEditorTitle(owner = 'composer', title = '') {
  if (owner === 'composer') {
    if (!state.ui.issue.editor) {
      state.ui.issue.editor = createEmptyIssueEditor();
    }
    state.ui.issue.editor.title = title;
    return;
  }
  state.ui.issue.editTitles[owner] = title;
}

function renderIssueTitleField(owner, value = '', placeholder = '输入 Issue 标题') {
  return `
    <div class="issue-title-shell">
      <input class="issue-title-input" data-issue-title-target="${owner}" type="text" value="${escapeHtml(value || '')}" placeholder="${escapeHtml(placeholder)}" />
    </div>
  `;
}

function renderIssueEditorBlocks(owner, blocks) {
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
      return `${dropBefore}${renderIssueCapsuleBlock(owner, block, Boolean(state.ui.issue.expandedPreview[block.id]))}`;
    })
    .join('') + `<button class="block-insert-anchor" data-action="issue-insert-block" data-owner="${owner}" data-index="${blocks.length}" data-drop-index="${blocks.length}" data-drop-context="issue" data-drop-owner="${owner}" aria-label="在这里插入内容"></button>`;
}

function renderIssueCard(item) {
  const editing = Boolean(state.ui.issue.editing[item.key]);
  const blocks = editing ? getIssueEditorBlocks(item.key) : item.blocks;
  const tags = editing ? extractIssueTagsFromBlocks(blocks) : (item.tags || []);
  return `
    <article class="issue-list-item ${item.status} ${editing ? 'editing' : ''}">
      <div class="item-head">
        <div class="item-main">
          ${editing
            ? renderIssueTitleField(item.key, getIssueEditorTitle(item.key), '点击输入标题')
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
          ${renderIssueEditorBlocks(item.key, blocks)}
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
            ${item.status !== 'pendingDelete' ? `<button class="ghost small icon-button compact-tool" data-action="issue-load" data-key="${item.key}" aria-label="编辑 Issue">✎</button>` : ''}
            <button class="ghost small icon-button compact-tool danger" data-action="issue-delete" data-key="${item.key}" aria-label="删除 Issue">${item.status === 'pendingDelete' ? '↺' : '🗑'}</button>
          </div>
        </div>
      `}
    </article>
  `;
}

function renderIssueWorkspace() {
  renderModeNavigation();
  const settings = state.settings;
  const editor = state.ui.issue.editor;
  const blocksHtml = renderIssueEditorBlocks('composer', editor.blocks);

  const items = buildIssueItems();
  const { currentPage, totalPages, entries } = paginate(items, state.ui.issue.page);
  state.ui.issue.page = currentPage;
  const selectedIssueTags = state.ui.issue.activeTags || [];

  elements.modeSubtitle.textContent = '';
  elements.modePrimary.innerHTML = `
    <section class="card issue-editor-card section-card">
      ${renderIssueTitleField('composer', editor.title || '', '输入这一期的标题')}
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
        ${entries.length ? entries.map(renderIssueCard).join('') : '<div class="empty-card"><h3>还没有 Issue</h3><p class="hint">开始写一篇内容，保存后就会出现在这里。</p></div>'}
      </div>
      ${renderPagination(currentPage, totalPages, 'issue-page')}
    </section>
  `;
  elements.modeSide.innerHTML = renderTagSidebar({
    selectedTags: selectedIssueTags,
    tagCounts: getIssueTagCounts(),
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
    renderIssueComposerTagPreview();
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
  const blocks = getCapsuleEditorBlocks('composer');
  const body = serializeCapsuleBlocks(blocks);
  if (!body) {
    showToast('先写点内容，再发布。', 'error');
    return;
  }
  await saveTask({ kind: 'capsule', action: 'create', target: 'auto', body, tags: extractCapsuleTagsFromBlocks(blocks) });
  state.ui.capsule.composerBlocks = [createTextBlock('')];
  renderWorkspace();
  showToast('已加入待发布列表');
}

async function saveCapsuleCard(key) {
  const item = getCapsuleItemByKey(key);
  const blocks = getCapsuleEditorBlocks(key);
  const body = serializeCapsuleBlocks(blocks);
  if (!item || !body) {
    showToast('内容不能为空。', 'error');
    return;
  }
  if (item.status === 'pendingPublish' && item.fileName) {
    await saveTask({ kind: 'capsule', action: 'create', target: 'auto', body, fileName: item.fileName, tags: extractCapsuleTagsFromBlocks(blocks), createdAt: item.createdAt });
  } else {
    await saveTask({ kind: 'capsule', action: 'update', target: item.id, body, fileName: item.fileName || `update-${item.id}.md`, tags: extractCapsuleTagsFromBlocks(blocks), createdAt: item.createdAt });
  }
  delete state.ui.capsule.editing[key];
  delete state.ui.capsule.editBlocks[key];
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
  if (item.status === 'pendingDelete' && item.fileName) {
    await deleteDraft(item.fileName);
    renderWorkspace();
    showToast('已取消删除任务');
    return;
  }
  await saveTask({ kind: 'capsule', action: 'delete', target: item.id, body: `删除 Capsule：${item.id}`, fileName: item.fileName || `delete-${item.id}.md`, createdAt: item.createdAt });
  renderWorkspace();
  showToast('已标记为待删除');
}

async function saveIssueEditor() {
  const editor = state.ui.issue.editor;
  const body = serializeIssueBlocks(editor.blocks);
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
    tags: extractIssueTagsFromBlocks(editor.blocks),
    createdAt: editor.createdAt || ''
  });
  state.ui.issue.editor = createEmptyIssueEditor();
  renderIssueWorkspace();
  showToast('已加入待发布列表');
}

async function saveIssueCard(key) {
  const item = getIssueItemByKey(key);
  const blocks = getIssueEditorBlocks(key);
  const body = serializeIssueBlocks(blocks);
  const title = String(getIssueEditorTitle(key) || '').trim() || inferTitleFromBlocks(blocks, item?.title || '未命名 Issue');
  if (!item || !body.trim()) {
    showToast('内容不能为空。', 'error');
    return;
  }
  if (item.status === 'pendingPublish' && item.fileName) {
    await saveTask({ kind: 'issue', action: 'create', target: 'auto', title, body, fileName: item.fileName, tags: extractIssueTagsFromBlocks(blocks), createdAt: item.createdAt });
  } else {
    await saveTask({ kind: 'issue', action: 'update', target: item.id, title, body, fileName: item.fileName || `update-${item.id}.md`, tags: extractIssueTagsFromBlocks(blocks), createdAt: item.createdAt });
  }
  delete state.ui.issue.editing[key];
  delete state.ui.issue.editBlocks[key];
  delete state.ui.issue.editTitles[key];
  renderIssueWorkspace();
  showToast(item.status === 'pendingPublish' ? '已更新待发布 Issue' : '已保存，状态已更新为待刷新');
}

async function deleteIssueItem(key) {
  const item = getIssueItemByKey(key);
  if (!item) {
    return;
  }
  if (item.status === 'pendingPublish' && item.fileName) {
    await deleteDraft(item.fileName);
    delete state.ui.issue.editing[key];
    delete state.ui.issue.editBlocks[key];
    delete state.ui.issue.editTitles[key];
    renderIssueWorkspace();
    showToast('已删除待发布 Issue');
    return;
  }
  if (item.status === 'pendingDelete' && item.fileName) {
    await deleteDraft(item.fileName);
    delete state.ui.issue.editing[key];
    delete state.ui.issue.editBlocks[key];
    delete state.ui.issue.editTitles[key];
    renderIssueWorkspace();
    showToast('已取消删除任务');
    return;
  }
  await saveTask({ kind: 'issue', action: 'delete', target: item.id, body: `删除 Issue：${item.id}`, fileName: item.fileName || `delete-${item.id}.md`, createdAt: item.createdAt });
  delete state.ui.issue.editing[key];
  delete state.ui.issue.editBlocks[key];
  delete state.ui.issue.editTitles[key];
  renderIssueWorkspace();
  showToast('已标记为待删除');
}

function removeIssueBlock(owner, blockId) {
  const blocks = getIssueEditorBlocks(owner).filter((block) => block.id !== blockId);
  setIssueEditorBlocks(owner, blocks);
  renderIssueWorkspace();
}

function findIssueBlock(owner, blockId) {
  return getIssueEditorBlocks(owner).find((block) => block.id === blockId);
}

function updateIssueLink(owner, blockId) {
  const block = findIssueBlock(owner, blockId);
  if (!block) {
    return;
  }
  collectLinkBlockInput({ text: block.text || '', url: block.url || '' }).then((link) => {
    if (!link) {
      return;
    }
    block.text = link.text || link.url;
    block.url = link.url;
    renderIssueWorkspace();
  });
}

function insertIssueBlock(owner, index) {
  const currentBlocks = [...getIssueEditorBlocks(owner)];
  if (!canInsertBetweenBlocks(currentBlocks, index)) {
    showToast('两个空白 block 之间不能继续新增。', 'error');
    return;
  }
  const block = createTextBlock('');
  const blocks = currentBlocks;
  blocks.splice(index, 0, block);
  setIssueEditorBlocks(owner, blocks);
  state.ui.issue.focusTarget = `${owner}:${block.id}`;
  renderIssueWorkspace();
}

function moveIssueBlock(owner, blockId, insertIndex) {
  const blocks = [...getIssueEditorBlocks(owner)];
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
  setIssueEditorBlocks(owner, blocks);
  renderIssueWorkspace();
}

function syncIssueBlock(owner, blockId, text) {
  const block = getIssueEditorBlocks(owner).find((item) => item.id === blockId);
  if (block) {
    block.text = text;
  }
}

function setMode(mode) {
  state.mode = mode;
  applySettingsTheme();
  renderWorkspace();
}

function renderAfterSearchInput() {
  renderWorkspace();
  requestAnimationFrame(() => {
    const searchInput = document.getElementById(state.mode === 'capsule' ? 'capsuleSearchInput' : 'issueSearchInput');
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

  if (event.target.closest('#tabCapsule')) {
    setMode('capsule');
    return;
  }

  if (event.target.closest('#tabIssue')) {
    setMode('issue');
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
      const exists = state.ui.capsule.activeTags.some((item) => item.toLowerCase() === tag.toLowerCase());
      state.ui.capsule.activeTags = exists
        ? state.ui.capsule.activeTags.filter((item) => item.toLowerCase() !== tag.toLowerCase())
        : [tag, ...state.ui.capsule.activeTags.filter((item) => item.toLowerCase() !== tag.toLowerCase())];
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
      const exists = state.ui.issue.activeTags.some((item) => item.toLowerCase() === tag.toLowerCase());
      state.ui.issue.activeTags = exists
        ? state.ui.issue.activeTags.filter((item) => item.toLowerCase() !== tag.toLowerCase())
        : [tag, ...state.ui.issue.activeTags.filter((item) => item.toLowerCase() !== tag.toLowerCase())];
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
  const data = await requestJson('/api/data-source');
  state.dataSource = data;
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
