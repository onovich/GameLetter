import { Github, Rss, Share2 } from 'lucide-react';

export function Header({ site, onShare }) {
  const inCmsPreview = typeof window !== 'undefined' && window.location.pathname.startsWith('/browse');
  const baseUrl = import.meta.env.BASE_URL || '/';
  const rssHref = site?.rssPath
    ? new URL(String(site.rssPath).replace(/^\//, ''), window.location.origin + baseUrl).toString()
    : `${baseUrl}rss.xml`;
  const editorHref = baseUrl;

  return (
    <header className="app-header">
      <div className="app-header-copy">
        <p className="eyebrow">Prompt CMS</p>
        <h1>{site?.title || '浏览模式'}</h1>
      </div>

      <nav className="app-header-actions">
        {inCmsPreview ? (
          <a href={editorHref} className="ghost settings-toggle editor-back-link">
            编辑模式
          </a>
        ) : null}
        <a href={rssHref} target="_blank" rel="noreferrer" className="ghost">
          <Rss size={16} />
          <span>RSS</span>
        </a>
        <button type="button" className="ghost" onClick={onShare}>
          <Share2 size={16} />
          <span>分享</span>
        </button>
        <a href={site?.repoUrl || 'https://github.com/onovich/GameLetter'} target="_blank" rel="noreferrer" className="ghost">
          <Github size={16} />
          <span>GitHub</span>
        </a>
      </nav>
    </header>
  );
}
