export const contentModes = [
  { key: 'issue', label: 'Issue', route: 'issues', collection: 'issues', className: 'issue-list', colorVar: '--issue-tab-color', colorFallback: '#86cbbf' },
  { key: 'capsule', label: 'Capsule', route: 'capsules', collection: 'capsules', className: 'capsule-list', colorVar: '--capsule-tab-color', colorFallback: '#74a7f7' },
  { key: 'flow', label: 'Flow', route: 'flows', collection: 'flows', className: 'flow-list', colorVar: '--flow-tab-color', colorFallback: '#f59e0b' },
  { key: 'article', label: 'Article', route: 'articles', collection: 'articles', className: 'article-list', colorVar: '--article-tab-color', colorFallback: '#8b5cf6' },
  { key: 'toy', label: 'Toy', route: 'toys', collection: 'toys', className: 'toy-list', colorVar: '--toy-tab-color', colorFallback: '#14b8a6' }
];

export const contentModeOrder = contentModes.map((mode) => mode.key);

export const contentModeMeta = Object.fromEntries(
  contentModes.map((mode) => [
    mode.key,
    {
      label: mode.label,
      route: mode.route,
      className: mode.className,
      colorVar: mode.colorVar,
      colorFallback: mode.colorFallback
    }
  ])
);

export const editorModes = [
  ...contentModes.map((mode) => ({ key: mode.key, label: mode.label })),
  { key: 'comments', label: 'Comments' }
];

export const collectionByKind = Object.fromEntries(
  contentModes.map((mode) => [mode.key, mode.collection])
);

export const contentCollections = contentModes.map((mode) => mode.collection);

export const visibilityKeys = ['direct', 'search', 'homepage', 'feed', 'rss'];

export const publishedSurfaceKinds = new Set(['issue', 'article']);

export function defaultVisibility(kind) {
  const isPublishedSurface = publishedSurfaceKinds.has(kind);
  return {
    direct: true,
    search: true,
    homepage: isPublishedSurface,
    feed: isPublishedSurface,
    rss: isPublishedSurface
  };
}
