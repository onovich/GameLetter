const defaultGiscusConfig = {
  repo: 'onovich/GameLetter',
  repoId: 'R_kgDOSJIoWQ',
  category: 'Announcements',
  categoryId: 'DIC_kwDOSJIoWc4C-4Gu'
};

function getGiscusConfig() {
  return {
    repo: process.env.VITE_GISCUS_REPO || defaultGiscusConfig.repo,
    repoId: process.env.VITE_GISCUS_REPO_ID || defaultGiscusConfig.repoId,
    category: process.env.VITE_GISCUS_CATEGORY || defaultGiscusConfig.category,
    categoryId: process.env.VITE_GISCUS_CATEGORY_ID || defaultGiscusConfig.categoryId,
    token: process.env.GITHUB_DISCUSSIONS_TOKEN || process.env.GITHUB_TOKEN || ''
  };
}

function parseRepositoryName(repo = '') {
  const [owner, name] = String(repo || '').split('/');
  if (!owner || !name) {
    throw new Error('Giscus repo must use owner/name format.');
  }
  return { owner, name };
}

function getDiscussionTokenStatus() {
  const config = getGiscusConfig();
  return {
    configured: Boolean(config.token),
    repo: config.repo,
    category: config.category,
    categoryId: config.categoryId,
    tokenEnv: config.token ? 'configured' : 'missing'
  };
}

async function githubGraphql(query, variables = {}) {
  const config = getGiscusConfig();
  if (!config.token) {
    const error = new Error('Missing GITHUB_DISCUSSIONS_TOKEN or GITHUB_TOKEN. Set one and restart the CMS.');
    error.code = 'MISSING_GITHUB_TOKEN';
    throw error;
  }

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
      'User-Agent': 'GameLetter-CMS'
    },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.map((item) => item.message).join('; ') || `GitHub GraphQL request failed: ${response.status}`;
    throw new Error(message);
  }
  return payload.data;
}

function getAuthorSummary(author) {
  if (!author) {
    return { login: 'ghost', url: '', avatarUrl: '' };
  }
  return {
    login: author.login || 'ghost',
    url: author.url || '',
    avatarUrl: author.avatarUrl || ''
  };
}

function createCommentSummary(comment, discussion, localIssue, parentComment = null) {
  return {
    id: comment.id,
    databaseId: comment.databaseId || null,
    bodyText: comment.bodyText || '',
    bodyHTML: comment.bodyHTML || '',
    createdAt: comment.createdAt || '',
    updatedAt: comment.updatedAt || '',
    url: comment.url || '',
    viewerCanDelete: Boolean(comment.viewerCanDelete),
    isReply: Boolean(parentComment),
    parentCommentId: parentComment?.id || '',
    parentAuthor: parentComment?.author?.login || '',
    author: getAuthorSummary(comment.author),
    discussion: {
      id: discussion.id,
      number: discussion.number,
      title: discussion.title || '',
      url: discussion.url || '',
      createdAt: discussion.createdAt || '',
      updatedAt: discussion.updatedAt || ''
    },
    issue: localIssue
      ? {
          id: localIssue.id,
          title: localIssue.title,
          slug: localIssue.slug || ''
        }
      : null
  };
}

export async function readDiscussionComments(readDataSource) {
  const config = getGiscusConfig();
  const status = getDiscussionTokenStatus();
  if (!status.configured) {
    return {
      status,
      comments: [],
      discussions: [],
      truncated: false,
      warnings: ['Set GITHUB_DISCUSSIONS_TOKEN or GITHUB_TOKEN and restart the CMS to read and manage comments.']
    };
  }

  const { owner, name } = parseRepositoryName(config.repo);
  const dataSource = await readDataSource();
  const issuesById = new Map((dataSource.issues || []).map((issue) => [issue.id, issue]));
  const comments = [];
  const discussions = [];
  const warnings = [];
  let after = null;
  let truncated = false;

  const query = `
    query GameLetterComments($owner: String!, $name: String!, $categoryId: ID!, $after: String) {
      repository(owner: $owner, name: $name) {
        discussions(first: 50, after: $after, categoryId: $categoryId, orderBy: { field: UPDATED_AT, direction: DESC }) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            number
            title
            url
            createdAt
            updatedAt
            author { login url avatarUrl }
            comments(first: 100) {
              totalCount
              pageInfo { hasNextPage endCursor }
              nodes {
                id
                databaseId
                bodyText
                bodyHTML
                createdAt
                updatedAt
                url
                viewerCanDelete
                author { login url avatarUrl }
                replies(first: 50) {
                  totalCount
                  pageInfo { hasNextPage endCursor }
                  nodes {
                    id
                    databaseId
                    bodyText
                    bodyHTML
                    createdAt
                    updatedAt
                    url
                    viewerCanDelete
                    author { login url avatarUrl }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  do {
    const payload = await githubGraphql(query, { owner, name, categoryId: config.categoryId, after });
    const connection = payload.repository?.discussions;
    if (!connection) {
      break;
    }

    (connection.nodes || []).forEach((discussion) => {
      const localIssue = issuesById.get(discussion.title) || null;
      const discussionCommentConnection = discussion.comments || {};
      discussions.push({
        id: discussion.id,
        number: discussion.number,
        title: discussion.title || '',
        url: discussion.url || '',
        commentCount: discussionCommentConnection.totalCount || 0,
        issue: localIssue ? { id: localIssue.id, title: localIssue.title, slug: localIssue.slug || '' } : null
      });
      if (discussionCommentConnection.pageInfo?.hasNextPage) {
        truncated = true;
        warnings.push(`Discussion ${discussion.title || discussion.number} has more than 100 comments; only the first 100 were loaded.`);
      }
      (discussionCommentConnection.nodes || []).forEach((comment) => {
        comments.push(createCommentSummary(comment, discussion, localIssue));
        if (comment.replies?.pageInfo?.hasNextPage) {
          truncated = true;
          warnings.push(`Comment ${comment.id} has more than 50 replies; only the first 50 were loaded.`);
        }
        (comment.replies?.nodes || []).forEach((reply) => {
          comments.push(createCommentSummary(reply, discussion, localIssue, comment));
        });
      });
    });

    truncated = truncated || Boolean(connection.pageInfo?.hasNextPage);
    after = connection.pageInfo?.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (after);

  comments.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  return {
    status,
    comments,
    discussions,
    truncated,
    warnings: [...new Set(warnings)]
  };
}

export async function deleteDiscussionComment(commentId) {
  if (!commentId) {
    throw new Error('Missing comment id.');
  }
  const mutation = `
    mutation GameLetterDeleteComment($id: ID!) {
      deleteDiscussionComment(input: { id: $id }) {
        clientMutationId
      }
    }
  `;
  await githubGraphql(mutation, { id: commentId });
  return { ok: true, deletedCommentId: commentId };
}
