import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const studioDir = path.join(rootDir, 'studio');
const distDir = path.join(rootDir, 'dist');
const inboxDir = path.join(rootDir, 'workbench', 'inbox');
const archiveDir = path.join(rootDir, 'workbench', 'archive');
const pendingDir = path.join(rootDir, 'workbench', 'pending');
const publishUndoDir = path.join(archiveDir, 'publish-undo');
const dataPath = path.join(rootDir, 'public', 'data.json');
const port = Number(process.env.PROMPT_CMS_PORT || 4318);
const execFileAsync = promisify(execFile);

const collectionByKind = {
  capsule: 'capsules',
  issue: 'issues',
  flow: 'flows',
  article: 'articles',
  canvas: 'canvases'
};

const defaultVisibilityByKind = {
  capsule: { direct: true, search: true, homepage: false, feed: false, rss: false },
  canvas: { direct: true, search: true, homepage: false, feed: false, rss: false },
  flow: { direct: true, search: true, homepage: false, feed: false, rss: false },
  issue: { direct: true, search: true, homepage: true, feed: true, rss: true },
  article: { direct: true, search: true, homepage: true, feed: true, rss: true }
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, { 'Content-Type': contentType });
  response.end(text);
}

function sanitizeFileName(fileName) {
  const baseName = path.basename(fileName || '').trim();
  if (!baseName) {
    throw new Error('文件名不能为空');
  }

  const normalized = baseName.endsWith('.md') ? baseName : `${baseName}.md`;
  if (normalized.includes('..')) {
    throw new Error('非法文件名');
  }
  return normalized;
}

async function ensureDirectories() {
  await Promise.all([
    fs.mkdir(inboxDir, { recursive: true }),
    fs.mkdir(archiveDir, { recursive: true }),
    fs.mkdir(pendingDir, { recursive: true }),
    fs.mkdir(publishUndoDir, { recursive: true })
  ]);
}

async function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('请求体不是合法 JSON'));
      }
    });
    request.on('error', reject);
  });
}

function parseFrontmatter(rawContent) {
  const content = rawContent.replace(/^\uFEFF/, '');
  if (!content.startsWith('---\n')) {
    return { frontmatter: {}, body: content.trim() };
  }

  const endIndex = content.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { frontmatter: {}, body: content.trim() };
  }

  const header = content.slice(4, endIndex).trim();
  const body = content.slice(endIndex + 5).trim();
  const frontmatter = {};

  header.split(/\r?\n/).forEach((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      return;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) {
      frontmatter[key] = value;
    }
  });

  return { frontmatter, body };
}

function inferAction(text, frontmatter) {
  if (frontmatter.action && frontmatter.action !== 'auto') {
    return frontmatter.action;
  }

  const value = text.toLowerCase();
  if (/(删除|移除|撤掉|delete|remove)/i.test(value)) {
    return 'delete';
  }
  if (/(修改|编辑|更新|update|edit)/i.test(value)) {
    return 'update';
  }
  if (/(预览|preview)/i.test(value)) {
    return 'preview';
  }
  if (/(发布|publish)/i.test(value)) {
    return 'publish';
  }
  return 'create';
}

function inferKind(text, frontmatter) {
  if (frontmatter.kind && frontmatter.kind !== 'auto') {
    return frontmatter.kind;
  }

  const value = text.toLowerCase();
  if (/(capsule|胶囊|卡片)/i.test(value)) {
    return 'capsule';
  }
  if (/(issue|newsletter|简报|文章)/i.test(value)) {
    return 'issue';
  }
  if (/(flow|碎碎念|想法)/i.test(value)) {
    return 'flow';
  }
  if (/(article|专栏|长文)/i.test(value)) {
    return 'article';
  }
  if (/(canvas|可交互|小游戏|visualization|prototype)/i.test(value)) {
    return 'canvas';
  }
  return 'auto';
}

