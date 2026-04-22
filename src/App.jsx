import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { CommentSection } from './components/CommentSection';
import { Footer } from './components/Footer';
import { useNewsletterData } from './hooks/useNewsletterData';

const cardMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32 }
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

function getCurrentRoute() {
  if (typeof window === 'undefined') {
    return { kind: 'home', slug: '' };
  }
  return parseHashRoute(window.location.hash);
}

function getBaseUrl() {
  return import.meta.env.BASE_URL || '/';
}

function buildHash(kind, slug) {
  return `/${kind === 'issue' ? 'issues' : 'capsules'}/${encodeURIComponent(slug)}`;
}

function applyPanguSpacing(value = '') {
  return String(value)
    .replace(/([\u2e80-\u9fff])([A-Za-z0-9]+)/g, '$1 $2')
    .replace(/([A-Za-z0-9]+)([\u2e80-\u9fff])/g, '$1 $2');
}

function renderText(value = '') {
  return applyPanguSpacing(value);
}

function normalizeLineEndings(value = '') {
  return String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function parseStructuredFields(lines = []) {
  const fields = {};
  lines.forEach((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      return;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) {
      fields[key] = value;
    }
  });
  return fields;
}

function createTextBlock(text = '') {
  return { type: 'text', text };
}

function createImageBlock(url = '', caption = '') {
  return { type: 'image', url, caption };
}

function createLinkBlock(text = '', url = '') {
  return { type: 'link', text, url };
}

function isLikelyImageUrl(url = '') {
  if (!url) {
    return false;
  }
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url)
    || /images\.unsplash\.com|cdn\.|image\.|imgur\.com|cloudinary\.com/i.test(url);
}

function isLikelyWebUrl(url = '') {
  return /^https?:\/\/\S+$/i.test(String(url || '').trim());
}

function parseChunkToCapsuleBlock(chunk = '') {
  const normalized = String(chunk || '').trim();
  if (!normalized) {
    return null;
  }

  const lines = normalized.split('\n').map((line) => line.trim());
  const marker = lines[0];
  const fields = parseStructuredFields(lines.slice(1));

  if (marker === '[图片]') {
    return createImageBlock(fields.url || '', fields.caption || '');
  }

  if (marker === '[链接]') {
    return createLinkBlock(fields.text || fields.title || fields.url || '', fields.url || '');
  }

  if (isLikelyImageUrl(normalized)) {
    return createImageBlock(normalized, '');
  }

  if (isLikelyWebUrl(normalized)) {
    return createLinkBlock(normalized, normalized);
  }

  return createTextBlock(normalized);
}

function parseCapsuleBodyToBlocks(body = '') {
  const normalizedBody = normalizeLineEndings(body);
  const blocks = normalizedBody
    .split(/\n{2,}/)
    .map((chunk) => parseChunkToCapsuleBlock(chunk))
    .filter(Boolean);
  return blocks.length ? blocks : [createTextBlock('')];
}

function normalizePublishedCapsuleBlock(block) {
  if (!block) {
    return null;
  }
  if (typeof block === 'string') {
    return parseChunkToCapsuleBlock(block);
  }

  const type = String(block.type || '').trim();
  if (type === 'image') {
    const imageUrl = String(block.url || block.image || block.src || '').trim();
    return imageUrl ? createImageBlock(imageUrl, block.caption || block.text || '') : null;
  }
  if (type === 'link') {
    const url = String(block.url || '').trim();
    const text = String(block.text || block.title || block.label || url).trim();
    return url || text ? createLinkBlock(text, url) : null;
  }
  if (type === 'text' || type === 'note' || type === 'thought') {
    return createTextBlock(block.text || block.content || '');
  }
  if (String(block.content || '').trim()) {
    return createTextBlock(block.content);
  }
  return null;
}

