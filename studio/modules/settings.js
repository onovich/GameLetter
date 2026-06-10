export const PAGE_SIZE = 20;
export const SETTINGS_STORAGE_KEY = 'prompt-cms-style-settings';
export const SETTINGS_DEFAULT_STORAGE_KEY = 'prompt-cms-style-default-settings';

export const editorModes = [
  { key: 'issue', label: 'Issue' },
  { key: 'capsule', label: 'Capsule' },
  { key: 'flow', label: 'Flow' },
  { key: 'article', label: 'Article' },
  { key: 'toy', label: 'Toy' }
];

export const defaultSettings = {
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
  flowTabColor: '#f59e0b',
  articleTabColor: '#8b5cf6',
  toyTabColor: '#14b8a6',
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

export const settingsSchema = [
  {
    title: '通用 / 布局与动效',
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
    title: '通用 / 容器与边框',
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
    title: '通用 / 文字与标题',
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
