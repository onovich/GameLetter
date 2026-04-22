import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { IssueSidebar } from './components/IssueSidebar';
import { NewsItem } from './components/NewsItem';
import { CommentSection } from './components/CommentSection';
import { Footer } from './components/Footer';
import { useNewsletterData } from './hooks/useNewsletterData';

const containerMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.35 }
};

export default function App() {
  const { site, issues, loading, error } = useNewsletterData();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const filteredIssues = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return issues;
    }

    return issues.filter((issue) => {
      const text = [issue.title, issue.summary, ...(issue.tags || [])]
        .join(' ')
        .toLowerCase();
      return text.includes(keyword);
    });
  }, [issues, search]);

  useEffect(() => {
    if (!selectedId && issues.length > 0) {
      setSelectedId(issues[0].id);
      return;
    }

    if (selectedId && !filteredIssues.some((issue) => issue.id === selectedId)) {
      setSelectedId(filteredIssues[0]?.id || '');
    }
  }, [issues, filteredIssues, selectedId]);

  const selectedIssue = filteredIssues.find((issue) => issue.id === selectedId) || filteredIssues[0];

  const handleShare = async () => {
    const shareData = {
      title: selectedIssue?.title || site?.title || 'GameLetter',
      text: selectedIssue?.summary || site?.description || '',
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

  return (
    <div className="app-shell">
      <Header
        site={site}
        searchValue={search}
        onSearchChange={setSearch}
        onShare={handleShare}
      />

      <main className="layout-grid">
        <IssueSidebar issues={filteredIssues} selectedId={selectedIssue?.id} onSelect={setSelectedId} />

        <section className="content-panel">
          {loading ? <div className="state-card">正在加载简报内容…</div> : null}
          {error ? <div className="state-card error">{error}</div> : null}
          {!loading && !error && !selectedIssue ? <div className="state-card">没有匹配的简报结果。</div> : null}

          {!loading && !error && selectedIssue ? (
            <AnimatePresence mode="wait">
              <motion.article key={selectedIssue.id} {...containerMotion} className="issue-detail">
                <div className="tag-row">
                  {selectedIssue.tags?.map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>

                <header className="issue-header">
                  <p className="issue-date-large">{selectedIssue.date}</p>
                  <h2>{selectedIssue.title}</h2>
                  <p>{selectedIssue.summary}</p>
                </header>

                <div className="news-flow">
                  {selectedIssue.items.map((item, index) => (
                    <NewsItem key={`${selectedIssue.id}-${index}`} item={item} />
                  ))}
                </div>

                <CommentSection issue={selectedIssue} />
              </motion.article>
            </AnimatePresence>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}
