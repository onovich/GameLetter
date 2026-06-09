const IMAGE_MARKERS = new Set(['[图片]', '[Image]', '[image]']);
const LINK_MARKERS = new Set(['[链接]', '[Link]', '[link]']);
const CANVAS_MARKERS = new Set(['[Canvas]', '[canvas]']);
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

export function createCanvasContentBlock(canvas = {}) {
  return {
    type: 'canvas',
    canvasId: canvas.id || canvas.canvasId || '',
    entry: canvas.entry || canvas.src || canvas.url || '',
    title: canvas.title || canvas.label || 'Canvas',
    caption: canvas.summary || canvas.caption || '',
    aspectRatio: canvas.aspectRatio || '16 / 9',
    allowFullscreen: canvas.allowFullscreen !== false,
    tags: canvas.tags || []
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

function resolveCanvas(canvasId = '', options = {}) {
  const canvasById = options.canvasById || options.canvasesById;
  if (!canvasId || !canvasById) {
    return null;
  }
  if (canvasById instanceof Map) {
    return canvasById.get(canvasId) || null;
  }
  return canvasById[canvasId] || null;
}

function normalizeCanvasBlock(block = {}, options = {}) {
  const canvasId = String(block.canvasId || block.id || '').trim();
  const canvas = resolveCanvas(canvasId, options);
  const entry = String(block.entry || block.src || block.url || canvas?.entry || '').trim();
  if (!entry && !canvasId) {
    return null;
  }
  return createCanvasContentBlock({
    ...(canvas || {}),
    id: canvasId || canvas?.id || '',
    title: block.title || block.label || canvas?.title || 'Canvas',
    summary: block.caption || block.summary || canvas?.summary || '',
    entry,
    aspectRatio: block.aspectRatio || canvas?.aspectRatio || '16 / 9',
    allowFullscreen: block.allowFullscreen !== false,
    tags: block.tags || canvas?.tags || []
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

  if (CANVAS_MARKERS.has(marker)) {
    return normalizeCanvasBlock({
      canvasId: fields.canvasId || fields.id || '',
      title: fields.title || fields.name || 'Canvas',
      summary: fields.caption || fields.summary || '',
      entry: fields.entry || fields.src || fields.url || '',
      aspectRatio: fields.aspectRatio || '16 / 9',
      allowFullscreen: fields.allowFullscreen !== 'false',
      tags: parseTagList(fields.tags || '')
    }, options);
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
  if (type === 'canvas' || type === 'canvas-ref') {
    return normalizeCanvasBlock(block, options);
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

export function normalizeArticleBlock(block, options = {}) {
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
  return normalizeIssueBlock(block, options);
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

  if (payload.type === 'canvas') {
    const canvasId = payload.canvasId || payload.id || '';
    const canvas = resolveCanvas(canvasId, options);
    return [createCanvasContentBlock({
      ...(canvas || {}),
      id: canvasId || canvas?.id || '',
      title: payload.title || capsule.title || canvas?.title || 'Canvas',
      summary: payload.caption || payload.commentary || capsule.summary || canvas?.summary || '',
      entry: payload.entry || payload.src || payload.url || canvas?.entry || '',
      aspectRatio: payload.aspectRatio || canvas?.aspectRatio || '16 / 9',
      allowFullscreen: payload.allowFullscreen !== false,
      tags: capsule.tags || canvas?.tags || []
    })];
  }

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

  return normalizeLineEndings(body)
    .split(/\n{2,}/)
    .map((chunk) => ({ type: 'paragraph', content: chunk.trim() }))
    .filter((block) => block.content);
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
      if (block.type === 'canvas') {
        return [block.title, block.caption, block.entry].filter(Boolean).join(' ');
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
  const firstMedia = blocks.find((block) => block.type === 'image' || block.type === 'link' || block.type === 'canvas');
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
      if (block.type === 'canvas') {
        return [
          '[Canvas]',
          `canvasId: ${String(block.canvasId || '').trim()}`,
          `title: ${String(block.title || '').trim()}`,
          `entry: ${String(block.entry || '').trim()}`,
          `aspectRatio: ${String(block.aspectRatio || '16 / 9').trim()}`,
          `allowFullscreen: ${block.allowFullscreen !== false}`,
          `caption: ${String(block.caption || '').trim()}`,
          block.tags?.length ? `tags: ${block.tags.join(', ')}` : ''
        ].filter(Boolean).join('\n').trim();
      }
      return String(block.text || '').trim();
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}
