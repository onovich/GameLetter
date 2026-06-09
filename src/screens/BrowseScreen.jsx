import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { Lightbox } from '../components/Lightbox';
import { BrowseArticleCard } from '../components/cards/BrowseArticleCard';
import { BrowseCapsuleCard } from '../components/cards/BrowseCapsuleCard';
import { BrowseFlowCard } from '../components/cards/BrowseFlowCard';
import { BrowseIssueCard } from '../components/cards/BrowseIssueCard';
import { modeMeta, modeOrder, buildHash, getCurrentRoute, normalizeMode, parseHashRoute } from '../content/modes';
import { getArticleSearchText, getCapsuleSearchText, getIssueSearchText, getPlainEntrySearchText, getTagCounts } from '../content/search';
import { applySeoState, buildSeoState } from '../content/seo';
import { modeContentMotion } from '../view/animations';

function sortPublishedEntries(entries = []) {
  return [...entries]
    .filter((item) => item.visibility?.direct !== false)
    .sort((left, right) => new Date(right.publishedAt || right.id) - new Date(left.publishedAt || left.id));
}

function createInitialMode() {
  return normalizeMode(getCurrentRoute().kind);
}

export function BrowseScreen({ data }) {
  const { site, capsules, issues, flows, articles, columns, canvases, loading, error } = data;
  const [route, setRoute] = useState(() => getCurrentRoute());
  const [mode, setMode] = useState(createInitialMode);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [searchByMode, setSearchByMode] = useState({ capsule: '', issue: '', flow: '', article: '' });
  const [activeTagsByMode, setActiveTagsByMode] = useState({ capsule: [], issue: [], flow: [], article: [] });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleHashChange = () => setRoute(parseHashRoute(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (modeMeta[route.kind]) {
      setMode(route.kind);
    }
  }, [route.kind]);

  const capsulesById = useMemo(() => new Map(capsules.map((capsule) => [capsule.id, capsule])), [capsules]);
  const columnsById = useMemo(() => new Map((columns || []).map((column) => [column.id, column])), [columns]);
  const canvasesById = useMemo(() => new Map((canvases || []).map((canvas) => [canvas.id, canvas])), [canvases]);

  const sortedIssues = useMemo(() => sortPublishedEntries(issues), [issues]);
  const sortedCapsules = useMemo(() => sortPublishedEntries(capsules), [capsules]);
  const sortedFlows = useMemo(() => sortPublishedEntries(flows), [flows]);
  const sortedArticles = useMemo(() => sortPublishedEntries(articles), [articles]);

  const filterByTags = (item, currentMode) => {
    const selectedTags = activeTagsByMode[currentMode] || [];
    if (!selectedTags.length) {
      return true;
    }
    return (item.tags || []).some((tag) => selectedTags.some((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase()));
  };

  const filteredIssues = useMemo(() => {
    const query = searchByMode.issue.trim().toLowerCase();
    return sortedIssues.filter((issue) => {
      if (!filterByTags(issue, 'issue')) {
        return false;
      }
      if (!query) {
        return true;
      }
      return getIssueSearchText(issue, capsulesById, canvasesById).includes(query);
    });
  }, [sortedIssues, searchByMode.issue, activeTagsByMode.issue, capsulesById, canvasesById]);

  const filteredCapsules = useMemo(() => {
    const query = searchByMode.capsule.trim().toLowerCase();
    return sortedCapsules.filter((capsule) => {
      if (!filterByTags(capsule, 'capsule')) {
        return false;
      }
      if (!query) {
        return true;
      }
      return getCapsuleSearchText(capsule, canvasesById).includes(query);
    });
  }, [sortedCapsules, searchByMode.capsule, activeTagsByMode.capsule, canvasesById]);

  const filteredFlows = useMemo(() => {
    const query = searchByMode.flow.trim().toLowerCase();
    return sortedFlows.filter((flow) => {
      if (!filterByTags(flow, 'flow')) {
        return false;
      }
      return query ? getPlainEntrySearchText(flow).includes(query) : true;
    });
  }, [sortedFlows, searchByMode.flow, activeTagsByMode.flow]);

  const filteredArticles = useMemo(() => {
    const query = searchByMode.article.trim().toLowerCase();
    return sortedArticles.filter((article) => {
      if (!filterByTags(article, 'article')) {
        return false;
      }
      if (!query) {
        return true;
      }
      return getArticleSearchText(article, capsulesById, columnsById, canvasesById).includes(query);
    });
  }, [sortedArticles, searchByMode.article, activeTagsByMode.article, capsulesById, columnsById, canvasesById]);

  const activeIssue = mode === 'issue'
    ? filteredIssues.find((issue) => issue.slug === route.slug) || filteredIssues[0] || null
    : null;

  const activeCapsule = mode === 'capsule'
    ? filteredCapsules.find((capsule) => capsule.slug === route.slug) || filteredCapsules[0] || null
    : null;

  const activeFlow = mode === 'flow'
    ? filteredFlows.find((flow) => flow.slug === route.slug) || filteredFlows[0] || null
    : null;

  const activeArticle = mode === 'article'
    ? filteredArticles.find((article) => article.slug === route.slug) || filteredArticles[0] || null
    : null;

  const activeEntry = { issue: activeIssue, capsule: activeCapsule, flow: activeFlow, article: activeArticle }[mode] || null;

  const seoState = useMemo(() => buildSeoState({
    site: site || {},
    entry: activeEntry,
    mode,
    capsulesById,
    canvasesById
  }), [activeEntry, mode, site, capsulesById, canvasesById]);

  useEffect(() => {
    applySeoState(seoState);
  }, [seoState]);

  useEffect(() => {
    document.body.dataset.mode = mode;
    return () => {
      delete document.body.dataset.mode;
    };
  }, [mode]);

  const openEntry = (kind, slug) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.location.hash = buildHash(kind, slug);
  };

  const openIssue = (slug) => {
    openEntry('issue', slug);
  };

  const openCapsule = (slug) => {
    openEntry('capsule', slug);
  };

  const openFlow = (slug) => {
    openEntry('flow', slug);
  };

  const openArticle = (slug) => {
    openEntry('article', slug);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    const itemsByMode = {
      issue: filteredIssues.length ? filteredIssues : sortedIssues,
      capsule: filteredCapsules.length ? filteredCapsules : sortedCapsules,
      flow: filteredFlows.length ? filteredFlows : sortedFlows,
      article: filteredArticles.length ? filteredArticles : sortedArticles
    };
    const nextItems = itemsByMode[nextMode] || [];
    const next = nextItems.find((item) => item.slug === route.slug) || nextItems[0];
    if (next) {
      openEntry(nextMode, next.slug);
    }
  };

  const toggleTag = (currentMode, tag) => {
    setActiveTagsByMode((prev) => {
      const exists = prev[currentMode].some((item) => item.toLowerCase() === tag.toLowerCase());
      return {
        ...prev,
        [currentMode]: exists
          ? prev[currentMode].filter((item) => item.toLowerCase() !== tag.toLowerCase())
          : [tag, ...prev[currentMode].filter((item) => item.toLowerCase() !== tag.toLowerCase())]
      };
    });
  };

  const handleShare = async () => {
    const activeTitle = activeEntry?.title || site?.title || 'GameLetter';
    const activeSummary = activeEntry?.summary || site?.description || '';
    const shareData = { title: activeTitle, text: activeSummary, url: window.location.href };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        window.alert('链接已复制到剪贴板');
      }
    } catch (shareError) {
      console.error(shareError);
    }
  };

  const currentSearch = searchByMode[mode];
  const sortedItemsByMode = {
    issue: sortedIssues,
    capsule: sortedCapsules,
    flow: sortedFlows,
    article: sortedArticles
  };
  const filteredItemsByMode = {
    issue: filteredIssues,
    capsule: filteredCapsules,
    flow: filteredFlows,
    article: filteredArticles
  };
  const currentTagCounts = getTagCounts(sortedItemsByMode[mode] || []);
  const selectedTags = activeTagsByMode[mode];
  const displayedItems = filteredItemsByMode[mode] || [];

  return (
    <div className="app-shell">
      <Header site={site} onShare={handleShare} />

      <div className="workspace">
        <aside className="nav-column">
          <nav className={`mode-tabs ${mode}-active`} aria-label="浏览模式切换">
            <span className="mode-tab-indicator" aria-hidden="true" />
            {modeOrder.map((item) => (
              <button key={item} type="button" className={`mode-tab ${mode === item ? 'active' : ''}`} onClick={() => switchMode(item)}>
                {modeMeta[item].label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-column">
          {loading ? <div className="empty-card"><h3>正在加载内容</h3><p className="hint">稍等片刻，正在整理浏览模式数据。</p></div> : null}
          {error ? <div className="empty-card"><h3>加载失败</h3><p className="hint">{error}</p></div> : null}

          {!loading && !error ? (
            <AnimatePresence initial={false} mode="wait">
              <motion.div key={mode} {...modeContentMotion} className={modeMeta[mode].className}>
                {displayedItems.length ? displayedItems.map((item) => {
                  if (mode === 'capsule') {
                    return (
                      <BrowseCapsuleCard
                        key={item.id}
                        capsule={item}
                        onOpenCapsule={openCapsule}
                        onImageClick={setLightboxImage}
                        onToggleTag={(tag) => toggleTag('capsule', tag)}
                        activeTags={activeTagsByMode.capsule}
                        canvasesById={canvasesById}
                      />
                    );
                  }
                  if (mode === 'flow') {
                    return (
                      <BrowseFlowCard
                        key={item.id}
                        flow={item}
                        onOpenFlow={openFlow}
                        onToggleTag={(tag) => toggleTag('flow', tag)}
                        activeTags={activeTagsByMode.flow}
                      />
                    );
                  }
                  if (mode === 'article') {
                    return (
                      <BrowseArticleCard
                        key={item.id}
                        article={item}
                        active={activeArticle?.id === item.id}
                        columnTitle={columnsById.get(item.columnId)?.title || ''}
                        onOpenArticle={openArticle}
                        onOpenCapsule={openCapsule}
                        onImageClick={setLightboxImage}
                        onToggleTag={(tag) => toggleTag('article', tag)}
                        activeTags={activeTagsByMode.article}
                        capsulesById={capsulesById}
                        canvasesById={canvasesById}
                      />
                    );
                  }
                  return (
                    <BrowseIssueCard
                      key={item.id}
                      issue={item}
                      active={activeIssue?.id === item.id}
                      onOpenIssue={openIssue}
                      onOpenCapsule={openCapsule}
                      onImageClick={setLightboxImage}
                      onToggleTag={(tag) => toggleTag('issue', tag)}
                      activeTags={activeTagsByMode.issue}
                      capsulesById={capsulesById}
                      canvasesById={canvasesById}
                    />
                  );
                }) : <div className="empty-card"><h3>没有可展示内容</h3><p className="hint">试试清空搜索或标签筛选。</p></div>}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </main>

        <aside className="side-column">
          <section className="card side-card">
            <input
              className="search-input"
              type="text"
              value={currentSearch}
              onChange={(event) => setSearchByMode((prev) => ({ ...prev, [mode]: event.target.value }))}
              placeholder={`搜索 ${modeMeta[mode].label}`}
            />
            <div className={`filter-head ${selectedTags.length ? '' : 'filter-head-compact'}`}>
              {selectedTags.length ? (
                <button type="button" className="clear-filter-button" onClick={() => setActiveTagsByMode((prev) => ({ ...prev, [mode]: [] }))}>
                  清除
                </button>
              ) : null}
            </div>
            <div className="tag-sidebar-list">
              {currentTagCounts.length ? currentTagCounts.map(([tag, count]) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-chip sidebar-tag-chip ${selectedTags.some((item) => item.toLowerCase() === tag.toLowerCase()) ? 'active' : ''}`}
                  onClick={() => toggleTag(mode, tag)}
                >
                  #{tag} · {count}
                </button>
              )) : <p className="hint">还没有标签。</p>}
            </div>
          </section>
        </aside>
      </div>

      <Footer />
      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
