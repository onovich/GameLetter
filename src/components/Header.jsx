import { Github, Rss, Search, Share2 } from 'lucide-react';

export function Header({ site, searchValue, onSearchChange, onShare }) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark">G</div>
        <div>
          <p className="eyebrow">Daily briefing</p>
          <h1>{site?.title || 'GameLetter'}</h1>
        </div>
      </div>

      <label className="search-box" aria-label="搜索简报">
        <Search size={16} />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜索标题、摘要、标签"
        />
      </label>

      <nav className="topbar-actions">
        <a href={site?.rssPath || '/rss.xml'} target="_blank" rel="noreferrer">
          <Rss size={18} />
          <span>RSS</span>
        </a>
        <button type="button" onClick={onShare}>
          <Share2 size={18} />
          <span>分享</span>
        </button>
        <a href={site?.repoUrl || 'https://github.com/onovich/GameLetter'} target="_blank" rel="noreferrer">
          <Github size={18} />
          <span>GitHub</span>
        </a>
      </nav>
    </header>
  );
}
