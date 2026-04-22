import { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';

const giscusConfig = {
  repo: import.meta.env.VITE_GISCUS_REPO,
  repoId: import.meta.env.VITE_GISCUS_REPO_ID,
  category: import.meta.env.VITE_GISCUS_CATEGORY,
  categoryId: import.meta.env.VITE_GISCUS_CATEGORY_ID
};

function hasGiscusConfig() {
  return Object.values(giscusConfig).every(Boolean);
}

export function CommentSection({ issue }) {
  const containerRef = useRef(null);
  const isConfigured = hasGiscusConfig();

  useEffect(() => {
    if (!issue || !isConfigured || !containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', giscusConfig.repo);
    script.setAttribute('data-repo-id', giscusConfig.repoId);
    script.setAttribute('data-category', giscusConfig.category);
    script.setAttribute('data-category-id', giscusConfig.categoryId);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', issue.id);
    script.setAttribute('data-strict', '1');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'light');
    script.setAttribute('data-lang', 'zh-CN');

    containerRef.current.appendChild(script);
  }, [issue, isConfigured]);

  return (
    <section className="comment-section">
      <div className="comment-title">
        <MessageCircle size={18} />
        <h3>读者交流</h3>
      </div>
      {isConfigured ? (
        <div ref={containerRef} />
      ) : (
        <div className="comment-placeholder">
          <strong>Giscus 尚未配置</strong>
          <p>请先在 GitHub 中启用 Discussions，再按 `docs/github-setup.md` 配置 `VITE_GISCUS_*` 后重新部署。</p>
        </div>
      )}
    </section>
  );
}
