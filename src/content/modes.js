export const modeOrder = ['issue', 'capsule', 'flow', 'article', 'toy'];

export const modeMeta = {
  issue: { label: 'Issue', route: 'issues', className: 'issue-list', colorVar: '--issue-tab-color' },
  capsule: { label: 'Capsule', route: 'capsules', className: 'capsule-list', colorVar: '--capsule-tab-color' },
  flow: { label: 'Flow', route: 'flows', className: 'flow-list', colorVar: '--flow-tab-color' },
  article: { label: 'Article', route: 'articles', className: 'article-list', colorVar: '--article-tab-color' },
  toy: { label: 'Toy', route: 'toys', className: 'toy-list', colorVar: '--toy-tab-color' }
};

export function normalizeMode(kind) {
  return modeMeta[kind] ? kind : 'issue';
}

export function parseHashRoute(hash) {
  const normalized = hash.replace(/^#/, '');
  const parts = normalized.split('/').filter(Boolean);

  const match = Object.entries(modeMeta).find(([, meta]) => meta.route === parts[0]);
  if (match && parts[1]) {
    return { kind: match[0], slug: decodeURIComponent(parts[1]) };
  }

  return { kind: 'home', slug: '' };
}

export function getCurrentRoute() {
  if (typeof window === 'undefined') {
    return { kind: 'home', slug: '' };
  }
  return parseHashRoute(window.location.hash);
}

export function buildHash(kind, slug) {
  return `/${modeMeta[normalizeMode(kind)].route}/${encodeURIComponent(slug)}`;
}
