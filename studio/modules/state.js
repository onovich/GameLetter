export function createInitialState(settings) {
  return {
    mode: 'issue',
    dataSource: { capsules: [], issues: [], flows: [], articles: [], columns: [], toys: [], features: {} },
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
      variant: '',
      query: '',
      selectedToyId: '',
      preview: null,
      resolve: null
    },
    settings,
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
      },
      flow: {
        page: 1,
        search: '',
        activeTags: [],
        editing: {}
      },
      article: {
        page: 1,
        search: '',
        activeTags: [],
        editing: {}
      },
      toy: {
        page: 1,
        search: '',
        activeTags: [],
        editing: {}
      },
      comments: {
        page: 1,
        search: '',
        issueFilter: 'all',
        loading: false,
        loaded: false,
        lastLoadedAt: '',
        status: null,
        error: '',
        warnings: [],
        comments: [],
        discussions: []
      }
    }
  };
}

export function toggleTagSelection(selectedTags = [], tag = '') {
  const normalizedTag = String(tag || '').trim();
  if (!normalizedTag) {
    return [...selectedTags];
  }
  const exists = selectedTags.some((item) => item.toLowerCase() === normalizedTag.toLowerCase());
  return exists
    ? selectedTags.filter((item) => item.toLowerCase() !== normalizedTag.toLowerCase())
    : [normalizedTag, ...selectedTags.filter((item) => item.toLowerCase() !== normalizedTag.toLowerCase())];
}
