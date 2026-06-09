export const modeOrder = ['issue', 'capsule', 'flow', 'article'];

export const modeMeta = {
  issue: { label: 'Issue', route: 'issues', className: 'issue-list' },
  capsule: { label: 'Capsule', route: 'capsules', className: 'capsule-list' },
  flow: { label: 'Flow', route: 'flows', className: 'flow-list' },
  article: { label: 'Article', route: 'articles', className: 'article-list' }
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
