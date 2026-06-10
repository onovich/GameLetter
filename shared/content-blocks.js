const IMAGE_MARKERS = new Set(['[图片]', '[Image]', '[image]']);
const LINK_MARKERS = new Set(['[链接]', '[Link]', '[link]']);
const TOY_REF_MARKERS = new Set(['[引用 Toy]', '[Toy]', '[toy]']);
const CAPSULE_REF_MARKERS = new Set(['[引用 Capsule]', '[Capsule]', '[capsule]']);

export function normalizeLineEndings(value = '') {
  return String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function parseStructuredFields(lines = []) {
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

export function createTextContentBlock(text = '') {
  return { type: 'text', text };
}

export function createImageContentBlock(url = '', caption = '') {
  return { type: 'image', url, caption };
}

export function createLinkContentBlock(text = '', url = '') {
  return { type: 'link', text, url };
}

export function createToyContentBlock(toy = {}) {
  return {
    type: 'toy',
    toyId: toy.id || toy.toyId || '',
    entry: toy.entry || toy.src || toy.url || '',
    title: toy.title || toy.label || 'Toy',
    caption: toy.summary || toy.caption || '',
    poster: toy.poster || toy.previewImage || toy.image || toy.thumbnail || '',
    aspectRatio: toy.aspectRatio || '16 / 9',
    allowFullscreen: toy.allowFullscreen !== false,
    tags: toy.tags || []
  };
}

export function createListContentBlock(items = [], ordered = false) {
  return {
    type: 'list',
    ordered: Boolean(ordered),
    items: items.map((item) => String(item || '').trim()).filter(Boolean)
  };
}

export function createCodeContentBlock(content = '', language = '') {
  return {
    type: 'code',
    language: String(language || '').trim(),
    content: String(content || '')
  };
}

export function isLikelyImageUrl(url = '') {
  if (!url) {
    return false;
  }
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url)
    || /images\.unsplash\.com|cdn\.|image\.|imgur\.com|cloudinary\.com/i.test(url);
}

export function isLikelyWebUrl(url = '') {
  return /^https?:\/\/\S+$/i.test(String(url || '').trim());
}

function parseTagList(value = '') {
  return String(value)
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveToy(toyId = '', options = {}) {
  const toyById = options.toyById || options.toysById;
  if (!toyId || !toyById) {
    return null;
  }
  if (toyById instanceof Map) {
    return toyById.get(toyId) || null;
  }
  return toyById[toyId] || null;
}

function normalizeToyBlock(block = {}, options = {}) {
  const toyId = String(block.toyId || block.id || '').trim();
  const toy = resolveToy(toyId, options);
  const entry = String(block.entry || block.src || block.url || toy?.entry || '').trim();
  if (!entry && !toyId) {
    return null;
  }
  return createToyContentBlock({
    ...(toy || {}),
    id: toyId || toy?.id || '',
    title: block.title || block.label || toy?.title || 'Toy',
    summary: block.caption || block.summary || toy?.summary || '',
    poster: block.poster || block.previewImage || block.image || block.thumbnail || toy?.poster || toy?.previewImage || toy?.image || toy?.thumbnail || '',
    entry,
    aspectRatio: block.aspectRatio || toy?.aspectRatio || '16 / 9',
    allowFullscreen: block.allowFullscreen !== false,
    tags: block.tags || toy?.tags || []
  });
}

export function parseCapsuleChunkToBlock(chunk = '', options = {}) {
  const normalized = String(chunk || '').trim();
  if (!normalized) {
    return null;
  }

  const lines = normalized.split('\n').map((line) => line.trim());
  const marker = lines[0];
  const fields = parseStructuredFields(lines.slice(1));

  if (IMAGE_MARKERS.has(marker)) {
    return createImageContentBlock(fields.url || '', fields.caption || '');
  }

  if (LINK_MARKERS.has(marker)) {
    return createLinkContentBlock(fields.text || fields.title || fields.url || '', fields.url || '');
  }

  if (isLikelyImageUrl(normalized)) {
    return createImageContentBlock(normalized, '');
  }

  if (isLikelyWebUrl(normalized)) {
    return createLinkContentBlock(normalized, normalized);
  }

  return createTextContentBlock(normalized);
}

export function parseCapsuleBodyToBlocks(body = '', options = {}) {
  const blocks = normalizeLineEndings(body)
    .split(/\n{2,}/)
    .map((chunk) => parseCapsuleChunkToBlock(chunk, options))
    .filter(Boolean);
  return blocks.length ? blocks : [createTextContentBlock('')];
}

export function normalizeCapsuleBlock(block, options = {}) {
  if (!block) {
    return null;
  }
  if (typeof block === 'string') {
    return parseCapsuleChunkToBlock(block, options);
  }

  const type = String(block.type || '').trim();
  if (type === 'image') {
    const imageUrl = String(block.url || block.image || block.src || '').trim();
    return imageUrl ? createImageContentBlock(imageUrl, block.caption || block.text || '') : null;
  }
  if (type === 'link') {
    const url = String(block.url || '').trim();
    const text = String(block.text || block.title || block.label || url).trim();
    return url || text ? createLinkContentBlock(text, url) : null;
  }
  if (type === 'text' || type === 'note' || type === 'thought') {
    return createTextContentBlock(block.text || block.content || '');
  }
  if (String(block.content || '').trim()) {
    return createTextContentBlock(block.content);
  }
  return null;
}

export function parseIssueChunkToBlock(chunk = '', options = {}) {
  const normalized = String(chunk || '').trim();
  if (!normalized) {
    return null;
  }

  const lines = normalized.split('\n').map((line) => line.trim());
  const marker = lines[0];
  const fields = parseStructuredFields(lines.slice(1));

  if (CAPSULE_REF_MARKERS.has(marker)) {
    const capsuleId = String(fields.capsuleId || '').trim();
    return capsuleId ? { type: 'capsule-ref', capsuleId, title: fields.title || capsuleId } : { type: 'note', content: normalized };
  }

  const capsuleBlock = parseCapsuleChunkToBlock(chunk, options);
  if (!capsuleBlock) {
    return null;
  }
  if (capsuleBlock.type === 'text') {
    return { type: 'note', content: capsuleBlock.text || '' };
  }
  return capsuleBlock;
}

export function parseIssueBodyToBlocks(body = '', options = {}) {
  const blocks = normalizeLineEndings(body)
    .split(/\n{2,}/)
    .map((chunk) => parseIssueChunkToBlock(chunk, options))
    .filter(Boolean);
  return blocks.length ? blocks : [{ type: 'note', content: '' }];
}

export function normalizeIssueBlock(block, options = {}) {
  if (!block) {
    return null;
  }
  if (typeof block === 'string') {
    return parseIssueChunkToBlock(block, options);
  }

  const type = String(block.type || '').trim();
  if (type === 'capsule-ref' || (type === 'capsule' && block.capsuleId)) {
    return { type: 'capsule-ref', capsuleId: block.capsuleId, title: block.title || block.capsuleId };
  }

  const capsuleBlock = normalizeCapsuleBlock(block, options);
  if (!capsuleBlock) {
    return null;
  }
  if (capsuleBlock.type === 'text') {
    return { type: 'note', content: capsuleBlock.text || '' };
  }
  return capsuleBlock;
}

function parseToyChunkToBlock(chunk = '', options = {}) {
  const normalized = String(chunk || '').trim();
  if (!normalized) {
    return null;
  }

  const lines = normalized.split('\n').map((line) => line.trim());
  const marker = lines[0];
  if (!TOY_REF_MARKERS.has(marker)) {
    return null;
  }

  const fields = parseStructuredFields(lines.slice(1));
  const toyId = String(fields.toyId || fields.id || '').trim();
  const inlineToy = normalizeToyBlock({
    toyId,
    title: fields.title || fields.name || 'Toy',
    summary: fields.caption || fields.summary || '',
    poster: fields.poster || fields.previewImage || fields.image || fields.thumbnail || '',
    entry: fields.entry || fields.src || fields.url || '',
    aspectRatio: fields.aspectRatio || '16 / 9',
    allowFullscreen: fields.allowFullscreen !== 'false',
    tags: parseTagList(fields.tags || '')
  }, options);

  if (inlineToy?.entry) {
    return inlineToy;
  }
  return toyId ? { type: 'toy-ref', toyId, title: fields.title || toyId } : { type: 'paragraph', content: normalized };
}

export function normalizeArticleBlock(block, options = {}) {
  if (!block) {
    return null;
  }
  if (typeof block === 'string') {
    return parseArticleChunkToBlock(block, options);
  }

  const type = String(block.type || '').trim();
  if (type === 'heading' || type === 'quote' || type === 'paragraph') {
    return { type, content: block.content || block.text || '' };
  }
  if (type === 'list') {
    const items = Array.isArray(block.items) ? block.items : [];
    const normalizedList = createListContentBlock(items, block.ordered);
    return normalizedList.items.length ? normalizedList : null;
  }
  if (type === 'code') {
    return createCodeContentBlock(block.content || block.text || block.code || '', block.language || block.lang || '');
  }
  if (type === 'toy-ref') {
    const toyId = String(block.toyId || block.id || '').trim();
    return toyId ? { type: 'toy-ref', toyId, title: block.title || toyId } : null;
  }
  if (type === 'toy') {
    return normalizeToyBlock(block, options);
  }
  return normalizeIssueBlock(block, options);
}

export function parseArticleChunkToBlock(chunk = '', options = {}) {
  const raw = String(chunk || '').trim();
  if (!raw) {
    return null;
  }

  const codeMatch = raw.match(/^```([A-Za-z0-9_-]*)\n([\s\S]*?)\n?```$/);
  if (codeMatch) {
    return createCodeContentBlock(codeMatch[2], codeMatch[1]);
  }

  const headingMatch = raw.match(/^#{2,3}\s+(.+)$/s);
  if (headingMatch) {
    return { type: 'heading', content: headingMatch[1].trim() };
  }

  const quoteMatch = raw.match(/^>\s?(.+)$/s);
  if (quoteMatch) {
    return { type: 'quote', content: quoteMatch[1].trim() };
  }

  const listLines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
  if (listLines.length && listLines.every((line) => /^([-*+]|\d+[.)])\s+/.test(line))) {
    const ordered = listLines.every((line) => /^\d+[.)]\s+/.test(line));
    const items = listLines.map((line) => line.replace(/^([-*+]|\d+[.)])\s+/, '').trim());
    return createListContentBlock(items, ordered);
  }

  const toyBlock = parseToyChunkToBlock(raw, options);
  if (toyBlock) {
    return toyBlock;
  }

  const issueBlock = parseIssueChunkToBlock(raw, options);
  if (!issueBlock) {
    return null;
  }
  if (issueBlock.type === 'note') {
    return { type: 'paragraph', content: issueBlock.content || '' };
  }
  return issueBlock;
}

