import { ChevronRight, Compass, FileText, Layers3 } from 'lucide-react';

function EntryBadge({ kind }) {
  return (
    <span className={`entry-kind-badge ${kind === 'capsule' ? 'capsule' : 'issue'}`}>
      {kind === 'capsule' ? 'Capsule' : 'Issue'}
    </span>
  );
}

export function ContentSidebar({
  feedIssues,
  searchResults,
  activeKey,
  onOpenIssue,
  onOpenCapsule,
  isSearching,
  searchScope
}) {
  const hasResults = searchResults.length > 0;

  return (
    <aside className="sidebar-panel">
      <div className="sidebar-sticky">
        <div className="section-title">{isSearching ? '搜索结果' : 'Issue Feed'}</div>

        {isSearching ? (
          hasResults ? (
            <div className="issue-list">
              {searchResults.map((entry) => {
                const active = activeKey === `${entry.kind}:${entry.id}`;
                const open = () => {
                  if (entry.kind === 'capsule') {
                    onOpenCapsule(entry.slug);
                    return;
                  }
                  onOpenIssue(entry.slug);
                };

                return (
                  <button
                    key={`${entry.kind}-${entry.id}`}
                    type="button"
                    className={`issue-button search-entry ${active ? 'active' : ''}`}
                    onClick={open}
                  >
                    <div className="issue-button-main">
                      <div className="issue-button-meta-row">
                        <EntryBadge kind={entry.kind} />
                        <div className="issue-date">{entry.dateLabel}</div>
                      </div>
                      <div className="issue-title">{entry.title}</div>
                      <div className="entry-summary">{entry.summary}</div>
                    </div>
                    <ChevronRight size={16} className="issue-arrow" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="sidebar-card empty-state-card">
              <Layers3 size={18} />
              <p>当前搜索范围是 {searchScope}，没有命中的 Issue 或 Capsule。</p>
            </div>
          )
        ) : (
          <div className="issue-list">
            {feedIssues.map((issue) => {
              const active = activeKey === `issue:${issue.id}`;
              return (
                <button
                  key={issue.id}
                  type="button"
                  className={`issue-button ${active ? 'active' : ''}`}
                  onClick={() => onOpenIssue(issue.slug)}
                >
                  <div className="issue-button-main">
                    <div className="issue-button-meta-row">
                      <EntryBadge kind="issue" />
                      <div className="issue-date">{issue.dateLabel}</div>
                    </div>
                    <div className="issue-title">{issue.title}</div>
                  </div>
                  <ChevronRight size={16} className="issue-arrow" />
                </button>
              );
            })}
          </div>
        )}

        <div className="sidebar-card sidebar-hint-card">
          <Compass size={18} />
          <h4>Capsule / Issue</h4>
          <p>首页流只展示 Issue。Capsule 通过搜索或直链访问，并可被嵌入到任意 Issue 中。</p>
        </div>

        <div className="sidebar-card sidebar-hint-card subtle">
          <FileText size={18} />
          <h4>发布建议</h4>
          <p>沉淀单条内容先发 Capsule；对外发布完整一期内容时，再编排成 Issue。</p>
        </div>
      </div>
    </aside>
  );
}
