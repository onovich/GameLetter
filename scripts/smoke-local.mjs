import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getArticleBlocks,
  getCapsuleBlocks,
  getCapsuleEmbedPreview,
  parseCapsuleBodyToBlocks,
  serializeCapsuleBlocks
} from '../shared/content-blocks.js';
import { buildHash, parseHashRoute } from '../src/content/modes.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PROMPT_CMS_SMOKE_PORT || 4387);
const baseUrl = `http://127.0.0.1:${port}`;
const timeoutMs = 15000;

function log(message) {
  console.log(`[smoke] ${message}`);
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: options.body ? { 'Content-Type': 'application/json', ...(options.headers || {}) } : options.headers,
    ...options
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${pathname} failed: ${response.status} ${text}`);
  }
  return {
    response,
    text,
    json: () => JSON.parse(text)
  };
}

async function waitForServer(child) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`CMS server exited early with code ${child.exitCode}`);
    }
    try {
      await request('/api/data-source');
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error(`CMS server did not become ready: ${lastError?.message || 'timeout'}`);
}

async function startServer() {
  const child = spawn(process.execPath, ['scripts/prompt-cms-server.mjs'], {
    cwd: rootDir,
    env: { ...process.env, PROMPT_CMS_PORT: String(port), GITHUB_DISCUSSIONS_TOKEN: '', GITHUB_TOKEN: '' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  child.on('exit', () => {
    if (stderr.trim()) {
      console.error(stderr.trim());
    }
  });

  await waitForServer(child);
  return child;
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) {
    return;
  }
  child.kill();
  await new Promise((resolve) => {
    child.once('exit', resolve);
    setTimeout(resolve, 1500);
  });
}

function runContentModelSmoke() {
  const toy = {
    id: 'toy-smoke',
    title: 'Smoke Toy',
    summary: 'Interactive smoke toy',
    entry: '/toys/smoke/index.html',
    tags: ['Toy']
  };
  const toysById = new Map([[toy.id, toy]]);
  const capsule = {
    id: 'capsule-smoke',
    title: 'Smoke Capsule',
    summary: 'Fallback summary',
    blocks: [
      { type: 'link', text: 'Readable link', url: 'https://example.com' },
      { type: 'text', text: 'Capsule remains link, image, or thought.' }
    ]
  };

  const blocks = getCapsuleBlocks(capsule);
  assert.equal(blocks[0].type, 'link');
  assert.equal(getCapsuleEmbedPreview(capsule, blocks).eyebrow, 'Capsule');

  const serialized = serializeCapsuleBlocks(blocks);
  assert.equal(parseCapsuleBodyToBlocks(serialized)[0].type, 'link');

  const articleBlocks = getArticleBlocks({
    body: 'Intro paragraph.\n\n## A long-form section\n\n[Toy]\ntoyId: toy-smoke\n\n> A pull quote.'
  }, { toysById });
  assert.deepEqual(articleBlocks.map((block) => block.type), ['paragraph', 'heading', 'toy', 'quote']);
  assert.equal(articleBlocks[2].entry, toy.entry);

  assert.deepEqual(parseHashRoute(buildHash('capsule')), { kind: 'capsule', slug: '' });
  assert.deepEqual(parseHashRoute(buildHash('capsule', 'designing-better-game-huds')), { kind: 'capsule', slug: 'designing-better-game-huds' });
}

async function runBrowsePathSmoke() {
  const cmsIndex = await request('/');
  assert.match(cmsIndex.text, /app\.js/);

  const sharedModule = await request('/shared/content-blocks.js');
  assert.match(sharedModule.text, /getCapsuleBlocks/);

  const browseIndex = await request('/browse/');
  assert.match(browseIndex.text, /assets\/index-/);
  const assetMatch = browseIndex.text.match(/src="([^"]+index-[^"]+\.js)"/);
  assert.ok(assetMatch, 'browse index should reference a built JS asset');
  await request(assetMatch[1]);

  const data = (await request('/data.json')).json();
  assert.ok(Array.isArray(data.toys) && data.toys.length > 0, 'data.json should expose toys');

  const firstToy = data.toys.find((toy) => toy.entry) || data.toys[0];
  assert.ok(firstToy?.entry, 'at least one toy should have an entry');
  assert.ok(firstToy.poster, 'toy should expose a poster preview');
  assert.ok(!String(firstToy.summary || '').includes('???'), 'toy summary should not contain placeholder question marks');
  assert.ok(!String(firstToy.summary || '').includes('Article'), 'toy summary should describe the toy itself');
  await request(firstToy.poster);
  const toyPage = await request(firstToy.entry);
  assert.match(toyPage.text, /<canvas|interactive|Toy/i);
}

async function runCommentsSmoke() {
  const comments = (await request('/api/comments')).json();
  assert.equal(comments.status.configured, false);
  assert.equal(comments.status.repo, 'onovich/GameLetter');
  assert.equal(comments.status.category, 'Announcements');
  assert.ok(Array.isArray(comments.comments));
  assert.ok(comments.warnings.some((warning) => warning.includes('GITHUB_DISCUSSIONS_TOKEN')));
}

async function runPublishFlowSmoke() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const fileName = `flow-smoke-${stamp}.md`;
  const title = `Smoke Flow ${stamp}`;
  const body = `Local smoke draft ${stamp}\n\n#Smoke #Local`;
  const content = [
    '---',
    'action: create',
    'kind: flow',
    'target: auto',
    `title: ${title}`,
    'tags: Smoke, Local',
    `createdAt: ${new Date().toISOString()}`,
    '---',
    '',
    body
  ].join('\n');

  let itemId = '';
  let applied = false;

  try {
    await request('/api/inbox', {
      method: 'POST',
      body: JSON.stringify({ fileName, content })
    });

    const preview = (await request('/api/publish/preview', {
      method: 'POST',
      body: JSON.stringify({ fileName })
    })).json();
    assert.equal(preview.valid, true);
    assert.equal(preview.kind, 'flow');
    assert.equal(preview.action, 'create');
    assert.equal(preview.summary.delta, 1);
    itemId = preview.itemId;
    assert.ok(itemId, 'preview should return itemId');

    const appliedPreview = (await request('/api/publish/apply', {
      method: 'POST',
      body: JSON.stringify({ fileName })
    })).json();
    applied = true;
    assert.equal(appliedPreview.itemId, itemId);

    const afterPublish = (await request('/api/data-source')).json();
    assert.ok(afterPublish.flows.some((flow) => flow.id === itemId), 'published smoke flow should be in data-source');

    const undo = (await request('/api/publish/undo', {
      method: 'POST',
      body: JSON.stringify({})
    })).json();
    applied = false;
    assert.equal(undo.ok, true);

    const afterUndo = (await request('/api/data-source')).json();
    assert.ok(!afterUndo.flows.some((flow) => flow.id === itemId), 'undo should remove smoke flow from data-source');
  } finally {
    if (applied) {
      await request('/api/publish/undo', { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
    }
    await request(`/api/inbox/${encodeURIComponent(fileName)}`, { method: 'DELETE' }).catch(() => {});
  }
}

async function main() {
  log('checking shared content model');
  runContentModelSmoke();

  log(`starting CMS on ${baseUrl}`);
  const server = await startServer();
  try {
    log('checking browse and static paths');
    await runBrowsePathSmoke();

    log('checking comments management fallback');
    await runCommentsSmoke();

    log('checking publish preview/apply/undo');
    await runPublishFlowSmoke();
  } finally {
    await stopServer(server);
  }

  log('local smoke passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