export function parseArticleBodyToBlocks(body = '', options = {}) {
  const blocks = normalizeLineEndings(body)
    .split(/\n{2,}/)
    .map((chunk) => parseArticleChunkToBlock(chunk, options))
    .filter(Boolean);
  return blocks.length ? blocks : [];
}

export function getCapsuleBlocks(capsule = {}, options = {}) {
  const payload = capsule.payload || {};
  const normalizedBlocks = [
    ...(Array.isArray(capsule.blocks) ? capsule.blocks : []),
    ...(Array.isArray(payload.blocks) ? payload.blocks : [])
  ]
    .map((block) => normalizeCapsuleBlock(block, options))
    .filter(Boolean);

  if (normalizedBlocks.length) {
    return normalizedBlocks;
  }

  const serializedBody = [capsule.body, capsule.content, payload.body]
    .find((value) => typeof value === 'string' && String(value).trim());

  if (serializedBody) {
    return parseCapsuleBodyToBlocks(serializedBody, options);
  }

  const blocks = [];

  if (payload.type === 'link') {
    if (payload.image) {
      blocks.push(createImageContentBlock(payload.image, payload.caption || capsule.title || ''));
    }
    if (payload.url) {
      blocks.push(createLinkContentBlock(capsule.summary || capsule.title || '打开原文', payload.url));
    }
    if (payload.commentary) {
      blocks.push(createTextContentBlock(payload.commentary));
    }
    return blocks.length ? blocks : [createTextContentBlock(capsule.summary || '')];
  }

  if (payload.type === 'image' && payload.url) {
    blocks.push(createImageContentBlock(payload.url, payload.caption || capsule.title || ''));
    if (payload.commentary) {
      blocks.push(createTextContentBlock(payload.commentary));
    }
    return blocks;
  }

  if (payload.image) {
    blocks.push(createImageContentBlock(payload.image, payload.caption || capsule.title || ''));
  }
  if (payload.type === 'thought') {
    return [createTextContentBlock(payload.content || capsule.summary || '')];
  }
  if (payload.content) {
    blocks.push(createTextContentBlock(payload.content));
  }
  if (payload.caption && payload.type !== 'image') {
    blocks.push(createTextContentBlock(payload.caption));
  }
  if (payload.commentary) {
    blocks.push(createTextContentBlock(payload.commentary));
  }
  if (payload.url && payload.type !== 'image') {
    blocks.push(createLinkContentBlock(capsule.summary || '打开原文', payload.url));
  }
  if (!blocks.some((block) => block.type === 'text' && String(block.text || '').trim()) && capsule.summary) {
    blocks.push(createTextContentBlock(capsule.summary));
  }

  return blocks.length ? blocks : [createTextContentBlock(capsule.summary || capsule.title || '')];
}

