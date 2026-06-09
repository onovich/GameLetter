import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(rootDir, 'public');
const dataPath = path.join(publicDir, 'data.json');

const errors = [];
const warnings = [];
const singularKindByCollection = {
  capsules: 'capsule',
  issues: 'issue',
  flows: 'flow',
  articles: 'article',
  columns: 'column',
  canvases: 'canvas'
};

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readData() {
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (error) {
    addError(`public/data.json is not valid JSON: ${error.message}`);
    return {};
  }
}

function requireArray(data, key) {
  if (!Array.isArray(data[key])) {
    addError(`Expected "${key}" to be an array.`);
    return [];
  }
  return data[key];
}

function requireString(entry, key, label) {
  const value = entry[key];
  if (typeof value !== 'string' || !value.trim()) {
    addError(`${label} is missing required string field "${key}".`);
    return '';
  }
  return value.trim();
}

function validateTags(entry, label) {
  if (entry.tags === undefined) {
    return;
  }
  if (!Array.isArray(entry.tags) || entry.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) {
    addError(`${label} has invalid "tags"; expected an array of non-empty strings.`);
  }
}

function validateVisibility(entry, label) {
  if (entry.visibility === undefined) {
    return;
  }
  if (!isPlainObject(entry.visibility)) {
    addError(`${label} has invalid "visibility"; expected an object.`);
    return;
  }
  Object.entries(entry.visibility).forEach(([key, value]) => {
    if (typeof value !== 'boolean') {
      addError(`${label} visibility.${key} must be a boolean.`);
    }
  });
}

function validateEntryIdentity(entries, kind) {
  const ids = new Map();
  const slugs = new Map();
  const expectedKind = singularKindByCollection[kind] || kind.replace(/s$/, '');

  entries.forEach((entry, index) => {
    const label = `${kind}[${index}]`;
    const id = requireString(entry, 'id', label);
    const slug = requireString(entry, 'slug', label);
    requireString(entry, 'title', label);
    validateTags(entry, label);
    validateVisibility(entry, label);

    if (entry.kind && entry.kind !== expectedKind) {
      addWarning(`${label} has kind "${entry.kind}", expected "${expectedKind}".`);
    }
    if (id) {
      if (ids.has(id)) {
        addError(`${label} duplicates id "${id}" from ${ids.get(id)}.`);
      }
      ids.set(id, label);
    }
    if (slug) {
      if (slugs.has(slug)) {
        addError(`${label} duplicates slug "${slug}" from ${slugs.get(slug)}.`);
      }
      slugs.set(slug, label);
    }
  });
}

