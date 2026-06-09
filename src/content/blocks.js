import { normalizeLineEndings } from './text';

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

function createTextBlock(text = '') {
  return { type: 'text', text };
}

function createImageBlock(url = '', caption = '') {
  return { type: 'image', url, caption };
}

function createLinkBlock(text = '', url = '') {
  return { type: 'link', text, url };
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

function parseChunkToCapsuleBlock(chunk = '') {
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
    .map((chunk) => parseChunkToCapsuleBlock(chunk))
    .filter(Boolean);
  return blocks.length ? blocks : [createTextBlock('')];
}

function normalizePublishedCapsuleBlock(block) {
  if (!block) {
    return null;
  }
  if (typeof block === 'string') {
    return parseChunkToCapsuleBlock(block);
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
  if (type === 'canvas') {
    const entry = String(block.entry || block.src || block.url || '').trim();
    return entry ? {
      type: 'canvas',
      entry,
      title: block.title || block.label || '',
      caption: block.caption || block.summary || '',
      aspectRatio: block.aspectRatio || '16 / 9',
      allowFullscreen: block.allowFullscreen !== false
    } : null;
  }
  if (type === 'text' || type === 'note' || type === 'thought') {
    return createTextBlock(block.text || block.content || '');
  }
  if (String(block.content || '').trim()) {
    return createTextBlock(block.content);
  }
  return null;
}

function parseChunkToIssueBlock(chunk = '') {
  const normalized = String(chunk || '').trim();
  if (!normalized) {
    return null;
  }

  const lines = normalized.split('\n').map((line) => line.trim());
  const marker = lines[0];
  const fields = parseStructuredFields(lines.slice(1));

  if (marker === '[引用 Capsule]') {
    const capsuleId = String(fields.capsuleId || '').trim();
    return capsuleId ? { type: 'capsule-ref', capsuleId, title: fields.title || capsuleId } : { type: 'note', content: normalized };
  }
  if (marker === '[链接]') {
    return createLinkBlock(fields.text || fields.title || fields.url || '', fields.url || '');
  }
  if (marker === '[图片]') {
    return createImageBlock(fields.url || '', fields.caption || '');
  }
  if (isLikelyImageUrl(normalized)) {
    return createImageBlock(normalized, '');
  }
  if (isLikelyWebUrl(normalized)) {
    return createLinkBlock(normalized, normalized);
  }
  return { type: 'note', content: normalized };
}

function parseIssueBodyToBlocks(body = '') {
  const normalizedBody = normalizeLineEndings(body);
  const blocks = normalizedBody
    .split(/\n{2,}/)
    .map((chunk) => parseChunkToIssueBlock(chunk))
    .filter(Boolean);
  return blocks.length ? blocks : [{ type: 'note', content: '' }];
}

function normalizePublishedIssueBlock(block) {
  if (!block) {
    return null;
  }
  if (typeof block === 'string') {
    return parseChunkToIssueBlock(block);
  }

  const type = String(block.type || '').trim();
  if (type === 'capsule-ref' || (type === 'capsule' && block.capsuleId)) {
    return { type: 'capsule-ref', capsuleId: block.capsuleId, title: block.title || block.capsuleId };
  }
  if (type === 'image') {
    const imageUrl = String(block.url || block.image || block.src || '').trim();
    return imageUrl ? createImageBlock(imageUrl, block.caption || block.text || '') : null;
  }
  if (type === 'link') {
    const url = String(block.url || '').trim();
    const text = String(block.text || block.title || block.label || url).trim();
    return url || text ? createLinkBlock(text, url) : null;
  }
  if (type === 'note' || type === 'text' || type === 'thought') {
    return { type: 'note', content: block.content || block.text || '' };
  }
  if (String(block.content || '').trim()) {
    return { type: 'note', content: block.content };
  }
  return null;
}

function normalizePublishedArticleBlock(block) {
  if (!block) {
    return null;
  }
  if (typeof block === 'string') {
    return { type: 'paragraph', content: block };
  }

  const type = String(block.type || '').trim();
  if (type === 'heading' || type === 'quote' || type === 'paragraph') {
    return { type, content: block.content || block.text || '' };
  }
  if (type === 'canvas-ref' && block.capsuleId) {
    return { type: 'canvas-ref', capsuleId: block.capsuleId };
  }
  return normalizePublishedIssueBlock(block);
}

export function capsuleNeedsCollapse(text = '') {
  return String(text || '').length > 240;
}

export function capsulePreviewBlocks(blocks = []) {
  const preview = [];
  const firstMedia = blocks.find((block) => block.type === 'image' || block.type === 'link');
  const firstText = blocks.find((block) => block.type === 'text' && String(block.text || '').trim());

  if (firstMedia) {
    preview.push(firstMedia);
  }
  if (firstText) {
    preview.push({ ...firstText, collapsed: true });
  }

  return preview;
}

export function getCapsulePreviewText(blocks = [], fallbackText = '') {
  const firstText = blocks.find((block) => block.type === 'text' && String(block.text || '').trim());
  if (firstText) {
    return firstText.text || '';
  }
  return String(fallbackText || '').trim();
}

export function getCapsuleBlocks(capsule) {
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

  if (payload.type === 'link') {
    if (payload.image) {
      blocks.push({ type: 'image', url: payload.image, caption: payload.caption || capsule.title || '' });
    }
    if (payload.url) {
      blocks.push({ type: 'link', text: capsule.summary || capsule.title || '打开原文', url: payload.url });
    }
    if (payload.commentary) {
      blocks.push({ type: 'text', text: payload.commentary });
    }
    return blocks.length ? blocks : [{ type: 'text', text: capsule.summary || '' }];
  }

  if (payload.type === 'image' && payload.url) {
    blocks.push({ type: 'image', url: payload.url, caption: payload.caption || capsule.title || '' });
    if (payload.commentary) {
      blocks.push({ type: 'text', text: payload.commentary });
    }
    return blocks;
  }

  if (payload.type === 'thought') {
    return [{ type: 'text', text: payload.content || capsule.summary || '' }];
  }

  if (payload.type === 'canvas') {
    return [{
      type: 'canvas',
      entry: payload.entry || payload.src || payload.url || '',
      title: payload.title || capsule.title || '',
      caption: payload.caption || payload.commentary || capsule.summary || '',
      aspectRatio: payload.aspectRatio || '16 / 9',
      allowFullscreen: payload.allowFullscreen !== false
    }];
  }

  if (payload.content) {
    blocks.push({ type: 'text', text: payload.content });
  }
  if (payload.commentary) {
    blocks.push({ type: 'text', text: payload.commentary });
  }
  if (payload.url) {
    blocks.push({ type: 'link', text: capsule.summary || '打开原文', url: payload.url });
  }
  if (!blocks.some((block) => block.type === 'text' && String(block.text || '').trim()) && capsule.summary) {
    blocks.push({ type: 'text', text: capsule.summary });
  }

  return blocks.length ? blocks : [{ type: 'text', text: capsule.summary || capsule.title || '' }];
}

export function getIssueBlocks(issue) {
  const payload = issue.payload || {};
  const normalizedBlocks = [
    ...(Array.isArray(issue.blocks) ? issue.blocks : []),
    ...(Array.isArray(payload.blocks) ? payload.blocks : [])
  ]
    .map((block) => normalizePublishedIssueBlock(block))
    .filter(Boolean);

  if (normalizedBlocks.length) {
    return normalizedBlocks;
  }

  const serializedBody = [issue.body, issue.content, payload.body]
    .find((value) => typeof value === 'string' && String(value).trim());

  if (serializedBody) {
    return parseIssueBodyToBlocks(serializedBody);
  }

  return [];
}

export function getArticleBlocks(article) {
  const normalizedBlocks = (Array.isArray(article.blocks) ? article.blocks : [])
    .map((block) => normalizePublishedArticleBlock(block))
    .filter(Boolean);

  if (normalizedBlocks.length) {
    return normalizedBlocks;
  }

  const body = [article.body, article.content]
    .find((value) => typeof value === 'string' && String(value).trim());

  if (!body) {
    return [];
  }

  return normalizeLineEndings(body)
    .split(/\n{2,}/)
    .map((chunk) => ({ type: 'paragraph', content: chunk.trim() }))
    .filter((block) => block.content);
}

export function getCapsuleEmbedPreview(capsule, blocks = []) {
  const imageBlock = blocks.find((block) => block.type === 'image' && block.url);
  const canvasBlock = blocks.find((block) => block.type === 'canvas');
  const textBlock = blocks.find((block) => block.type === 'text' && String(block.text || '').trim());
  const linkBlock = blocks.find((block) => block.type === 'link' && String(block.text || block.url || '').trim());
  const previewText = String(textBlock?.text || capsule.summary || linkBlock?.text || canvasBlock?.caption || '').trim();

  return {
    image: imageBlock,
    eyebrow: canvasBlock ? 'Canvas Capsule' : 'Capsule',
    text: previewText
  };
}
