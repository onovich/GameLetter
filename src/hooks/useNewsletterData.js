import { useEffect, useState } from 'react';

export function useNewsletterData() {
  const [data, setData] = useState({ site: null, issues: [] });
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
          setData(payload);
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