export function getIssueBlocks(issue = {}, options = {}) {
  const payload = issue.payload || {};
  const normalizedBlocks = [
    ...(Array.isArray(issue.blocks) ? issue.blocks : []),
    ...(Array.isArray(payload.blocks) ? payload.blocks : [])
  ]
    .map((block) => normalizeIssueBlock(block, options))
    .filter(Boolean);

  if (normalizedBlocks.length) {
    return normalizedBlocks;
  }

  const serializedBody = [issue.body, issue.content, payload.body]
    .find((value) => typeof value === 'string' && String(value).trim());

  if (serializedBody) {
    return parseIssueBodyToBlocks(serializedBody, options);
  }

  return [];
}

export function getArticleBlocks(article = {}, options = {}) {
  const normalizedBlocks = (Array.isArray(article.blocks) ? article.blocks : [])
    .map((block) => normalizeArticleBlock(block, options))
    .filter(Boolean);

  if (normalizedBlocks.length) {
    return normalizedBlocks;
  }

  const body = [article.body, article.content]
    .find((value) => typeof value === 'string' && String(value).trim());

  if (!body) {
    return [];
  }

  return parseArticleBodyToBlocks(body, options);
}

export function getCapsuleTextFromBlocks(blocks = []) {
  return blocks
    .map((block) => {
      if (block.type === 'text') {
        return block.text || '';
      }
      if (block.type === 'image') {
        return block.caption || '';
      }
      if (block.type === 'link') {
        return block.text || block.url || '';
      }
      if (block.type === 'toy') {
        return [block.title, block.caption, block.entry].filter(Boolean).join(' ');
      }
      if (block.type === 'list') {
        return (block.items || []).join('\n');
      }
      if (block.type === 'code') {
        return block.content || '';
      }
      return block.title || block.text || block.content || '';
    })
    .join('\n\n')
    .trim();
}