function parseChunkToIssueBlock(chunk = '') {
  const normalized = String(chunk || '').trim();
  if (!normalized) {
    return null;
  }

  const lines = normalized.split('\n').map((line) => line.trim());
  const marker = lines[0];
  const fields = parseStructuredFields(lines.slice(1));

  if (marker === '[引用 Capsule]') {
    const capsuleId = String(fields.capsuleId || '').trim();
    return capsuleId ? { type: 'capsule-ref', capsuleId, title: fields.title || capsuleId } : { type: 'note', content: normalized };
  }
  if (marker === '[链接]') {
    return createLinkBlock(fields.text || fields.title || fields.url || '', fields.url || '');
  }
  if (marker === '[图片]') {
    return createImageBlock(fields.url || '', fields.caption || '');
  }
  if (isLikelyImageUrl(normalized)) {
    return createImageBlock(normalized, '');
  }
  if (isLikelyWebUrl(normalized)) {
    return createLinkBlock(normalized, normalized);
  }
  return { type: 'note', content: normalized };
}

function parseIssueBodyToBlocks(body = '') {
  const normalizedBody = normalizeLineEndings(body);
  const blocks = normalizedBody
    .split(/\n{2,}/)
    .map((chunk) => parseChunkToIssueBlock(chunk))
    .filter(Boolean);
  return blocks.length ? blocks : [{ type: 'note', content: '' }];
}

function normalizePublishedIssueBlock(block) {
  if (!block) {
    return null;
  }
  if (typeof block === 'string') {
    return parseChunkToIssueBlock(block);
  }

  const type = String(block.type || '').trim();
  if (type === 'capsule-ref' || (type === 'capsule' && block.capsuleId)) {
    return { type: 'capsule-ref', capsuleId: block.capsuleId, title: block.title || block.capsuleId };
  }
  if (type === 'image') {
    const imageUrl = String(block.url || block.image || block.src || '').trim();
    return imageUrl ? createImageBlock(imageUrl, block.caption || block.text || '') : null;
  }
  if (type === 'link') {
    const url = String(block.url || '').trim();
    const text = String(block.text || block.title || block.label || url).trim();
    return url || text ? createLinkBlock(text, url) : null;
  }
  if (type === 'note' || type === 'text' || type === 'thought') {
    return { type: 'note', content: block.content || block.text || '' };
  }
  if (String(block.content || '').trim()) {
    return { type: 'note', content: block.content };
  }
  return null;
}

function capsuleNeedsCollapse(text = '') {
  return String(text || '').length > 240;
}

function capsulePreviewBlocks(blocks = []) {
  const preview = [];
  const firstMedia = blocks.find((block) => block.type === 'image' || block.type === 'link');
  const firstText = blocks.find((block) => block.type === 'text' && String(block.text || '').trim());

  if (firstMedia) {
    preview.push(firstMedia);
  }
  if (firstText) {
    preview.push({ ...firstText, collapsed: true });
  }

  return preview;
}

function getCapsulePreviewText(blocks = [], fallbackText = '') {
  const firstText = blocks.find((block) => block.type === 'text' && String(block.text || '').trim());
  if (firstText) {
    return firstText.text || '';
  }
  return String(fallbackText || '').trim();
}

function getCapsuleBlocks(capsule) {
  const payload = capsule.payload || {};
  const normalizedBlocks = [
    ...(Array.isArray(capsule.blocks) ? capsule.blocks : []),
    ...(Array.isArray(payload.blocks) ? payload.blocks : [])
  ]
    .map((block) => normalizePublishedCapsuleBlock(block))
    .filter(Boolean);

  if (normalizedBlocks.length) {
    return normalizedBlocks;
  }

  const serializedBody = [capsule.body, capsule.content, payload.body]
    .find((value) => typeof value === 'string' && String(value).trim());

  if (serializedBody) {
    return parseCapsuleBodyToBlocks(serializedBody);
  }

  const blocks = [];

  if (payload.type === 'link') {
    if (payload.image) {
      blocks.push({ type: 'image', url: payload.image, caption: payload.caption || capsule.title || '' });
    }
    if (payload.url) {
      blocks.push({ type: 'link', text: capsule.summary || capsule.title || '打开原文', url: payload.url });
    }
    if (payload.commentary) {
      blocks.push({ type: 'text', text: payload.commentary });
    }
    return blocks.length ? blocks : [{ type: 'text', text: capsule.summary || '' }];
  }

  if (payload.type === 'image' && payload.url) {
    blocks.push({ type: 'image', url: payload.url, caption: payload.caption || capsule.title || '' });
    if (payload.commentary) {
      blocks.push({ type: 'text', text: payload.commentary });
    }
    return blocks;
  }

  if (payload.type === 'thought') {
    return [{ type: 'text', text: payload.content || capsule.summary || '' }];
  }

  if (payload.content) {
    blocks.push({ type: 'text', text: payload.content });
  }
  if (payload.commentary) {
    blocks.push({ type: 'text', text: payload.commentary });
  }
  if (payload.url) {
    blocks.push({ type: 'link', text: capsule.summary || '打开原文', url: payload.url });
  }
  if (!blocks.some((block) => block.type === 'text' && String(block.text || '').trim()) && capsule.summary) {
    blocks.push({ type: 'text', text: capsule.summary });
  }

  return blocks.length ? blocks : [{ type: 'text', text: capsule.summary || capsule.title || '' }];
}

