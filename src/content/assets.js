function getBaseUrl() {
  return import.meta.env.BASE_URL || '/';
}

export function resolveAssetUrl(path = '') {
  const value = String(path || '').trim();
  if (!value || /^https?:\/\//i.test(value)) {
    return value;
  }
  return `${getBaseUrl()}${value.replace(/^\/+/, '')}`;
}
