import { escapeHtml, renderTextContent } from './content-utils.js';

function formatCommentTime(value = '') {
  if (!value) {
    return '';
  }
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getFilteredComments(ui) {
  const search = ui.search.trim().toLowerCase();
  return (ui.comments || []).filter((comment) => {
    if (ui.issueFilter !== 'all' && comment.issue?.id !== ui.issueFilter && comment.discussion?.title !== ui.issueFilter) {
      return false;
    }
    if (!search) {
      return true;
    }
    const haystack = [
      comment.bodyText,
      comment.author?.login,
      comment.issue?.title,
      comment.issue?.id,
      comment.discussion?.title
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(search);
  });
}

function getCommentIssueCounts(ui) {
  const counts = new Map();
  (ui.comments || []).forEach((comment) => {
    const key = comment.issue?.id || comment.discussion?.title || 'unmapped';
    const label = comment.issue?.title || comment.discussion?.title || '未匹配 Issue';
    counts.set(key, {
      key,
      label,
      count: (counts.get(key)?.count || 0) + 1
    });
  });
  return [...counts.values()].sort((left, right) => right.count - left.count);
}

function renderCommentCard(comment) {
  const author = comment.author || {};
  const body = comment.bodyText || '';
  const issueLabel = comment.issue?.title || comment.discussion?.title || '未匹配 Issue';
  const issueMeta = comment.issue?.id || comment.discussion?.title || '';
  return `
    <article class="comment-card">
      <div class="item-head">
        <div class="item-main">
          <div class="comment-author-row">
            ${author.avatarUrl ? `<img class="comment-avatar" src="${escapeHtml(author.avatarUrl)}" alt="" loading="lazy" />` : ''}
            <div>
              <h3>${escapeHtml(author.login || 'unknown')}</h3>
              <div class="item-meta">
                <span class="hint item-timestamp">${escapeHtml(formatCommentTime(comment.createdAt))}</span>
                ${comment.isReply ? `<span class="status-pill pendingRefresh">回复 ${escapeHtml(comment.parentAuthor || '')}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
        <div class="item-side">
          <span class="status-pill ${comment.viewerCanDelete ? 'published' : 'pendingRefresh'}">${comment.viewerCanDelete ? '可删除' : '只读'}</span>
        </div>
      </div>
      <div class="comment-issue-line">
        <strong>${escapeHtml(issueLabel)}</strong>
        ${issueMeta ? `<span>${escapeHtml(issueMeta)}</span>` : ''}
      </div>
      <p class="comment-body">${renderTextContent(body || '无正文')}</p>
      <div class="card-bottom-row">
        <div class="item-tags">
          <span class="tag-chip">#${escapeHtml(comment.discussion?.title || 'discussion')}</span>
          ${comment.isReply ? '<span class="tag-chip">#reply</span>' : '<span class="tag-chip">#comment</span>'}
        </div>
        <div class="card-tools">
          ${comment.url ? `<a class="ghost small" href="${escapeHtml(comment.url)}" target="_blank" rel="noreferrer noopener">打开</a>` : ''}
          <button class="ghost small icon-button compact-tool danger" type="button" data-action="comment-delete" data-comment-id="${escapeHtml(comment.id)}" ${comment.viewerCanDelete ? '' : 'disabled'} aria-label="删除评论">🗑</button>
        </div>
      </div>
    </article>
  `;
}

function renderCommentSidebar(ui, issueCounts) {
  return `
    <section class="card side-card">
      <input id="commentsSearchInput" class="search-input" type="text" placeholder="搜索评论" value="${escapeHtml(ui.search || '')}" />
      <div class="tag-sidebar-list">
        <button class="tag-chip sidebar-tag-chip ${ui.issueFilter === 'all' ? 'active' : ''}" data-action="comment-filter-issue" data-issue-id="all">全部 · ${(ui.comments || []).length}</button>
        ${issueCounts.length ? issueCounts.map((item) => `
          <button class="tag-chip sidebar-tag-chip ${ui.issueFilter === item.key ? 'active' : ''}" data-action="comment-filter-issue" data-issue-id="${escapeHtml(item.key)}">${escapeHtml(item.label)} · ${item.count}</button>
        `).join('') : '<p class="hint">还没有可筛选的评论。</p>'}
      </div>
    </section>
  `;
}

export function createCommentsModule({ state, elements, renderModeNavigation, requestJson, showToast }) {
  function commentsUi() {
    return state.ui.comments;
  }

  async function refreshComments({ silent = false } = {}) {
    const ui = commentsUi();
    ui.loading = true;
    ui.error = '';
    if (!silent && state.mode === 'comments') {
      renderWorkspace();
    }
    try {
      const result = await requestJson('/api/comments');
      ui.status = result.status || null;
      ui.comments = result.comments || [];
      ui.discussions = result.discussions || [];
      ui.warnings = result.warnings || [];
      ui.lastLoadedAt = new Date().toISOString();
      ui.loaded = true;
    } catch (error) {
      ui.error = error.message || '评论加载失败。';
      ui.loaded = true;
    } finally {
      ui.loading = false;
      if (state.mode === 'comments') {
        renderWorkspace();
      }
    }
  }

  async function deleteComment(commentId) {
    const ui = commentsUi();
    const comment = ui.comments.find((item) => item.id === commentId);
    if (!comment) {
      return;
    }
    const author = comment.author?.login || 'unknown';
    const text = (comment.bodyText || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const confirmed = window.confirm(`确定删除 ${author} 的这条评论吗？\n\n${text}`);
    if (!confirmed) {
      return;
    }
    await requestJson(`/api/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' });
    await refreshComments({ silent: true });
    showToast('评论已删除');
  }

  function setIssueFilter(issueId = 'all') {
    const ui = commentsUi();
    ui.issueFilter = issueId || 'all';
    ui.page = 1;
    renderWorkspace();
  }

  function setSearch(search = '') {
    const ui = commentsUi();
    ui.search = search;
    ui.page = 1;
  }

  function renderWorkspace() {
    renderModeNavigation();
    const ui = commentsUi();
    const status = ui.status || {};
    const filteredComments = getFilteredComments(ui);
    const issueCounts = getCommentIssueCounts(ui);

    elements.modeSubtitle.textContent = '';
    elements.modePrimary.innerHTML = `
      <section class="card comments-control-card section-card">
        <div class="section-head">
          <div>
            <h2>评论管理</h2>
            <p class="hint">集中查看 Giscus 写入 GitHub Discussions 的评论，并在本地 CMS 中删除不需要的评论。</p>
          </div>
          <button type="button" data-action="comments-refresh">${ui.loading ? '刷新中' : '刷新'}</button>
        </div>
        <div class="comment-status-grid">
          <div><span class="hint">仓库</span><strong>${escapeHtml(status.repo || 'onovich/GameLetter')}</strong></div>
          <div><span class="hint">分类</span><strong>${escapeHtml(status.category || 'Announcements')}</strong></div>
          <div><span class="hint">Token</span><strong>${status.configured ? '已配置' : '未配置'}</strong></div>
          <div><span class="hint">已加载</span><strong>${ui.loaded ? filteredComments.length : 0} / ${(ui.comments || []).length}</strong></div>
        </div>
        ${!status.configured ? '<div class="comment-notice">需要在启动 CMS 前设置 <code>GITHUB_DISCUSSIONS_TOKEN</code> 或 <code>GITHUB_TOKEN</code>，并授予该仓库 Discussions 读写权限。</div>' : ''}
        ${ui.error ? `<div class="comment-notice error">${escapeHtml(ui.error)}</div>` : ''}
        ${(ui.warnings || []).length ? `<div class="comment-notice">${ui.warnings.map(escapeHtml).join('<br />')}</div>` : ''}
      </section>
    `;

    elements.modeSecondary.innerHTML = `
      <section class="card section-card">
        <div class="comments-list">
          ${ui.loading ? '<div class="empty-card"><h3>正在加载评论</h3><p class="hint">正在从 GitHub Discussions 同步评论。</p></div>' : ''}
          ${!ui.loading && filteredComments.length ? filteredComments.map(renderCommentCard).join('') : ''}
          ${!ui.loading && !filteredComments.length ? '<div class="empty-card"><h3>暂无评论</h3><p class="hint">如果刚刚开启 Giscus，可以先在线上评论区发一条测试评论，然后点击刷新。</p></div>' : ''}
        </div>
      </section>
    `;
    elements.modeSide.innerHTML = renderCommentSidebar(ui, issueCounts);

    if (!ui.loaded && !ui.loading) {
      refreshComments({ silent: true }).catch((error) => showToast(error.message, 'error'));
    }
  }

  return {
    deleteComment,
    refreshComments,
    renderWorkspace,
    setIssueFilter,
    setSearch
  };
}
