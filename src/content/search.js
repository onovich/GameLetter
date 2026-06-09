import { getArticleBlocks, getCapsuleBlocks, getIssueBlocks } from './blocks';

export function getBlockSearchText(block) {
  if (block.type === 'list') {
    return (block.items || []).join(' ');
  }
  if (block.type === 'code') {
    return block.content || block.text || block.code || '';
  }
  return [block.text, block.content, block.caption, block.title, block.url, block.entry]
    .filter(Boolean)
    .join(' ');
}

export function getIssueSearchText(issue, capsulesById, canvasesById) {
  const issueBlocks = getIssueBlocks(issue, { canvasesById });
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
        return capsule ? getCapsuleSearchText(capsule, canvasesById) : '';
      }
      return getBlockSearchText(block);
    })
  ].join(' ').toLowerCase();
}

export function getCapsuleSearchText(capsule, canvasesById) {
  const blockText = getCapsuleBlocks(capsule, { canvasesById })
    .map((block) => getBlockSearchText(block))
    .join(' ');

  return [capsule.title, capsule.summary, ...(capsule.tags || []), blockText].join(' ').toLowerCase();
}

export function getPlainEntrySearchText(entry) {
  return [entry.title, entry.summary, entry.body, entry.content, ...(entry.tags || [])].join(' ').toLowerCase();
}

export function getArticleSearchText(article, capsulesById, columnsById, canvasesById) {
  const blockText = getArticleBlocks(article, { canvasesById }).map((block) => {
    if (block.type === 'capsule-ref' || block.type === 'canvas-ref') {
      const capsule = capsulesById.get(block.capsuleId);
      return capsule ? getCapsuleSearchText(capsule, canvasesById) : '';
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
