import { getArticleBlocks, getCapsuleBlocks, getIssueBlocks } from './blocks';
import { modeMeta, normalizeMode } from './modes';

function compactText(value = '') {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimDescription(value = '') {
  const text = compactText(value);
  return text.length > 156 ? `${text.slice(0, 153)}...` : text;
}

function getBrowserBaseUrl() {
  if (typeof window === 'undefined') {
    return '';
  }
  return new URL(import.meta.env.BASE_URL || '/', window.location.origin).toString();
}

function getSiteBaseUrl(site = {}) {
  return site.baseUrl || getBrowserBaseUrl();
}

function resolveAbsoluteUrl(value = '', site = {}) {
  const url = String(value || '').trim();
  if (!url) {
    return '';
  }
  try {
    if (/^https?:\/\//i.test(url)) {
      return new URL(url).toString();
    }
    return new URL(url.replace(/^\/+/, ''), getSiteBaseUrl(site)).toString();
  } catch {
    return url;
  }
}

function firstImageFromBlocks(blocks = [], capsulesById, toysById, site, depth = 0) {
  if (depth > 2) {
    return '';
  }

  for (const block of blocks) {
    if (block.type === 'image' && block.url) {
      return resolveAbsoluteUrl(block.url, site);
    }
    if (block.type === 'capsule-ref' && block.capsuleId) {
      const capsule = capsulesById?.get(block.capsuleId);
      if (capsule) {
        const image = firstImageFromBlocks(getCapsuleBlocks(capsule), capsulesById, toysById, site, depth + 1);
        if (image) {
          return image;
        }
      }
    }
  }

  return '';
}

function getEntryBlocks(entry, mode, capsulesById, toysById) {
  if (!entry) {
    return [];
  }
  if (mode === 'capsule') {
    return getCapsuleBlocks(entry);
  }
  if (mode === 'issue') {
    return getIssueBlocks(entry);
  }
  if (mode === 'article') {
    return getArticleBlocks(entry, { toysById });
  }
  if (mode === 'toy') {
    return [{ ...entry, type: 'toy', toyId: entry.id }];
  }
  return [];
}

function getBlockText(block) {
  if (block.type === 'list') {
    return (block.items || []).join(' ');
  }
  return block.content || block.text || block.caption || block.title || '';
}

function getEntryDescription(entry, mode, capsulesById, toysById, site) {
  if (!entry) {
    return trimDescription(site.description || '');
  }
  const blocks = getEntryBlocks(entry, mode, capsulesById, toysById);
  return trimDescription(
    entry.seo?.description
      || entry.summary
      || entry.body
      || entry.content
      || blocks.map(getBlockText).filter(Boolean).join(' ')
      || site.description
      || ''
  );
}

function getEntryUrl(entry, mode, site) {
  const siteBaseUrl = getSiteBaseUrl(site);
  if (!entry) {
    return siteBaseUrl;
  }
  const route = modeMeta[normalizeMode(mode)]?.route || modeMeta.issue.route;
  const slug = encodeURIComponent(entry.slug || entry.id || '');
  return `${siteBaseUrl}#/${route}/${slug}`;
}

export function buildSeoState({ site = {}, entry = null, mode = 'issue', capsulesById, toysById } = {}) {
  const title = entry?.seo?.title || entry?.title || site.title || 'GameLetter';
  const siteTitle = site.title || 'GameLetter';
  const description = getEntryDescription(entry, mode, capsulesById, toysById, site);
  const blocks = getEntryBlocks(entry, mode, capsulesById, toysById);
  const image = resolveAbsoluteUrl(entry?.seo?.image || '', site)
    || firstImageFromBlocks(blocks, capsulesById, toysById, site)
    || resolveAbsoluteUrl(site.seo?.image || '', site);
  const url = entry?.seo?.canonicalUrl || getEntryUrl(entry, mode, site);
  const type = entry && (mode === 'article' || mode === 'issue') ? 'article' : 'website';

  return {
    title,
    documentTitle: title === siteTitle ? title : `${title} · ${siteTitle}`,
    description,
    image,
    url,
    type,
    publishedAt: entry?.publishedAt || '',
    tags: entry?.tags || []
  };
}

function upsertMeta(selector, attributes) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    document.head.appendChild(node);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    node.setAttribute(key, value);
  });
}

function upsertCanonical(url) {
  let node = document.head.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', 'canonical');
    document.head.appendChild(node);
  }
  node.setAttribute('href', url);
}

function removeMeta(selector) {
  document.head.querySelectorAll(selector).forEach((node) => node.remove());
}

export function applySeoState(seo) {
  if (typeof document === 'undefined' || !seo) {
    return;
  }

  document.title = seo.documentTitle || seo.title || 'GameLetter';
  upsertCanonical(seo.url);
  upsertMeta('meta[name="description"]', { name: 'description', content: seo.description || '' });
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: seo.title || '' });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: seo.description || '' });
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: seo.type || 'website' });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: seo.url || '' });
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: seo.image ? 'summary_large_image' : 'summary' });
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: seo.title || '' });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: seo.description || '' });

  if (seo.image) {
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: seo.image });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: seo.image });
  } else {
    removeMeta('meta[property="og:image"]');
    removeMeta('meta[name="twitter:image"]');
  }

  if (seo.publishedAt) {
    upsertMeta('meta[property="article:published_time"]', { property: 'article:published_time', content: seo.publishedAt });
  } else {
    removeMeta('meta[property="article:published_time"]');
  }

  removeMeta('meta[property="article:tag"]');
  (seo.tags || []).forEach((tag) => {
    const node = document.createElement('meta');
    node.setAttribute('property', 'article:tag');
    node.setAttribute('content', tag);
    document.head.appendChild(node);
  });
}
