import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const dataPath = path.join(rootDir, 'public', 'data.json');
const rssPath = path.join(rootDir, 'public', 'rss.xml');
const fallbackSiteUrl = 'https://onovich.github.io/GameLetter/';

const escapeXml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const main = async () => {
  const raw = await fs.readFile(dataPath, 'utf8');
  const data = JSON.parse(raw);
  const { site, issues = [], articles = [] } = data;
  const siteUrl = site?.baseUrl || fallbackSiteUrl;

  const entries = [
    ...issues.map((entry) => ({ ...entry, route: 'issues' })),
    ...articles.map((entry) => ({ ...entry, route: 'articles' }))
  ];

  const items = entries
    .filter((entry) => entry.visibility?.rss !== false)
    .sort((left, right) => new Date(right.publishedAt || right.id) - new Date(left.publishedAt || left.id))
    .map((entry) => {
      const entryUrl = `${siteUrl}#/${entry.route}/${entry.slug || entry.id}`;
      return `
    <item>
      <title>${escapeXml(entry.title)}</title>
      <description>${escapeXml(entry.summary)}</description>
      <link>${entryUrl}</link>
      <guid>${entryUrl}</guid>
      <pubDate>${new Date(entry.publishedAt || entry.id).toUTCString()}</pubDate>
    </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site?.title || 'GameLetter')}</title>
    <description>${escapeXml(site?.description || '')}</description>
    <link>${siteUrl}</link>
    <language>zh-cn</language>${items}
  </channel>
</rss>
`;

  await fs.writeFile(rssPath, rss, 'utf8');
  console.log(`RSS generated at ${rssPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
