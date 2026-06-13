import { readBody, sendJson } from '../utils/http.mjs';

export async function handleInboxRoute(deps) {
  const {
    request,
    response,
    url,
    readInboxFiles,
    getInboxFile,
    saveInboxFile,
    deleteInboxFile,
    archiveInboxFile,
    prepareOperation,
    validateOperation,
    readPendingRequests
  } = deps;

  if (request.method === 'GET' && url.pathname === '/api/inbox') {
    const files = await readInboxFiles();
    sendJson(response, 200, { files });
    return true;
  }

  if (request.method === 'GET' && url.pathname.startsWith('/api/inbox/')) {
    const fileName = decodeURIComponent(url.pathname.replace('/api/inbox/', ''));
    const file = await getInboxFile(fileName);
    sendJson(response, 200, file);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/inbox') {
    const body = await readBody(request);
    const saved = await saveInboxFile(body);
    sendJson(response, 200, saved);
    return true;
  }

  if (request.method === 'DELETE' && url.pathname.startsWith('/api/inbox/')) {
    const fileName = decodeURIComponent(url.pathname.replace('/api/inbox/', ''));
    const result = await deleteInboxFile(fileName);
    sendJson(response, 200, result);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/archive') {
    const body = await readBody(request);
    const result = await archiveInboxFile(body.fileName);
    sendJson(response, 200, result);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/prepare') {
    const body = await readBody(request);
    const result = await prepareOperation(body.fileName, body.mode || 'publish');
    sendJson(response, 200, result);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/validate') {
    const body = await readBody(request);
    const result = await validateOperation(body.fileName);
    sendJson(response, 200, result);
    return true;
  }

  if (request.method === 'GET' && url.pathname === '/api/pending') {
    const requests = await readPendingRequests();
    sendJson(response, 200, { requests });
    return true;
  }

  return false;
}
