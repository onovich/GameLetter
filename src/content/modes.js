export const modeOrder = ['issue', 'capsule', 'flow', 'article', 'toy'];

export const modeMeta = {
  issue: { label: 'Issue', route: 'issues', className: 'issue-list', colorVar: '--issue-tab-color', colorFallback: '#86cbbf' },
  capsule: { label: 'Capsule', route: 'capsules', className: 'capsule-list', colorVar: '--capsule-tab-color', colorFallback: '#74a7f7' },
  flow: { label: 'Flow', route: 'flows', className: 'flow-list', colorVar: '--flow-tab-color', colorFallback: '#f59e0b' },
  article: { label: 'Article', route: 'articles', className: 'article-list', colorVar: '--article-tab-color', colorFallback: '#8b5cf6' },
  toy: { label: 'Toy', route: 'toys', className: 'toy-list', colorVar: '--toy-tab-color', colorFallback: '#14b8a6' }
};

export function normalizeMode(kind) {
  return modeMeta[kind] ? kind : 'issue';
}

export function parseHashRoute(hash) {
  const normalized = hash.replace(/^#/, '');
  const parts = normalized.split('/').filter(Boolean);

  const match = Object.entries(modeMeta).find(([, meta]) => meta.route === parts[0]);
  if (match) {
    return { kind: match[0], slug: parts[1] ? decodeURIComponent(parts[1]) : '' };
  }

  return { kind: 'home', slug: '' };
}

export function getCurrentRoute() {
  if (typeof window === 'undefined') {
    return { kind: 'home', slug: '' };
  }
  return parseHashRoute(window.location.hash);
}

export function buildHash(kind, slug = '') {
  const route = modeMeta[normalizeMode(kind)].route;
  return slug ? `/${route}/${encodeURIComponent(slug)}` : `/${route}`;
}
