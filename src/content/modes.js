import { contentModeMeta, contentModeOrder } from '../../shared/content-rules.js';

export const modeOrder = contentModeOrder;
export const modeMeta = contentModeMeta;

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
