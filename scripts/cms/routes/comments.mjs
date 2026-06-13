import { deleteDiscussionComment, readDiscussionComments } from '../services/github-discussions.mjs';
import { sendJson } from '../utils/http.mjs';

export async function handleCommentsRoute({ request, response, url, readDataSource }) {
  if (request.method === 'GET' && url.pathname === '/api/comments') {
    const comments = await readDiscussionComments(readDataSource);
    sendJson(response, 200, comments);
    return true;
  }

  if (request.method === 'DELETE' && url.pathname.startsWith('/api/comments/')) {
    const commentId = decodeURIComponent(url.pathname.replace('/api/comments/', ''));
    const result = await deleteDiscussionComment(commentId);
    sendJson(response, 200, result);
    return true;
  }

  return false;
}
