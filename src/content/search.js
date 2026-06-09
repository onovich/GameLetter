import { getArticleBlocks, getCapsuleBlocks, getIssueBlocks } from './blocks';

export function getBlockSearchText(block) {
  return [block.text, block.content, block.caption, block.title, block.url, block.entry]
    .filter(Boolean)
    .join(' ');
}

export function getIssueSearchText(issue, capsulesById) {
  const issueBlocks = getIssueBlocks(issue);
  return [
    issue.title,
    issue.summary,
    ...(issue.tags || []),
    ...issueBlocks.map((block) => {
      if (block.type === 'note') {
        return block.content || '';
      }
      if (block.type === 'capsule-ref') {
        const capsule = capsulesById.get(block.capsuleId);
        return capsule ? `${capsule.summary || ''} ${(capsule.tags || []).join(' ')}` : '';
      }
      return getBlockSearchText(block);
    })
  ].join(' ').toLowerCase();
}

export function getCapsuleSearchText(capsule) {
  const blockText = getCapsuleBlocks(capsule)
    .map((block) => getBlockSearchText(block))
    .join(' ');

  return [capsule.title, capsule.summary, ...(capsule.tags || []), blockText].join(' ').toLowerCase();
}

export function getPlainEntrySearchText(entry) {
  return [entry.title, entry.summary, entry.body, entry.content, ...(entry.tags || [])].join(' ').toLowerCase();
}

export function getArticleSearchText(article, capsulesById, columnsById) {
  const blockText = getArticleBlocks(article).map((block) => {
    if (block.type === 'capsule-ref' || block.type === 'canvas-ref') {
      const capsule = capsulesById.get(block.capsuleId);
      return capsule ? getCapsuleSearchText(capsule) : '';
    }
    return getBlockSearchText(block);
  }).join(' ');
  return [getPlainEntrySearchText(article), blockText, columnsById.get(article.columnId)?.title || ''].join(' ').toLowerCase();
}

export function getTagCounts(items = []) {
  const counts = new Map();
  items.forEach((item) => {
    (item.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });
  return [...counts.entries()].sort((left, right) => right[1] - left[1]);
}