function inferTarget(text, frontmatter) {
  if (frontmatter.target && frontmatter.target !== 'auto') {
    return frontmatter.target;
  }

  const match = text.match(/(issue-[\w-]+|capsule-[\w-]+|flow-[\w-]+|article-[\w-]+|canvas-[\w-]+)/i);
  return match ? match[1] : 'auto';
}

function inferTitle(text, fileName, frontmatter = {}) {
  if (frontmatter.title) {
    return frontmatter.title.trim();
  }
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return fileName.replace(/\.md$/i, '');
  }

  const heading = lines.find((line) => line.startsWith('#'));
  if (heading) {
    return heading.replace(/^#+\s*/, '').trim();
  }

  return lines[0].slice(0, 60);
}

function createSummary(text) {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.slice(0, 120) || '暂无摘要';
}

function buildInternalPrompt(operation) {
  return [
    '读取 workbench/inbox 中指定的操作单。',
    `文件：${operation.fileName}`,
    `当前推断 action：${operation.action}`,
    `当前推断 kind：${operation.kind}`,
    `当前推断 target：${operation.target}`,
    '请基于操作单内容判断这是 create / update / delete / preview / publish 中哪一种。',
    '请判断目标应为 Capsule 还是 Issue。',
    '如果是 Capsule：输出 title、summary、slug、tags 候选、payload。',
    '如果是 Issue：输出 title、summary、slug、tags 候选、blocks，并尽量把内容点抽成 Capsule 后用 capsule-ref 引用。',
    '如果是 update / delete：输出操作摘要、受影响对象、风险点与建议。',
    '先不要正式发布，先返回 tags 清单、结构化候选和预览建议。'
  ].join('\n');
}

async function readInboxFiles() {
  await ensureDirectories();
  const entries = await fs.readdir(inboxDir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map(async (entry) => {
        const filePath = path.join(inboxDir, entry.name);
        const [content, stat] = await Promise.all([fs.readFile(filePath, 'utf8'), fs.stat(filePath)]);
        const { frontmatter, body } = parseFrontmatter(content);
        const text = `${JSON.stringify(frontmatter)}\n${body}`;
        return {
          fileName: entry.name,
          modifiedAt: stat.mtime.toISOString(),
          size: stat.size,
          frontmatter,
          body,
          title: inferTitle(body, entry.name, frontmatter),
          summary: createSummary(body),
          action: inferAction(text, frontmatter),
          kind: inferKind(text, frontmatter),
          target: inferTarget(text, frontmatter)
        };
      })
  );

  return files.sort((left, right) => new Date(right.modifiedAt) - new Date(left.modifiedAt));
}

async function getInboxFile(fileName) {
  const safeName = sanitizeFileName(fileName);
  const filePath = path.join(inboxDir, safeName);
  const content = await fs.readFile(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);
  const combined = `${JSON.stringify(frontmatter)}\n${body}`;

  return {
    fileName: safeName,
    content,
    frontmatter,
    body,
    title: inferTitle(body, safeName, frontmatter),
    summary: createSummary(body),
    action: inferAction(combined, frontmatter),
    kind: inferKind(combined, frontmatter),
    target: inferTarget(combined, frontmatter)
  };
}

async function saveInboxFile(body) {
  const safeName = sanitizeFileName(body.fileName || `draft-${Date.now()}.md`);
  const filePath = path.join(inboxDir, safeName);
  await fs.writeFile(filePath, body.content || '', 'utf8');
  return getInboxFile(safeName);
}

async function deleteInboxFile(fileName) {
  const safeName = sanitizeFileName(fileName);
  await fs.unlink(path.join(inboxDir, safeName));
  return { ok: true };
}

