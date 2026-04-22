import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { ContentSidebar } from './components/ContentSidebar';
import { CapsuleCard } from './components/CapsuleCard';
import { IssueComposer } from './components/IssueComposer';
import { CommentSection } from './components/CommentSection';
import { Footer } from './components/Footer';
import { useNewsletterData } from './hooks/useNewsletterData';

const containerMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.35 }
};

function parseHashRoute(hash) {
  const normalized = hash.replace(/^#/, '');
  const parts = normalized.split('/').filter(Boolean);

  if (parts[0] === 'issues' && parts[1]) {
    return { kind: 'issue', slug: decodeURIComponent(parts[1]) };
  }

  if (parts[0] === 'capsules' && parts[1]) {
    return { kind: 'capsule', slug: decodeURIComponent(parts[1]) };
  }

  return { kind: 'home', slug: '' };
}

function buildHash(kind, slug) {
  return `/${kind === 'issue' ? 'issues' : 'capsules'}/${encodeURIComponent(slug)}`;
}

function Lightbox({ image, onClose }) {
  useEffect(() => {
    if (!image) {
      return undefined;
    }

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [image, onClose]);

  return (
    <AnimatePresence>
      {image ? (
        <motion.div
          className="lightbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.figure
            className="lightbox-figure"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="lightbox-close" onClick={onClose} aria-label="关闭大图预览">
              ×
            </button>
            <img src={image.url} alt={image.caption || 'Preview'} />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </motion.figure>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function App() {
  const { site, features, capsules, issues, loading, error } = useNewsletterData();
  const [search, setSearch] = useState('');
  const [searchScope, setSearchScope] = useState('all');
  const [route, setRoute] = useState(() => parseHashRoute(window.location.hash));
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    const handleHashChange = () => setRoute(parseHashRoute(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!features?.searchScopes?.length) {
      return;
    }

    if (!features.searchScopes.includes(searchScope)) {
      setSearchScope(features.searchScopes[0]);
    }
  }, [features, searchScope]);

  const sortedIssues = useMemo(
    () => [...issues].sort((left, right) => new Date(right.publishedAt || right.id) - new Date(left.publishedAt || left.id)),
    [issues]
  );

  const feedIssues = useMemo(
    () => sortedIssues.filter((issue) => issue.visibility.homepage !== false),
    [sortedIssues]
  );

  const capsulesById = useMemo(() => new Map(capsules.map((capsule) => [capsule.id, capsule])), [capsules]);
  const issuesBySlug = useMemo(() => new Map(issues.map((issue) => [issue.slug, issue])), [issues]);
  const capsulesBySlug = useMemo(() => new Map(capsules.map((capsule) => [capsule.slug, capsule])), [capsules]);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return [];
    }

    const includes = (entry) => {
      const text = [entry.title, entry.summary, ...(entry.tags || [])].join(' ').toLowerCase();
      return text.includes(query);
    };

    const results = [];

    if (searchScope === 'all' || searchScope === 'issues') {
      sortedIssues
        .filter((entry) => entry.visibility.search !== false && includes(entry))
        .forEach((entry) => results.push(entry));
    }

    if (searchScope === 'all' || searchScope === 'capsules') {
      capsules
        .filter((entry) => entry.visibility.search !== false && includes(entry))
        .forEach((entry) => results.push(entry));
    }

    return results.sort((left, right) => new Date(right.publishedAt || right.id) - new Date(left.publishedAt || left.id));
  }, [capsules, search, searchScope, sortedIssues]);

  const openIssue = (slug) => {
    window.location.hash = buildHash('issue', slug);
  };

  const openCapsule = (slug) => {
    window.location.hash = buildHash('capsule', slug);
  };

  const currentIssue = route.kind === 'issue' ? issuesBySlug.get(route.slug) : null;
  const currentCapsule = route.kind === 'capsule' ? capsulesBySlug.get(route.slug) : null;
  const fallbackIssue = route.kind === 'home' ? feedIssues[0] : null;
  const displayedIssue = currentIssue || fallbackIssue;
  const activeKey = currentCapsule
    ? `capsule:${currentCapsule.id}`
    : displayedIssue
      ? `issue:${displayedIssue.id}`
      : '';

  useEffect(() => {
    const activeTitle = currentCapsule?.title || displayedIssue?.title || site?.title || 'GameLetter';
    document.title = `${activeTitle} · ${site?.title || 'GameLetter'}`;
  }, [currentCapsule, displayedIssue, site]);

  const handleShare = async () => {
    const activeTitle = currentCapsule?.title || displayedIssue?.title || site?.title || 'GameLetter';
    const activeSummary = currentCapsule?.summary || displayedIssue?.summary || site?.description || '';
    const shareData = {
      title: activeTitle,
      text: activeSummary,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(shareData.url);
      window.alert('链接已复制到剪贴板');
    } catch (shareError) {
      console.error(shareError);
    }
  };

  const relatedIssues = currentCapsule
    ? sortedIssues.filter((issue) => issue.blocks.some((block) => block.type === 'capsule-ref' && block.capsuleId === currentCapsule.id))
    : [];

  return (
    <div className="app-shell">
      <Header
        site={site}
        searchValue={search}
        searchScope={searchScope}
        onSearchChange={setSearch}
        onSearchScopeChange={setSearchScope}
        onShare={handleShare}
      />

      <main className="layout-grid">
        <ContentSidebar
          feedIssues={feedIssues}
          searchResults={searchResults}
          activeKey={activeKey}
          onOpenIssue={openIssue}
          onOpenCapsule={openCapsule}
          isSearching={Boolean(search.trim())}
          searchScope={searchScope}
        />

        <section className="content-panel">
          {loading ? <div className="state-card">正在加载内容结构…</div> : null}
          {error ? <div className="state-card error">{error}</div> : null}

          {!loading && !error && !currentCapsule && !displayedIssue ? (
            <div className="state-card">当前没有可展示的 Issue 或 Capsule。</div>
          ) : null}

          {!loading && !error && currentCapsule ? (
            <AnimatePresence mode="wait">
              <motion.article key={`capsule-${currentCapsule.id}`} {...containerMotion} className="issue-detail">
                <div className="tag-row">
                  <span className="entry-kind-badge capsule">Capsule</span>
                  {currentCapsule.tags?.map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>

                <header className="issue-header">
                  <p className="issue-date-large">{currentCapsule.dateLabel}</p>
                  <h2>{currentCapsule.title}</h2>
                  <p>{currentCapsule.summary}</p>
                </header>

                <CapsuleCard capsule={currentCapsule} onImageClick={setLightboxImage} />

                {relatedIssues.length > 0 ? (
                  <section className="related-issues-block">
                    <div className="section-title big">收录于这些 Issue</div>
                    <div className="related-issues-list">
                      {relatedIssues.map((issue) => (
                        <button key={issue.id} type="button" className="related-issue-button" onClick={() => openIssue(issue.slug)}>
                          <span>{issue.title}</span>
                          <small>{issue.dateLabel}</small>
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                <CommentSection issue={{ id: currentCapsule.id }} />
              </motion.article>
            </AnimatePresence>
          ) : null}

          {!loading && !error && !currentCapsule && displayedIssue ? (
            <AnimatePresence mode="wait">
              <motion.article key={`issue-${displayedIssue.id}`} {...containerMotion} className="issue-detail">
                <div className="tag-row">
                  <span className="entry-kind-badge issue">Issue</span>
                  {displayedIssue.tags?.map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>

                <header className="issue-header">
                  <p className="issue-date-large">{displayedIssue.dateLabel}</p>
                  <h2>{displayedIssue.title}</h2>
                  <p>{displayedIssue.summary}</p>
                </header>

                <IssueComposer
                  issue={displayedIssue}
                  capsulesById={capsulesById}
                  onOpenCapsule={openCapsule}
                  onImageClick={setLightboxImage}
                />

                <CommentSection issue={{ id: displayedIssue.id }} />
              </motion.article>
            </AnimatePresence>
          ) : null}
        </section>
      </main>

      <Footer />
      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