function looksRemote(value = '') {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function validatePublicFile(entryPath, label) {
  const value = String(entryPath || '').trim();
  if (!value || looksRemote(value)) {
    return;
  }

  const resolved = path.resolve(publicDir, value.replace(/^\/+/, ''));
  if (!resolved.startsWith(publicDir)) {
    addError(`${label} points outside public/: "${value}".`);
    return;
  }
  if (!fs.existsSync(resolved)) {
    addError(`${label} points to a missing public asset: "${value}".`);
  }
}

function validateBlock(block, label, capsuleIds) {
  if (!isPlainObject(block)) {
    addError(`${label} must be an object.`);
    return;
  }

  const type = String(block.type || '').trim();
  if (!type) {
    addError(`${label} is missing block.type.`);
    return;
  }

  if (type === 'capsule-ref' || type === 'canvas-ref') {
    const capsuleId = requireString(block, 'capsuleId', label);
    if (capsuleId && !capsuleIds.has(capsuleId)) {
      addError(`${label} references missing capsule "${capsuleId}".`);
    }
    return;
  }

  if (type === 'image') {
    requireString(block, 'url', label);
    return;
  }

  if (type === 'link') {
    if (!String(block.url || block.text || block.title || '').trim()) {
      addError(`${label} link block needs at least one of url, text, or title.`);
    }
    return;
  }

  if (type === 'canvas') {
    const entry = String(block.entry || block.src || block.url || '').trim();
    if (!entry) {
      addError(`${label} canvas block needs entry, src, or url.`);
      return;
    }
    validatePublicFile(entry, `${label} canvas entry`);
    return;
  }

  if (['heading', 'paragraph', 'quote', 'note', 'text', 'thought'].includes(type)) {
    if (!String(block.content || block.text || '').trim()) {
      addWarning(`${label} ${type} block is empty.`);
    }
    return;
  }

  addWarning(`${label} uses unknown block type "${type}".`);
}

function validateBlocks(entry, label, capsuleIds) {
  const blockSources = [
    ...(Array.isArray(entry.blocks) ? entry.blocks : []),
    ...(Array.isArray(entry.payload?.blocks) ? entry.payload.blocks : [])
  ];
  blockSources.forEach((block, index) => validateBlock(block, `${label}.blocks[${index}]`, capsuleIds));
}

function validateCapsulePayload(capsule, label) {
  if (!capsule.payload) {
    return;
  }
  if (!isPlainObject(capsule.payload)) {
    addError(`${label}.payload must be an object.`);
    return;
  }

  const type = String(capsule.payload.type || '').trim();
  if (!type) {
    addWarning(`${label}.payload is missing type.`);
    return;
  }

  if (type === 'link') {
    requireString(capsule.payload, 'url', `${label}.payload`);
  } else if (type === 'image') {
    requireString(capsule.payload, 'url', `${label}.payload`);
  } else if (type === 'canvas') {
    const entry = String(capsule.payload.entry || capsule.payload.src || capsule.payload.url || '').trim();
    if (!entry) {
      addError(`${label}.payload canvas needs entry, src, or url.`);
    } else {
      validatePublicFile(entry, `${label}.payload canvas entry`);
    }
  } else if (type !== 'thought') {
    addWarning(`${label}.payload uses unknown type "${type}".`);
  }
}

function validateArticles(articles, columnIds, capsuleIds) {
  articles.forEach((article, index) => {
    const label = `articles[${index}]`;
    if (article.columnId && !columnIds.has(article.columnId)) {
      addError(`${label} references missing column "${article.columnId}".`);
    }
    validateBlocks(article, label, capsuleIds);
  });
}

function validateData() {
  const data = readData();
  const capsules = requireArray(data, 'capsules');
  const issues = requireArray(data, 'issues');
  const flows = requireArray(data, 'flows');
  const articles = requireArray(data, 'articles');
  const columns = requireArray(data, 'columns');
  const canvases = Array.isArray(data.canvases) ? data.canvases : [];

  validateEntryIdentity(capsules, 'capsules');
  validateEntryIdentity(issues, 'issues');
  validateEntryIdentity(flows, 'flows');
  validateEntryIdentity(articles, 'articles');
  validateEntryIdentity(columns, 'columns');
  validateEntryIdentity(canvases, 'canvases');

  const capsuleIds = new Set(capsules.map((capsule) => capsule.id).filter(Boolean));
  const columnIds = new Set(columns.map((column) => column.id).filter(Boolean));

  capsules.forEach((capsule, index) => {
    const label = `capsules[${index}]`;
    validateCapsulePayload(capsule, label);
    validateBlocks(capsule, label, capsuleIds);
  });
  canvases.forEach((canvas, index) => {
    const label = `canvases[${index}]`;
    const entry = String(canvas.entry || canvas.src || canvas.url || '').trim();
    if (!entry) {
      addError(`${label} needs entry, src, or url.`);
    } else {
      validatePublicFile(entry, `${label} entry`);
    }
  });
  issues.forEach((issue, index) => validateBlocks(issue, `issues[${index}]`, capsuleIds));
  validateArticles(articles, columnIds, capsuleIds);

  if (errors.length) {
    console.error('Data validation failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    if (warnings.length) {
      console.warn('\nWarnings:');
      warnings.forEach((warning) => console.warn(`- ${warning}`));
    }
    process.exit(1);
  }

  if (warnings.length) {
    console.warn('Data validation passed with warnings:');
    warnings.forEach((warning) => console.warn(`- ${warning}`));
    return;
  }

  console.log('Data validation passed.');
}

validateData();
