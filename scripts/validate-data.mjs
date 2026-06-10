import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(rootDir, 'public');
const dataPath = path.join(publicDir, 'data.json');
const schemaPath = path.join(rootDir, 'schemas', 'content.schema.json');

const errors = [];
const warnings = [];
const singularKindByCollection = {
  capsules: 'capsule',
  issues: 'issue',
  flows: 'flow',
  articles: 'article',
  columns: 'column',
  toys: 'toy'
};
const knownVisibilityKeys = new Set(['direct', 'search', 'homepage', 'feed', 'rss']);
const knownCollectionKeys = new Set(['issues', 'articles', 'capsules', 'flows', 'toys']);

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

function validateSchemaArtifact() {
  try {
    JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  } catch (error) {
    addError(`schemas/content.schema.json is not valid JSON: ${error.message}`);
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
    if (!knownVisibilityKeys.has(key)) {
      addWarning(`${label} visibility.${key} is not a known visibility flag.`);
    }
    if (typeof value !== 'boolean') {
      addError(`${label} visibility.${key} must be a boolean.`);
    }
  });
}

function validateIsoDate(value, label) {
  if (value === undefined) {
    return;
  }
  const text = String(value || '').trim();
  if (!text || Number.isNaN(new Date(text).getTime())) {
    addError(`${label} must be a valid date string.`);
  }
}