export function capsuleNeedsCollapse(text = '') {
  return String(text || '').length > 240;
}

export function getCapsulePreviewBlocks(blocks = []) {
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

export function capsulePreviewBlocks(blocks = []) {
  return getCapsulePreviewBlocks(blocks);
}

export function getCapsulePreviewText(blocks = [], fallbackText = '') {
  const firstText = blocks.find((block) => block.type === 'text' && String(block.text || '').trim());
  if (firstText) {
    return firstText.text || '';
  }
  return String(fallbackText || '').trim();
}

export function getCapsuleEmbedPreview(capsule = {}, blocks = []) {
  const imageBlock = blocks.find((block) => block.type === 'image' && block.url);
  const textBlock = blocks.find((block) => block.type === 'text' && String(block.text || '').trim());
  const linkBlock = blocks.find((block) => block.type === 'link' && String(block.text || block.url || '').trim());
  const previewText = String(textBlock?.text || capsule.summary || linkBlock?.text || '').trim();

  return {
    image: imageBlock,
    eyebrow: 'Capsule',
    text: previewText
  };
}

export function serializeCapsuleBlocks(blocks = []) {
  return blocks
    .map((block) => {
      if (block.type === 'image') {
        return [
          '[图片]',
          `url: ${String(block.url || '').trim()}`,
          `caption: ${String(block.caption || '').trim()}`
        ].join('\n').trim();
      }
      if (block.type === 'link') {
        return [
          '[链接]',
          `text: ${String(block.text || '').trim()}`,
          `url: ${String(block.url || '').trim()}`
        ].join('\n').trim();
      }
      return String(block.text || '').trim();
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}
