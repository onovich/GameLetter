import { readBody, sendJson } from '../utils/http.mjs';

export async function handlePublishRoute(deps) {
  const {
    request,
    response,
    url,
    previewPublishOperation,
    publishOperation,
    undoLatestPublish,
    readDataSource
  } = deps;

  if (request.method === 'POST' && url.pathname === '/api/publish/preview') {
    const body = await readBody(request);
    const result = await previewPublishOperation(body.fileName);
    sendJson(response, 200, result);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/publish/apply') {
    const body = await readBody(request);
    const result = await publishOperation(body.fileName);
    sendJson(response, 200, result);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/publish/undo') {
    const result = await undoLatestPublish();
    sendJson(response, 200, result);
    return true;
  }

  if (request.method === 'GET' && url.pathname === '/api/data-source') {
    const data = await readDataSource();
    sendJson(response, 200, data);
    return true;
  }

  return false;
}
