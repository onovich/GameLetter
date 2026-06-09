import { useEffect, useState } from 'react';

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

function toDateLabel(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}

function normalizeEntry(entry, kind) {
  const isPublishedSurface = kind === 'issue' || kind === 'article';

  return {
    ...entry,
    kind,
    dateLabel: entry.date || toDateLabel(entry.publishedAt),
    visibility: {
      direct: true,
      search: true,
      homepage: isPublishedSurface,
      feed: isPublishedSurface,
      rss: isPublishedSurface,
      ...(entry.visibility || {})
    }
  };
}

export function useNewsletterData() {
  const [data, setData] = useState({ site: null, features: {}, capsules: [], issues: [], flows: [], articles: [], columns: [], canvases: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.BASE_URL}data.json`);
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.status}`);
        }
        const payload = await response.json();
        if (!cancelled) {
          setData({
            site: payload.site,
            features: payload.features || {},
            capsules: (payload.capsules || []).map((entry) => normalizeEntry(entry, 'capsule')),
            issues: (payload.issues || []).map((entry) => normalizeEntry(entry, 'issue')),
            flows: (payload.flows || []).map((entry) => normalizeEntry(entry, 'flow')),
            articles: (payload.articles || []).map((entry) => normalizeEntry(entry, 'article')),
            columns: payload.columns || [],
            canvases: (payload.canvases || []).map((entry) => normalizeEntry(entry, 'canvas'))
          });
          setError('');
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'Failed to load newsletter data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, loading, error };
}