function getIssueBlocks(issue) {
  const payload = issue.payload || {};
  const normalizedBlocks = [
    ...(Array.isArray(issue.blocks) ? issue.blocks : []),
    ...(Array.isArray(payload.blocks) ? payload.blocks : [])
  ]
    .map((block) => normalizePublishedIssueBlock(block))
    .filter(Boolean);

  if (normalizedBlocks.length) {
    return normalizedBlocks;
  }

  const serializedBody = [issue.body, issue.content, payload.body]
    .find((value) => typeof value === 'string' && String(value).trim());

  if (serializedBody) {
    return parseIssueBodyToBlocks(serializedBody);
  }

  return [];
}

function getIssueSearchText(issue, capsulesById) {
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
      return `${block.text || ''} ${block.url || ''}`;
    })
  ].join(' ').toLowerCase();
}

function getCapsuleSearchText(capsule) {
  const blockText = getCapsuleBlocks(capsule)
    .map((block) => block.text || block.caption || block.url || '')
    .join(' ');

  return [capsule.title, capsule.summary, ...(capsule.tags || []), blockText].join(' ').toLowerCase();
}

function getTagCounts(items = []) {
  const counts = new Map();
  items.forEach((item) => {
    (item.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });
  return [...counts.entries()].sort((left, right) => right[1] - left[1]);
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
        <motion.div className="lightbox-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.figure
            className="lightbox-figure"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="lightbox-close" onClick={onClose} aria-label="关闭大图预览">×</button>
            <img src={image.url} alt={image.caption || 'Preview'} />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </motion.figure>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function BrowseBlock({ block, onImageClick, collapsed = false }) {
  if (block.type === 'image') {
    return (
      <div className="image-block-preview">
        <button
          type="button"
          className="image-frame-button"
          onClick={(event) => {
            event.stopPropagation();
            onImageClick?.({ url: block.url, caption: block.caption || '图片' });
          }}
        >
          <div className="image-frame">
            <img className="image-block-media" src={block.url} alt={block.caption || '图片'} loading="lazy" />
          </div>
        </button>
        {block.caption ? <div className="image-caption">{renderText(block.caption)}</div> : null}
      </div>
    );
  }

  if (block.type === 'link') {
    return (
      <div className="link-block-preview" onClick={(event) => event.stopPropagation()}>
        <a className="link-block-surface" href={block.url} target="_blank" rel="noreferrer noopener">
          <div className="link-block-copy">
            <span className="link-block-badge">LINK</span>
            <div className="link-block-title">{renderText(block.text || block.url)}</div>
            <div className="link-block-url">{block.url}</div>
          </div>
          <span className="link-block-arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    );
  }

  return <div className={`capsule-content ${collapsed || capsuleNeedsCollapse(block.text) ? 'collapsed' : ''}`}>{renderText(block.text || '')}</div>;
}

function EmbeddedCapsuleCard({ capsule, onOpenCapsule, onImageClick }) {
  const blocks = getCapsuleBlocks(capsule);

  return (
    <motion.article
      {...cardMotion}
      role="button"
      tabIndex={0}
      className="capsule-preview-card capsule-preview-link"
      onClick={() => onOpenCapsule(capsule.slug)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenCapsule(capsule.slug);
        }
      }}
    >
      <div className="item-head">
        <div className="item-main item-main-compact">
          <p className="hint">@ 引入的 Capsule block</p>
        </div>
      </div>

      <div className="capsule-render-stack">
        {blocks.map((block, index) => (
          <BrowseBlock key={`${capsule.id}-${block.type}-${index}`} block={block} onImageClick={onImageClick} collapsed={block.type === 'text'} />
        ))}
      </div>

      <div className="card-bottom-row">
        <div className="item-tags">
          {(capsule.tags || []).map((tag) => (
            <span key={tag} className="tag-chip">#{tag}</span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function IssueContent({ issue, capsulesById, onOpenCapsule, onImageClick }) {
  const issueBlocks = getIssueBlocks(issue);
  return (
    <div className="issue-block-list browse-issue-block-list">
      {issueBlocks.map((block, index) => {
        if (block.type === 'capsule-ref') {
          const capsule = capsulesById.get(block.capsuleId);
          if (!capsule) {
            return null;
          }

          return <EmbeddedCapsuleCard key={`${issue.id}-capsule-${index}`} capsule={capsule} onOpenCapsule={onOpenCapsule} onImageClick={onImageClick} />;
        }

        if (block.type === 'note') {
          return (
            <motion.aside key={`${issue.id}-note-${index}`} {...cardMotion} className="issue-note-block">
              <div className="issue-note-label">Editor&apos;s note</div>
              <p>{renderText(block.content || '')}</p>
            </motion.aside>
          );
        }

        if (block.type === 'link' || block.type === 'image') {
          return <BrowseBlock key={`${issue.id}-${block.type}-${index}`} block={block} onImageClick={onImageClick} />;
        }

        return null;
      })}
    </div>
  );
}

function BrowseIssueCard({ issue, active, onOpenIssue, onOpenCapsule, onImageClick, onToggleTag, activeTags, capsulesById }) {
  return (
    <motion.article {...cardMotion} className={`issue-list-item published browse-card ${active ? 'active' : ''}`}>
      <div className="item-head">
        <div className="item-main">
          <button type="button" className="item-title-trigger" onClick={() => onOpenIssue(issue.slug)}>
            {renderText(issue.title)}
          </button>
          <div className="item-meta">
            <span className="hint item-timestamp">{issue.dateLabel}</span>
          </div>
        </div>
        <div className="item-side item-side-compact">
          <div className="card-status"><span className="status-pill published">已发布</span></div>
        </div>
      </div>

      {issue.summary ? <div className="issue-summary">{renderText(issue.summary)}</div> : null}
      {active ? <IssueContent issue={issue} capsulesById={capsulesById} onOpenCapsule={onOpenCapsule} onImageClick={onImageClick} /> : null}

      <div className="card-bottom-row">
        <div className="item-tags">
          {(issue.tags || []).map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-chip ${activeTags.some((item) => item.toLowerCase() === tag.toLowerCase()) ? 'active' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleTag(tag);
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {active ? <CommentSection issue={{ id: issue.id }} /> : null}
    </motion.article>
  );
}

function BrowseCapsuleCard({ capsule, active, onOpenCapsule, onImageClick, onToggleTag, activeTags, expanded, onToggleExpanded }) {
  const blocks = getCapsuleBlocks(capsule);
  const previewBlocks = capsulePreviewBlocks(blocks);
  const displayedBlocks = active && expanded ? blocks : (active ? blocks : previewBlocks.length ? previewBlocks : [{ type: 'text', text: capsule.summary || '暂无正文', collapsed: true }]);
  const previewText = !active ? getCapsulePreviewText(blocks, capsule.summary || '') : '';

  return (
    <motion.article {...cardMotion} className={`capsule-card published browse-card ${active ? 'active' : ''}`} onClick={() => onOpenCapsule(capsule.slug)}>
      <div className="item-head">
        <div className="item-main item-main-compact">
          <div className="item-meta">
            <span className="hint item-timestamp">{capsule.dateLabel}</span>
          </div>
        </div>
        <div className="item-side item-side-compact">
          <div className="card-status"><span className="status-pill published">已发布</span></div>
        </div>
      </div>

      {previewText ? <div className="capsule-preview-body collapsed">{renderText(previewText)}</div> : null}

      <div className="capsule-render-stack">
        {displayedBlocks.map((block, index) => (
          <BrowseBlock key={`${capsule.id}-${block.type}-${index}`} block={block} onImageClick={onImageClick} collapsed={block.type === 'text' && !active} />
        ))}
      </div>

      <div className="card-bottom-row">
        <div className="item-tags">
          {(capsule.tags || []).map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-chip ${activeTags.some((item) => item.toLowerCase() === tag.toLowerCase()) ? 'active' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleTag(tag);
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
        {blocks.some((block) => block.type === 'text' && capsuleNeedsCollapse(block.text || '')) ? (
          <div className="card-tools">
            <button
              type="button"
              className="ghost small compact-tool"
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpanded(capsule.id);
              }}
            >
              {active && expanded ? '收起' : '展开'}
            </button>
          </div>
        ) : null}
      </div>

      {active ? <CommentSection issue={{ id: capsule.id }} /> : null}
    </motion.article>
  );
}

export default function App() {
  const { site, capsules, issues, loading, error } = useNewsletterData();
  const [route, setRoute] = useState(() => getCurrentRoute());
  const [mode, setMode] = useState(() => (getCurrentRoute().kind === 'capsule' ? 'capsule' : 'issue'));
  const [lightboxImage, setLightboxImage] = useState(null);
  const [searchByMode, setSearchByMode] = useState({ capsule: '', issue: '' });
  const [activeTagsByMode, setActiveTagsByMode] = useState({ capsule: [], issue: [] });
  const [expandedCapsules, setExpandedCapsules] = useState({});

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleHashChange = () => setRoute(parseHashRoute(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (route.kind === 'capsule') {
      setMode('capsule');
    } else if (route.kind === 'issue') {
      setMode('issue');
    }
  }, [route.kind]);

  const capsulesById = useMemo(() => new Map(capsules.map((capsule) => [capsule.id, capsule])), [capsules]);
  const issuesBySlug = useMemo(() => new Map(issues.map((issue) => [issue.slug, issue])), [issues]);
  const capsulesBySlug = useMemo(() => new Map(capsules.map((capsule) => [capsule.slug, capsule])), [capsules]);

  const sortedIssues = useMemo(
    () => [...issues].filter((item) => item.visibility?.direct !== false).sort((left, right) => new Date(right.publishedAt || right.id) - new Date(left.publishedAt || left.id)),
    [issues]
  );

  const sortedCapsules = useMemo(
    () => [...capsules].filter((item) => item.visibility?.direct !== false).sort((left, right) => new Date(right.publishedAt || right.id) - new Date(left.publishedAt || left.id)),
    [capsules]
  );

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
      return getIssueSearchText(issue, capsulesById).includes(query);
    });
  }, [sortedIssues, searchByMode.issue, activeTagsByMode.issue, capsulesById]);

  const filteredCapsules = useMemo(() => {
    const query = searchByMode.capsule.trim().toLowerCase();
    return sortedCapsules.filter((capsule) => {
      if (!filterByTags(capsule, 'capsule')) {
        return false;
      }
      if (!query) {
        return true;
      }
      return getCapsuleSearchText(capsule).includes(query);
    });
  }, [sortedCapsules, searchByMode.capsule, activeTagsByMode.capsule]);

  const activeIssue = mode === 'issue'
    ? filteredIssues.find((issue) => issue.slug === route.slug) || filteredIssues[0] || null
    : null;

  const activeCapsule = mode === 'capsule'
    ? filteredCapsules.find((capsule) => capsule.slug === route.slug) || filteredCapsules[0] || null
    : null;

  useEffect(() => {
    const activeTitle = mode === 'capsule'
      ? (activeCapsule?.title || site?.title || 'GameLetter')
      : (activeIssue?.title || site?.title || 'GameLetter');
    document.title = `${activeTitle} · ${site?.title || 'GameLetter'}`;
  }, [activeCapsule, activeIssue, mode, site]);

  useEffect(() => {
    document.body.dataset.mode = mode;
    return () => {
      delete document.body.dataset.mode;
    };
  }, [mode]);

  const openIssue = (slug) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.location.hash = buildHash('issue', slug);
  };

  const openCapsule = (slug) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.location.hash = buildHash('capsule', slug);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'capsule') {
      const next = capsulesBySlug.get(route.slug) || filteredCapsules[0] || sortedCapsules[0];
      if (next) {
        openCapsule(next.slug);
      }
      return;
    }
    const next = issuesBySlug.get(route.slug) || filteredIssues[0] || sortedIssues[0];
    if (next) {
      openIssue(next.slug);
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
    const activeTitle = mode === 'capsule'
      ? (activeCapsule?.title || site?.title || 'GameLetter')
      : (activeIssue?.title || site?.title || 'GameLetter');
    const activeSummary = mode === 'capsule'
      ? (activeCapsule?.summary || site?.description || '')
      : (activeIssue?.summary || site?.description || '');
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
  const currentTagCounts = getTagCounts(mode === 'capsule' ? sortedCapsules : sortedIssues);
  const selectedTags = activeTagsByMode[mode];
  const displayedItems = mode === 'capsule' ? filteredCapsules : filteredIssues;

  return (
    <div className="app-shell">
      <Header site={site} onShare={handleShare} />

      <div className="workspace browse-workspace">
        <aside className="nav-column">
          <section className="card nav-card">
            <nav className={`mode-tabs ${mode === 'capsule' ? 'capsule-active' : 'issue-active'}`} aria-label="浏览模式切换">
              <span className="mode-tab-indicator" aria-hidden="true" />
              <button type="button" className={`mode-tab ${mode === 'capsule' ? 'active' : ''}`} onClick={() => switchMode('capsule')}>Capsule</button>
              <button type="button" className={`mode-tab ${mode === 'issue' ? 'active' : ''}`} onClick={() => switchMode('issue')}>Issue</button>
            </nav>
          </section>
        </aside>

        <main className="main-column">
          <section className="card section-card">
            {loading ? <div className="empty-card"><h3>正在加载内容</h3><p className="hint">稍等片刻，正在整理浏览模式数据。</p></div> : null}
            {error ? <div className="empty-card"><h3>加载失败</h3><p className="hint">{error}</p></div> : null}

            {!loading && !error ? (
              <div className={mode === 'capsule' ? 'capsule-list' : 'issue-list'}>
                {displayedItems.length ? displayedItems.map((item) => (
                  mode === 'capsule'
                    ? (
                      <BrowseCapsuleCard
                        key={item.id}
                        capsule={item}
                        active={activeCapsule?.id === item.id}
                        onOpenCapsule={openCapsule}
                        onImageClick={setLightboxImage}
                        onToggleTag={(tag) => toggleTag('capsule', tag)}
                        activeTags={activeTagsByMode.capsule}
                        expanded={Boolean(expandedCapsules[item.id])}
                        onToggleExpanded={(id) => setExpandedCapsules((prev) => ({ ...prev, [id]: !prev[id] }))}
                      />
                    )
                    : (
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
                      />
                    )
                )) : <div className="empty-card"><h3>没有可展示内容</h3><p className="hint">试试清空搜索或标签筛选。</p></div>}
              </div>
            ) : null}
          </section>
        </main>

        <aside className="side-column">
          <section className="card side-card browse-search-card">
            <input
              className="search-input"
              type="search"
              value={currentSearch}
              onChange={(event) => setSearchByMode((prev) => ({ ...prev, [mode]: event.target.value }))}
              placeholder={`搜索${mode === 'capsule' ? ' Capsule' : ' Issue'}`}
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