async function archiveInboxFile(fileName) {
  const safeName = sanitizeFileName(fileName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archivedName = safeName.replace(/\.md$/i, `--${timestamp}.md`);
  await fs.rename(path.join(inboxDir, safeName), path.join(archiveDir, archivedName));
  return { ok: true, archivedName };
}

async function prepareOperation(fileName, mode = 'publish') {
  const operation = await getInboxFile(fileName);
  const request = {
    mode,
    createdAt: new Date().toISOString(),
    fileName: operation.fileName,
    title: operation.title,
    summary: operation.summary,
    action: operation.action,
    kind: operation.kind,
    target: operation.target,
    frontmatter: operation.frontmatter,
    rawBody: operation.body,
    internalPrompt: buildInternalPrompt(operation)
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const requestFileName = `${stamp}--${mode}--${operation.fileName.replace(/\.md$/i, '.json')}`;
  await fs.writeFile(path.join(pendingDir, requestFileName), JSON.stringify(request, null, 2), 'utf8');
  await fs.writeFile(path.join(pendingDir, 'latest-request.json'), JSON.stringify(request, null, 2), 'utf8');
  await fs.writeFile(path.join(pendingDir, 'latest-prompt.txt'), request.internalPrompt, 'utf8');

  return {
    ...request,
    requestFileName,
    requestPath: `workbench/pending/${requestFileName}`,
    latestRequestPath: 'workbench/pending/latest-request.json',
    latestPromptPath: 'workbench/pending/latest-prompt.txt'
  };
}

async function readDataSource() {
  const raw = await fs.readFile(dataPath, 'utf8');
  return JSON.parse(raw);
}

async function regenerateRss() {
  await execFileAsync(process.execPath, [path.join(rootDir, 'scripts', 'generate-rss.mjs')], { cwd: rootDir });
}

function stringifyDataJson(value, depth = 0) {
  const indent = '  '.repeat(depth);
  const nextIndent = '  '.repeat(depth + 1);

  if (Array.isArray(value)) {
    if (!value.length) {
      return '[]';
    }
    const isPrimitiveArray = value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item));
    if (isPrimitiveArray && value.length <= 8) {
      return `[${value.map((item) => JSON.stringify(item)).join(', ')}]`;
    }
    return `[\n${value.map((item) => `${nextIndent}${stringifyDataJson(item, depth + 1)}`).join(',\n')}\n${indent}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) {
      return '{}';
    }
    return `{\n${entries.map(([key, item]) => `${nextIndent}${JSON.stringify(key)}: ${stringifyDataJson(item, depth + 1)}`).join(',\n')}\n${indent}}`;
  }

  return JSON.stringify(value);
}

async function writeDataSource(data) {
  await fs.writeFile(dataPath, `${stringifyDataJson(data)}\n`, 'utf8');
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeLineEndings(value = '') {
  return String(value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function parseTagList(value = '') {
  return String(value || '')
    .split(',')
    .map((tag) => tag.replace(/^#/, '').trim())
    .filter(Boolean);
}

function extractInlineTags(value = '') {
  return [...String(value || '').matchAll(/#([\u4e00-\u9fa5A-Za-z0-9_-]+)/g)]
    .map((match) => match[1])
    .filter(Boolean);
}

function uniqueTags(...groups) {
  const tags = [];
  groups.flat().forEach((tag) => {
    const normalized = String(tag || '').replace(/^#/, '').trim();
    if (normalized && !tags.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      tags.push(normalized);
    }
  });
  return tags;
}

function slugify(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-') || 'untitled';
}

function localIsoTimestamp(date = new Date()) {
  const localDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  return `${localDate.toISOString().slice(0, 19)}+08:00`;
}

function getDateStamp(value = '') {
  const source = String(value || localIsoTimestamp()).slice(0, 10);
  return source.replace(/-/g, '');
}

function buildUniqueId(kind, title, publishedAt, collection = []) {
  const existingIds = new Set(collection.map((item) => item.id).filter(Boolean));
  const dateStamp = getDateStamp(publishedAt);
  const slug = slugify(title).slice(0, 48);
  const baseId = `${kind}-${dateStamp}-${slug}`;
  let candidate = baseId;
  let suffix = 2;
  while (existingIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function defaultVisibility(kind) {
  return { ...(defaultVisibilityByKind[kind] || defaultVisibilityByKind.capsule) };
}

function splitContentChunks(body = '') {
  return normalizeLineEndings(body)
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function parseStructuredFields(lines = []) {
  const fields = {};
  const rest = [];
  lines.forEach((line) => {
    const match = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (match) {
      fields[match[1]] = match[2].trim();
    } else if (line.trim()) {
      rest.push(line.trim());
    }
  });
  return { fields, rest };
}

function parseStructuredChunk(chunk = '') {
  const lines = normalizeLineEndings(chunk).split('\n').map((line) => line.trim()).filter(Boolean);
  const marker = lines[0] || '';
  const { fields, rest } = parseStructuredFields(lines.slice(1));
  return { marker, fields, rest, raw: chunk.trim() };
}

function isWebUrl(value = '') {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function isImageUrl(value = '') {
  return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(String(value || '').trim());
}

function capsulePayloadFromBody(body = '', operation = {}) {
  const chunks = splitContentChunks(body);
  const structured = chunks.map(parseStructuredChunk);
  const first = structured[0];
  const textChunks = chunks.filter((chunk) => {
    const marker = parseStructuredChunk(chunk).marker;
    return !['[Image]', '[图片]', '[Link]', '[链接]', '[Canvas]'].includes(marker);
  });
  const commentary = textChunks.join('\n\n').trim();

  if (first?.marker === '[Image]' || first?.marker === '[图片]') {
    return {
      type: 'image',
      url: first.fields.url || first.fields.src || '',
      caption: first.fields.caption || operation.title || '',
      commentary
    };
  }

  if (first?.marker === '[Link]' || first?.marker === '[链接]') {
    return {
      type: 'link',
      text: first.fields.text || first.fields.title || first.fields.url || '',
      url: first.fields.url || '',
      image: first.fields.image || '',
      commentary
    };
  }

  if (first?.marker === '[Canvas]') {
    return {
      type: 'canvas',
      canvasId: first.fields.canvasId || first.fields.id || '',
      entry: first.fields.entry || first.fields.src || first.fields.url || '',
      aspectRatio: first.fields.aspectRatio || '16 / 9',
      allowFullscreen: first.fields.allowFullscreen !== 'false',
      caption: first.fields.caption || first.fields.summary || commentary
    };
  }

  const firstText = chunks[0] || '';
  if (isImageUrl(firstText)) {
    return { type: 'image', url: firstText, caption: operation.title || '', commentary };
  }
  if (isWebUrl(firstText)) {
    return { type: 'link', text: operation.title || firstText, url: firstText, commentary };
  }
  return { type: 'thought', content: body.trim(), author: operation.frontmatter?.author || 'Editor' };
}

function blockFromChunk(chunk = '', target = 'issue') {
  const { marker, fields, raw } = parseStructuredChunk(chunk);

  if (target === 'article') {
    const codeMatch = raw.match(/^```([A-Za-z0-9_-]*)\n([\s\S]*?)\n?```$/);
    if (codeMatch) {
      return { type: 'code', language: codeMatch[1].trim(), content: codeMatch[2] };
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
      return {
        type: 'list',
        ordered: listLines.every((line) => /^\d+[.)]\s+/.test(line)),
        items: listLines.map((line) => line.replace(/^([-*+]|\d+[.)])\s+/, '').trim()).filter(Boolean)
      };
    }
  }

  if (marker === '[引用 Capsule]' || marker === '[Capsule]' || marker === '[引用 capsule]') {
    const capsuleId = fields.capsuleId || fields.id || '';
    return capsuleId ? { type: 'capsule-ref', capsuleId } : { type: target === 'article' ? 'paragraph' : 'note', content: raw };
  }

  if (marker === '[引用 Canvas]' || marker === '[Canvas Ref]') {
    const capsuleId = fields.capsuleId || fields.id || '';
    const canvasId = fields.canvasId || '';
    return capsuleId
      ? { type: 'canvas-ref', capsuleId }
      : { type: 'canvas-ref', canvasId };
  }

  if (marker === '[Heading]' || marker === '[标题]') {
    return { type: 'heading', content: fields.text || fields.title || raw.replace(marker, '').trim() };
  }

  if (marker === '[Quote]' || marker === '[引用]') {
    return { type: 'quote', content: fields.text || fields.content || raw.replace(marker, '').trim() };
  }

  if (marker === '[Link]' || marker === '[链接]') {
    return { type: 'link', text: fields.text || fields.title || fields.url || '', url: fields.url || '' };
  }

  if (marker === '[Image]' || marker === '[图片]') {
    return { type: 'image', url: fields.url || fields.src || '', caption: fields.caption || '' };
  }

  return { type: target === 'article' ? 'paragraph' : 'note', content: raw };
}

function blocksFromBody(body = '', target = 'issue') {
  return splitContentChunks(body)
    .map((chunk) => blockFromChunk(chunk, target))
    .filter((block) => {
      if (block.type === 'capsule-ref') {
        return Boolean(block.capsuleId);
      }
      if (block.type === 'canvas-ref') {
        return Boolean(block.capsuleId || block.canvasId);
      }
      if (block.type === 'list') {
        return Array.isArray(block.items) && block.items.some((item) => String(item || '').trim());
      }
      if (block.type === 'code') {
        return Boolean(String(block.content || '').trim());
      }
      return Boolean(String(block.content || block.text || block.url || '').trim());
    });
}

function summaryFromBlocks(blocks = []) {
  return blocks
    .map((block) => {
      if (block.type === 'list') {
        return (block.items || []).join(' ');
      }
      return block.content || block.text || block.capsuleId || block.canvasId || '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function buildEntryFromOperation(operation, data, existingItem = null) {
  const kind = operation.kind;
  const collectionName = collectionByKind[kind];
  const collection = data[collectionName] || [];
  const frontmatter = operation.frontmatter || {};
  const body = operation.body || '';
  const publishedAt = frontmatter.publishedAt || frontmatter.createdAt || operation.frontmatter?.createdAt || localIsoTimestamp();
  const title = frontmatter.title || operation.title || inferTitle(body, operation.fileName, frontmatter);
  const tags = uniqueTags(parseTagList(frontmatter.tags || ''), extractInlineTags(body), existingItem?.tags || []);
  const id = operation.target && operation.target !== 'auto'
    ? operation.target
    : (frontmatter.id || buildUniqueId(kind, title, publishedAt, collection));
  const base = {
    ...(existingItem || {}),
    id,
    slug: frontmatter.slug || existingItem?.slug || slugify(title),
    kind,
    title,
    summary: frontmatter.summary || operation.summary || createSummary(body),
    tags,
    publishedAt: existingItem?.publishedAt || publishedAt,
    visibility: {
      ...defaultVisibility(kind),
      ...(existingItem?.visibility || {})
    }
  };

  if (kind === 'capsule') {
    return {
      ...base,
      payload: capsulePayloadFromBody(body, operation)
    };
  }

  if (kind === 'issue') {
    const blocks = blocksFromBody(body, 'issue');
    return {
      ...base,
      summary: frontmatter.summary || summaryFromBlocks(blocks) || createSummary(body),
      blocks
    };
  }

  if (kind === 'flow') {
    return {
      ...base,
      body
    };
  }

  if (kind === 'article') {
    const blocks = blocksFromBody(body, 'article');
    return {
      ...base,
      columnId: frontmatter.columnId || existingItem?.columnId || '',
      summary: frontmatter.summary || summaryFromBlocks(blocks) || createSummary(body),
      blocks
    };
  }

  if (kind === 'canvas') {
    return {
      ...base,
      entry: frontmatter.entry || existingItem?.entry || '',
      aspectRatio: frontmatter.aspectRatio || existingItem?.aspectRatio || '16 / 9',
      allowFullscreen: frontmatter.allowFullscreen !== 'false'
    };
  }

  return base;
}

function applyEntryToData(data, operation) {
  const collectionName = collectionByKind[operation.kind];
  if (!collectionName) {
    throw new Error(`Unsupported publish kind: ${operation.kind}`);
  }
  const nextData = cloneJson(data);
  const collection = Array.isArray(nextData[collectionName]) ? [...nextData[collectionName]] : [];
  const target = operation.target && operation.target !== 'auto' ? operation.target : '';
  const targetIndex = target ? collection.findIndex((item) => item.id === target) : -1;
  const beforeItem = targetIndex >= 0 ? collection[targetIndex] : null;

  if (operation.action === 'delete') {
    if (targetIndex === -1) {
      throw new Error(`Cannot delete missing ${operation.kind}: ${target || 'auto'}`);
    }
    collection.splice(targetIndex, 1);
    nextData[collectionName] = collection;
    return { nextData, beforeItem, afterItem: null, itemId: target };
  }

  const afterItem = buildEntryFromOperation(operation, nextData, beforeItem);
  if (targetIndex >= 0) {
    collection[targetIndex] = afterItem;
  } else {
    collection.unshift(afterItem);
  }
  nextData[collectionName] = collection;
  return { nextData, beforeItem, afterItem, itemId: afterItem.id };
}

function buildPublishSummary(beforeData, afterData, collectionName) {
  const beforeCollection = beforeData[collectionName] || [];
  const afterCollection = afterData[collectionName] || [];
  return {
    collection: collectionName,
    beforeCount: beforeCollection.length,
    afterCount: afterCollection.length,
    delta: afterCollection.length - beforeCollection.length
  };
}

async function previewPublishOperation(fileName) {
  const operation = await getInboxFile(fileName);
  const validation = await validateOperation(fileName);
  const data = await readDataSource();
  const collectionName = collectionByKind[operation.kind];
  if (!collectionName) {
    throw new Error(`Unsupported publish kind: ${operation.kind}`);
  }
  if (!['create', 'update', 'delete', 'publish'].includes(operation.action)) {
    throw new Error(`Unsupported publish action: ${operation.action}`);
  }
  const normalizedOperation = {
    ...operation,
    action: operation.action === 'publish' ? 'create' : operation.action
  };
  const result = applyEntryToData(data, normalizedOperation);
  return {
    fileName: operation.fileName,
    action: normalizedOperation.action,
    kind: operation.kind,
    target: operation.target,
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
    infos: validation.infos,
    itemId: result.itemId,
    beforeItem: result.beforeItem,
    afterItem: result.afterItem,
    summary: buildPublishSummary(data, result.nextData, collectionName)
  };
}

async function writeUndoRecord(record) {
  await ensureDirectories();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${stamp}--${record.operation.fileName.replace(/\.md$/i, '.json')}`;
  const filePath = path.join(publishUndoDir, fileName);
  await fs.writeFile(filePath, JSON.stringify({ ...record, createdAt: new Date().toISOString() }, null, 2), 'utf8');
  return { fileName, filePath };
}

async function latestUndoRecord() {
  await ensureDirectories();
  const entries = await fs.readdir(publishUndoDir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
      .map(async (entry) => {
        const filePath = path.join(publishUndoDir, entry.name);
        const stat = await fs.stat(filePath);
        return { fileName: entry.name, filePath, modifiedAt: stat.mtime.toISOString() };
      })
  );
  return files.sort((left, right) => new Date(right.modifiedAt) - new Date(left.modifiedAt))[0] || null;
}

async function publishOperation(fileName) {
  const operation = await getInboxFile(fileName);
  const preview = await previewPublishOperation(fileName);
  if (!preview.valid) {
    throw new Error(`Publish validation failed: ${preview.errors.join('; ')}`);
  }
  const dataBefore = await readDataSource();
  const normalizedOperation = {
    ...operation,
    action: operation.action === 'publish' ? 'create' : operation.action
  };
  const { nextData } = applyEntryToData(dataBefore, normalizedOperation);
  const undo = await writeUndoRecord({
    operation: normalizedOperation,
    dataBefore,
    dataAfter: nextData,
    originalContent: operation.content
  });

  await writeDataSource(nextData);
  await regenerateRss();
  const archiveResult = await archiveInboxFile(operation.fileName);
  await fs.writeFile(undo.filePath, JSON.stringify({
    operation: normalizedOperation,
    dataBefore,
    dataAfter: nextData,
    originalContent: operation.content,
    archive: archiveResult,
    createdAt: new Date().toISOString()
  }, null, 2), 'utf8');

  return {
    ...preview,
    archivedName: archiveResult.archivedName,
    undoFileName: undo.fileName
  };
}

async function undoLatestPublish() {
  const latest = await latestUndoRecord();
  if (!latest) {
    throw new Error('No publish undo record found.');
  }
  const record = JSON.parse(await fs.readFile(latest.filePath, 'utf8'));
  await writeDataSource(record.dataBefore);
  await regenerateRss();

  if (record.operation?.fileName && record.originalContent) {
    const inboxPath = path.join(inboxDir, sanitizeFileName(record.operation.fileName));
    await fs.writeFile(inboxPath, record.originalContent, 'utf8');
  }

  if (record.archive?.archivedName) {
    await fs.rm(path.join(archiveDir, record.archive.archivedName), { force: true });
  }
  await fs.rm(latest.filePath, { force: true });

  return {
    ok: true,
    restoredFileName: record.operation?.fileName || '',
    undoneItemId: record.operation?.target || record.afterItem?.id || '',
    undoFileName: latest.fileName
  };
}

async function readPendingRequests() {
  await ensureDirectories();
  const entries = await fs.readdir(pendingDir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json') && entry.name !== 'latest-request.json')
      .map(async (entry) => {
        const filePath = path.join(pendingDir, entry.name);
        const [content, stat] = await Promise.all([fs.readFile(filePath, 'utf8'), fs.stat(filePath)]);
        const payload = JSON.parse(content);
        return {
          fileName: entry.name,
          createdAt: payload.createdAt || stat.mtime.toISOString(),
          mode: payload.mode,
          action: payload.action,
          kind: payload.kind,
          title: payload.title,
          target: payload.target
        };
      })
  );

  return files.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function collectReferencedCapsuleIds(body) {
  return [...body.matchAll(/capsuleId:\s*([\w-]+)/gi)].map((match) => match[1]);
}

async function validateOperation(fileName) {
  const operation = await getInboxFile(fileName);
  const data = await readDataSource();
  const issues = data.issues || [];
  const capsules = data.capsules || [];
  const issueIds = new Set(issues.map((item) => item.id));
  const capsuleIds = new Set(capsules.map((item) => item.id));
  const errors = [];
  const warnings = [];
  const infos = [];

  if (!operation.body.trim()) {
    warnings.push('操作单正文为空，AI 可能无法正确理解你的意图。');
  }

  if (operation.kind === 'auto') {
    warnings.push('当前 kind 仍为 auto，建议使用右侧选择器或模板减少歧义。');
  }

  if (['update', 'delete'].includes(operation.action) && operation.target === 'auto') {
    errors.push('update / delete 操作必须指定明确 target。');
  }

  if (operation.target !== 'auto') {
    const targetKind = operation.target.startsWith('issue-') ? 'issue' : operation.target.startsWith('capsule-') ? 'capsule' : operation.kind;
    if (targetKind === 'issue' && !issueIds.has(operation.target)) {
      errors.push(`目标 Issue 不存在：${operation.target}`);
    }
    if (targetKind === 'capsule' && !capsuleIds.has(operation.target)) {
      errors.push(`目标 Capsule 不存在：${operation.target}`);
    }
  }

  if (operation.kind === 'issue' || /capsuleId:/i.test(operation.body)) {
    const referencedIds = collectReferencedCapsuleIds(operation.body);
    referencedIds.forEach((capsuleId) => {
      if (!capsuleIds.has(capsuleId)) {
        errors.push(`Issue 草稿引用了不存在的 Capsule：${capsuleId}`);
      }
    });

    if (referencedIds.length > 0) {
      infos.push(`检测到 ${referencedIds.length} 个 Capsule 引用。`);
    }
  }

  if (operation.action === 'delete' && operation.target.startsWith('capsule-')) {
    const referencedBy = issues.filter((issue) => issue.blocks?.some((block) => block.type === 'capsule-ref' && block.capsuleId === operation.target));
    if (referencedBy.length > 0) {
      warnings.push(`该 Capsule 仍被 ${referencedBy.length} 个 Issue 引用，删除前需同步处理引用关系。`);
    }
  }

  if (operation.action === 'create' && operation.kind === 'capsule') {
    infos.push('Capsule 默认可搜索、可直链，但不会进入首页流与 RSS。');
  }

  if (operation.action === 'create' && operation.kind === 'issue') {
    infos.push('Issue 默认进入首页流与 RSS；请确认 blocks 编排顺序。');
  }

  return {
    fileName: operation.fileName,
    action: operation.action,
    kind: operation.kind,
    target: operation.target,
    title: operation.title,
    summary: operation.summary,
    errors,
    warnings,
    infos,
    valid: errors.length === 0
  };
}

async function serveStatic(request, response, url) {
  const isBrowseIndex = url.pathname === '/browse' || url.pathname === '/browse/';
  const isBrowseAsset = url.pathname.startsWith('/browse/');
  const isSharedModule = url.pathname.startsWith('/shared/');
  const isDistAsset = url.pathname.startsWith('/assets/')
    || url.pathname.startsWith('/canvases/')
    || url.pathname === '/data.json'
    || url.pathname === '/rss.xml';
  const baseDir = isSharedModule
    ? rootDir
    : ((isBrowseIndex || isBrowseAsset || isDistAsset) ? distDir : studioDir);
  const requestedPath = isBrowseIndex
    ? '/index.html'
    : isBrowseAsset
      ? url.pathname.replace(/^\/browse/, '') || '/index.html'
      : (url.pathname === '/' ? '/index.html' : url.pathname);
  const normalizedPath = path.normalize(requestedPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(baseDir, normalizedPath);

  if (!filePath.startsWith(baseDir)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      sendText(response, 404, 'Not Found');
      return;
    }
    const extension = path.extname(filePath);
    const buffer = await fs.readFile(filePath);
    response.writeHead(200, { 'Content-Type': mimeTypes[extension] || 'application/octet-stream' });
    response.end(buffer);
  } catch {
    sendText(response, 404, 'Not Found');
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`);

  try {
    if (request.method === 'GET' && url.pathname === '/api/inbox') {
      const files = await readInboxFiles();
      sendJson(response, 200, { files });
      return;
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/inbox/')) {
      const fileName = decodeURIComponent(url.pathname.replace('/api/inbox/', ''));
      const file = await getInboxFile(fileName);
      sendJson(response, 200, file);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/inbox') {
      const body = await readBody(request);
      const saved = await saveInboxFile(body);
      sendJson(response, 200, saved);
      return;
    }

    if (request.method === 'DELETE' && url.pathname.startsWith('/api/inbox/')) {
      const fileName = decodeURIComponent(url.pathname.replace('/api/inbox/', ''));
      const result = await deleteInboxFile(fileName);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/archive') {
      const body = await readBody(request);
      const result = await archiveInboxFile(body.fileName);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/prepare') {
      const body = await readBody(request);
      const result = await prepareOperation(body.fileName, body.mode || 'publish');
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/validate') {
      const body = await readBody(request);
      const result = await validateOperation(body.fileName);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/publish/preview') {
      const body = await readBody(request);
      const result = await previewPublishOperation(body.fileName);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/publish/apply') {
      const body = await readBody(request);
      const result = await publishOperation(body.fileName);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/publish/undo') {
      const result = await undoLatestPublish();
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/data-source') {
      const data = await readDataSource();
      sendJson(response, 200, data);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/pending') {
      const requests = await readPendingRequests();
      sendJson(response, 200, { requests });
      return;
    }

    await serveStatic(request, response, url);
  } catch (error) {
    sendJson(response, 500, { error: error.message || '未知错误' });
  }
});

ensureDirectories()
  .then(() => {
    server.listen(port, () => {
      console.log(`Prompt CMS running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
