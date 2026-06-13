import { useEffect, useState } from 'react';
import { defaultVisibility } from '../../shared/content-rules.js';

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
  return {
    ...entry,
    kind,
    dateLabel: entry.date || toDateLabel(entry.publishedAt),
    visibility: {
      ...defaultVisibility(kind),
      ...(entry.visibility || {})
    }
  };
}

export function useNewsletterData() {
  const [data, setData] = useState({ site: null, features: {}, capsules: [], issues: [], flows: [], articles: [], columns: [], toys: [] });
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
        const toys = payload.toys || [];
        if (!cancelled) {
          setData({
            site: payload.site,
            features: payload.features || {},
            capsules: (payload.capsules || []).map((entry) => normalizeEntry(entry, 'capsule')),
            issues: (payload.issues || []).map((entry) => normalizeEntry(entry, 'issue')),
            flows: (payload.flows || []).map((entry) => normalizeEntry(entry, 'flow')),
            articles: (payload.articles || []).map((entry) => normalizeEntry(entry, 'article')),
            columns: payload.columns || [],
            toys: toys.map((entry) => normalizeEntry(entry, 'toy'))
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
