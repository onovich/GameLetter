import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const studioDir = path.join(rootDir, 'studio');
const inboxDir = path.join(rootDir, 'workbench', 'inbox');
const archiveDir = path.join(rootDir, 'workbench', 'archive');
const pendingDir = path.join(rootDir, 'workbench', 'pending');
const dataPath = path.join(rootDir, 'public', 'data.json');
const port = Number(process.env.PROMPT_CMS_PORT || 4318);

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
    fs.mkdir(pendingDir, { recursive: true })
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
  return 'auto';
}

function inferTarget(text, frontmatter) {
  if (frontmatter.target && frontmatter.target !== 'auto') {
    return frontmatter.target;
  }

  const match = text.match(/(issue-[\w-]+|capsule-[\w-]+)/i);
  return match ? match[1] : 'auto';
}

function inferTitle(text, fileName) {
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
          title: inferTitle(body, entry.name),
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
    title: inferTitle(body, safeName),
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
  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const normalizedPath = path.normalize(requestedPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(studioDir, normalizedPath);

  if (!filePath.startsWith(studioDir)) {
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