function validateSeo(entry, label) {
  if (entry.seo === undefined) {
    return;
  }
  if (!isPlainObject(entry.seo)) {
    addError(`${label}.seo must be an object.`);
    return;
  }
  ['title', 'description', 'image', 'canonicalUrl'].forEach((key) => {
    if (entry.seo[key] !== undefined && typeof entry.seo[key] !== 'string') {
      addError(`${label}.seo.${key} must be a string.`);
    }
  });
  if (entry.seo.image && !looksRemote(entry.seo.image)) {
    validatePublicFile(entry.seo.image, `${label}.seo.image`);
  }
  if (entry.seo.canonicalUrl && !looksRemote(entry.seo.canonicalUrl)) {
    addWarning(`${label}.seo.canonicalUrl should be an absolute URL.`);
  }
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
    validateIsoDate(entry.publishedAt, `${label}.publishedAt`);
    validateSeo(entry, label);

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

function validateSite(site) {
  if (!isPlainObject(site)) {
    addError('Expected "site" to be an object.');
    return;
  }
  requireString(site, 'title', 'site');
  requireString(site, 'description', 'site');
  if (site.repoUrl && !looksRemote(site.repoUrl)) {
    addWarning('site.repoUrl should be an absolute URL.');
  }
  if (site.baseUrl && !looksRemote(site.baseUrl)) {
    addError('site.baseUrl must be an absolute URL.');
  }
  if (site.rssPath !== undefined && typeof site.rssPath !== 'string') {
    addError('site.rssPath must be a string.');
  }
  validateSeo(site, 'site');
}

function validateFeatures(features = {}) {
  if (features === undefined) {
    return;
  }
  if (!isPlainObject(features)) {
    addError('Expected "features" to be an object.');
    return;
  }
  ['rssSources', 'homepageShows', 'searchScopes'].forEach((key) => {
    if (features[key] === undefined) {
      return;
    }
    if (!Array.isArray(features[key]) || features[key].some((item) => typeof item !== 'string' || !item.trim())) {
      addError(`features.${key} must be an array of strings.`);
      return;
    }
    features[key].forEach((item) => {
      if (key !== 'searchScopes' && !knownCollectionKeys.has(item)) {
        addWarning(`features.${key} contains unknown collection "${item}".`);
      }
    });
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

function validateBlock(block, label, capsuleIds, toyIds) {
  if (!isPlainObject(block)) {
    addError(`${label} must be an object.`);
    return;
  }

  const type = String(block.type || '').trim();
  if (!type) {
    addError(`${label} is missing block.type.`);
    return;
  }

  if (type === 'capsule-ref') {
    const capsuleId = requireString(block, 'capsuleId', label);
    if (capsuleId && !capsuleIds.has(capsuleId)) {
      addError(`${label} references missing capsule "${capsuleId}".`);
    }
    return;
  }

  if (type === 'toy-ref') {
    const toyId = String(block.toyId || '').trim();
    if (!label.startsWith('articles[')) {
      addError(`${label} uses ${type}, but only Article can reference Toy.`);
      return;
    }
    if (!toyId) {
      addError(`${label} needs toyId.`);
      return;
    }
    if (!toyIds.has(toyId)) {
      addError(`${label} references missing toy "${toyId}".`);
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

  if (type === 'toy') {
    const toyId = String(block.toyId || '').trim();
    if (!label.startsWith('articles[')) {
      addError(`${label} uses ${type}, but only Article can embed Toy.`);
      return;
    }
    if (toyId && !toyIds.has(toyId)) {
      addError(`${label} references missing toy "${toyId}".`);
    }
    const entry = String(block.entry || block.src || block.url || '').trim();
    if (!entry && !toyId) {
      addError(`${label} toy block needs entry, src, or url.`);
      return;
    }
    if (entry) {
      validatePublicFile(entry, `${label} toy entry`);
    }
    return;
  }

  if (type === 'list') {
    if (!Array.isArray(block.items) || block.items.some((item) => typeof item !== 'string' || !item.trim())) {
      addError(`${label} list block needs a non-empty items array.`);
    }
    return;
  }

  if (type === 'code') {
    if (!String(block.content || block.text || block.code || '').trim()) {
      addWarning(`${label} code block is empty.`);
    }
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

function validateBlocks(entry, label, capsuleIds, toyIds) {
  const blockSources = [
    ...(Array.isArray(entry.blocks) ? entry.blocks : []),
    ...(Array.isArray(entry.payload?.blocks) ? entry.payload.blocks : [])
  ];
  blockSources.forEach((block, index) => validateBlock(block, `${label}.blocks[${index}]`, capsuleIds, toyIds));
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
  } else if (type === 'toy') {
    addError(`${label}.payload type "${type}" is no longer allowed; create a top-level Toy and reference it from Article.`);
  } else if (type !== 'thought') {
    addError(`${label}.payload uses unsupported type "${type}".`);
  }
}

function validateArticles(articles, columnIds, capsuleIds, toyIds) {
  articles.forEach((article, index) => {
    const label = `articles[${index}]`;
    if (article.columnId && !columnIds.has(article.columnId)) {
      addError(`${label} references missing column "${article.columnId}".`);
    }
    validateBlocks(article, label, capsuleIds, toyIds);
  });
}

function validateData() {
  validateSchemaArtifact();
  const data = readData();
  validateSite(data.site);
  validateFeatures(data.features || {});
  const capsules = requireArray(data, 'capsules');
  const issues = requireArray(data, 'issues');
  const flows = requireArray(data, 'flows');
  const articles = requireArray(data, 'articles');
  const columns = requireArray(data, 'columns');
  const toys = requireArray(data, 'toys');

  validateEntryIdentity(capsules, 'capsules');
  validateEntryIdentity(issues, 'issues');
  validateEntryIdentity(flows, 'flows');
  validateEntryIdentity(articles, 'articles');
  validateEntryIdentity(columns, 'columns');
  validateEntryIdentity(toys, 'toys');

  const capsuleIds = new Set(capsules.map((capsule) => capsule.id).filter(Boolean));
  const columnIds = new Set(columns.map((column) => column.id).filter(Boolean));
  const toyIds = new Set(toys.map((toy) => toy.id).filter(Boolean));

  capsules.forEach((capsule, index) => {
    const label = `capsules[${index}]`;
    validateCapsulePayload(capsule, label);
    validateBlocks(capsule, label, capsuleIds, toyIds);
  });
  toys.forEach((toy, index) => {
    const label = `toys[${index}]`;
    const entry = String(toy.entry || toy.src || toy.url || '').trim();
    if (!entry) {
      addError(`${label} needs entry, src, or url.`);
    } else {
      validatePublicFile(entry, `${label} entry`);
    }
  });
  issues.forEach((issue, index) => validateBlocks(issue, `issues[${index}]`, capsuleIds, toyIds));
  validateArticles(articles, columnIds, capsuleIds, toyIds);

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
