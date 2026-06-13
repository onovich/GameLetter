import fs from 'node:fs/promises';
import path from 'node:path';
import { sendText } from '../utils/http.mjs';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

export async function serveStatic({ response, url, rootDir, studioDir, distDir }) {
  const isBrowseIndex = url.pathname === '/browse' || url.pathname === '/browse/';
  const isBrowseAsset = url.pathname.startsWith('/browse/');
  const isSharedModule = url.pathname.startsWith('/shared/');
  const isDistAsset = url.pathname.startsWith('/assets/')
    || url.pathname.startsWith('/toys/')
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
