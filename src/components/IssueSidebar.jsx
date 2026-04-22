import { ChevronRight } from 'lucide-react';

export function IssueSidebar({ issues, selectedId, onSelect }) {
  return (
    <aside className="sidebar-panel">
      <div className="sidebar-sticky">
        <div className="section-title">历史简讯</div>
        <div className="issue-list">
          {issues.map((issue) => {
            const active = issue.id === selectedId;
            return (
              <button
                key={issue.id}
                type="button"
                className={`issue-button ${active ? 'active' : ''}`}
                onClick={() => onSelect(issue.id)}
              >
                <div>
                  <div className="issue-date">{issue.date}</div>
                  <div className="issue-title">{issue.title}</div>
                </div>
                <ChevronRight size={16} className="issue-arrow" />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
