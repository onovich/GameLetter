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

const modeOrder = ['issue', 'capsule', 'flow', 'article'];

const modeMeta = {
  issue: { label: 'Issue', route: 'issues', className: 'issue-list' },
  capsule: { label: 'Capsule', route: 'capsules', className: 'capsule-list' },
  flow: { label: 'Flow', route: 'flows', className: 'flow-list' },
  article: { label: 'Article', route: 'articles', className: 'article-list' }
};

function normalizeMode(kind) {
  return modeMeta[kind] ? kind : 'issue';
}

function parseHashRoute(hash) {
  const normalized = hash.replace(/^#/, '');
  const parts = normalized.split('/').filter(Boolean);

  const match = Object.entries(modeMeta).find(([, meta]) => meta.route === parts[0]);
  if (match && parts[1]) {
    return { kind: match[0], slug: decodeURIComponent(parts[1]) };
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
  return `/${modeMeta[normalizeMode(kind)].route}/${encodeURIComponent(slug)}`;
}

function resolveAssetUrl(path = '') {
  const value = String(path || '').trim();
  if (!value || /^https?:\/\//i.test(value)) {
    return value;
  }
  return `${getBaseUrl()}${value.replace(/^\/+/, '')}`;
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
  if (type === 'canvas') {
    const entry = String(block.entry || block.src || block.url || '').trim();
    return entry ? {
      type: 'canvas',
      entry,
      title: block.title || block.label || '',
      caption: block.caption || block.summary || '',
      aspectRatio: block.aspectRatio || '16 / 9',
      allowFullscreen: block.allowFullscreen !== false
    } : null;
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

function normalizePublishedArticleBlock(block) {
  if (!block) {
    return null;
  }
  if (typeof block === 'string') {
    return { type: 'paragraph', content: block };
  }

  const type = String(block.type || '').trim();
  if (type === 'heading' || type === 'quote' || type === 'paragraph') {
    return { type, content: block.content || block.text || '' };
  }
  if (type === 'canvas-ref' && block.capsuleId) {
    return { type: 'canvas-ref', capsuleId: block.capsuleId };
  }
  return normalizePublishedIssueBlock(block);
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

  if (payload.type === 'canvas') {
    return [{
      type: 'canvas',
      entry: payload.entry || payload.src || payload.url || '',
      title: payload.title || capsule.title || '',
      caption: payload.caption || payload.commentary || capsule.summary || '',
      aspectRatio: payload.aspectRatio || '16 / 9',
      allowFullscreen: payload.allowFullscreen !== false
    }];
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

function getArticleBlocks(article) {
  const normalizedBlocks = (Array.isArray(article.blocks) ? article.blocks : [])
    .map((block) => normalizePublishedArticleBlock(block))
    .filter(Boolean);

  if (normalizedBlocks.length) {
    return normalizedBlocks;
  }

  const body = [article.body, article.content]
    .find((value) => typeof value === 'string' && String(value).trim());

  if (!body) {
    return [];
  }

  return normalizeLineEndings(body)
    .split(/\n{2,}/)
    .map((chunk) => ({ type: 'paragraph', content: chunk.trim() }))
    .filter((block) => block.content);
}

function getBlockSearchText(block) {
  return [block.text, block.content, block.caption, block.title, block.url, block.entry]
    .filter(Boolean)
    .join(' ');
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
      return getBlockSearchText(block);
    })
  ].join(' ').toLowerCase();
}

function getCapsuleSearchText(capsule) {
  const blockText = getCapsuleBlocks(capsule)
    .map((block) => getBlockSearchText(block))
    .join(' ');

  return [capsule.title, capsule.summary, ...(capsule.tags || []), blockText].join(' ').toLowerCase();
}

function getPlainEntrySearchText(entry) {
  return [entry.title, entry.summary, entry.body, entry.content, ...(entry.tags || [])].join(' ').toLowerCase();
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

  if (block.type === 'canvas') {
    const canvasUrl = resolveAssetUrl(block.entry);
    return (
      <div className="canvas-block-preview" onClick={(event) => event.stopPropagation()}>
        <div className="canvas-block-head">
          <div className="link-block-copy">
            <span className="link-block-badge">CANVAS</span>
            {block.title ? <div className="link-block-title">{renderText(block.title)}</div> : null}
            {block.caption ? <div className="link-block-url">{renderText(block.caption)}</div> : null}
          </div>
          {block.allowFullscreen && canvasUrl ? (
            <a className="canvas-fullscreen-link" href={canvasUrl} target="_blank" rel="noreferrer noopener">
              全屏打开
            </a>
          ) : null}
        </div>
        <div className="canvas-frame-wrap" style={{ aspectRatio: block.aspectRatio || '16 / 9' }}>
          <iframe
            className="canvas-frame"
            src={canvasUrl}
            title={block.title || 'Canvas'}
            loading="lazy"
            allow="fullscreen"
            sandbox="allow-scripts allow-pointer-lock allow-popups"
          />
        </div>
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
          <BrowseBlock key={`${capsule.id}-${block.type}-${index}`} block={block} onImageClick={onImageClick} />
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
    <div className="issue-block-list">
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

function ArticleContent({ article, capsulesById, onOpenCapsule, onImageClick }) {
  const articleBlocks = getArticleBlocks(article);

  return (
    <div className="article-body">
      {articleBlocks.map((block, index) => {
        if (block.type === 'heading') {
          return <h3 key={`${article.id}-heading-${index}`} className="article-section-heading">{renderText(block.content || '')}</h3>;
        }

        if (block.type === 'quote') {
          return <blockquote key={`${article.id}-quote-${index}`} className="article-quote">{renderText(block.content || '')}</blockquote>;
        }

        if (block.type === 'paragraph') {
          return <p key={`${article.id}-paragraph-${index}`}>{renderText(block.content || '')}</p>;
        }

        if (block.type === 'capsule-ref' || block.type === 'canvas-ref') {
          const capsule = capsulesById.get(block.capsuleId);
          if (!capsule) {
            return null;
          }
          return <EmbeddedCapsuleCard key={`${article.id}-capsule-${index}`} capsule={capsule} onOpenCapsule={onOpenCapsule} onImageClick={onImageClick} />;
        }

        if (block.type === 'note') {
          return (
            <aside key={`${article.id}-note-${index}`} className="issue-note-block">
              <div className="issue-note-label">Note</div>
              <p>{renderText(block.content || '')}</p>
            </aside>
          );
        }

        if (block.type === 'link' || block.type === 'image' || block.type === 'canvas') {
          return <BrowseBlock key={`${article.id}-${block.type}-${index}`} block={block} onImageClick={onImageClick} />;
        }

        return null;
      })}
    </div>
  );
}

function BrowseIssueCard({ issue, active, onOpenIssue, onOpenCapsule, onImageClick, onToggleTag, activeTags, capsulesById }) {
  return (
    <motion.article {...cardMotion} className="issue-list-item published">
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
      <AnimatePresence initial={false}>
        {active ? (
          <motion.div
            key={`${issue.id}-expanded`}
            className="issue-card-expand-region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: 'easeInOut' }}
          >
            <div className="issue-card-expand-inner">
              <IssueContent issue={issue} capsulesById={capsulesById} onOpenCapsule={onOpenCapsule} onImageClick={onImageClick} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

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

      <AnimatePresence initial={false}>
        {active ? (
          <motion.div
            key={`${issue.id}-comments`}
            className="issue-card-expand-region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: 'easeInOut', delay: 0.03 }}
          >
            <div className="issue-card-expand-inner">
              <CommentSection issue={{ id: issue.id }} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function BrowseFlowCard({ flow, onOpenFlow, onToggleTag, activeTags }) {
  return (
    <motion.article {...cardMotion} className="flow-card published" onClick={() => onOpenFlow(flow.slug)}>
      <div className="item-head">
        <div className="item-main">
          <button type="button" className="item-title-trigger" onClick={() => onOpenFlow(flow.slug)}>
            {renderText(flow.title)}
          </button>
          <div className="item-meta">
            <span className="hint item-timestamp">{flow.dateLabel}</span>
          </div>
        </div>
        <div className="item-side item-side-compact">
          <div className="card-status"><span className="status-pill published">Flow</span></div>
        </div>
      </div>

      <div className="flow-body">
        {normalizeLineEndings(flow.body || flow.content || flow.summary || '')
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((paragraph, index) => <p key={`${flow.id}-paragraph-${index}`}>{renderText(paragraph)}</p>)}
      </div>

      <div className="card-bottom-row">
        <div className="item-tags">
          {(flow.tags || []).map((tag) => (
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
    </motion.article>
  );
}

function BrowseArticleCard({ article, active, columnTitle, onOpenArticle, onOpenCapsule, onImageClick, onToggleTag, activeTags, capsulesById }) {
  return (
    <motion.article {...cardMotion} className={`article-card published ${active ? 'active' : ''}`}>
      <div className="item-head">
        <div className="item-main">
          <button type="button" className="item-title-trigger" onClick={() => onOpenArticle(article.slug)}>
            {renderText(article.title)}
          </button>
          <div className="item-meta">
            {columnTitle ? <span className="hint item-timestamp">{renderText(columnTitle)}</span> : null}
            <span className="hint item-timestamp">{article.dateLabel}</span>
          </div>
        </div>
        <div className="item-side item-side-compact">
          <div className="card-status"><span className="status-pill published">Article</span></div>
        </div>
      </div>

      {article.summary ? <div className="issue-summary">{renderText(article.summary)}</div> : null}
      <AnimatePresence initial={false}>
        {active ? (
          <motion.div
            key={`${article.id}-expanded`}
            className="issue-card-expand-region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: 'easeInOut' }}
          >
            <div className="issue-card-expand-inner">
              <ArticleContent article={article} capsulesById={capsulesById} onOpenCapsule={onOpenCapsule} onImageClick={onImageClick} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="card-bottom-row">
        <div className="item-tags">
          {(article.tags || []).map((tag) => (
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
    </motion.article>
  );
}

function BrowseCapsuleCard({ capsule, onOpenCapsule, onImageClick, onToggleTag, activeTags }) {
  const blocks = getCapsuleBlocks(capsule);

  return (
    <motion.article {...cardMotion} className="capsule-card published" onClick={() => onOpenCapsule(capsule.slug)}>
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

      <div className="capsule-render-stack">
        {blocks.map((block, index) => (
          <BrowseBlock key={`${capsule.id}-${block.type}-${index}`} block={block} onImageClick={onImageClick} />
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
      </div>
    </motion.article>
  );
}

export default function App() {
  const { site, capsules, issues, flows, articles, columns, loading, error } = useNewsletterData();
  const [route, setRoute] = useState(() => getCurrentRoute());
  const [mode, setMode] = useState(() => normalizeMode(getCurrentRoute().kind));
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

  const sortedIssues = useMemo(
    () => [...issues].filter((item) => item.visibility?.direct !== false).sort((left, right) => new Date(right.publishedAt || right.id) - new Date(left.publishedAt || left.id)),
    [issues]
  );

  const sortedCapsules = useMemo(
    () => [...capsules].filter((item) => item.visibility?.direct !== false).sort((left, right) => new Date(right.publishedAt || right.id) - new Date(left.publishedAt || left.id)),
    [capsules]
  );

  const sortedFlows = useMemo(
    () => [...flows].filter((item) => item.visibility?.direct !== false).sort((left, right) => new Date(right.publishedAt || right.id) - new Date(left.publishedAt || left.id)),
    [flows]
  );

  const sortedArticles = useMemo(
    () => [...articles].filter((item) => item.visibility?.direct !== false).sort((left, right) => new Date(right.publishedAt || right.id) - new Date(left.publishedAt || left.id)),
    [articles]
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
      const blockText = getArticleBlocks(article).map((block) => {
        if (block.type === 'capsule-ref' || block.type === 'canvas-ref') {
          const capsule = capsulesById.get(block.capsuleId);
          return capsule ? getCapsuleSearchText(capsule) : '';
        }
        return getBlockSearchText(block);
      }).join(' ');
      return [getPlainEntrySearchText(article), blockText, columnsById.get(article.columnId)?.title || ''].join(' ').toLowerCase().includes(query);
    });
  }, [sortedArticles, searchByMode.article, activeTagsByMode.article, capsulesById, columnsById]);

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

  useEffect(() => {
    const activeTitle = activeEntry?.title || site?.title || 'GameLetter';
    document.title = `${activeTitle} · ${site?.title || 'GameLetter'}`;
  }, [activeEntry, site]);

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
          <section className="card nav-card">
            <nav className={`mode-tabs ${mode}-active`} aria-label="浏览模式切换">
              <span className="mode-tab-indicator" aria-hidden="true" />
              {modeOrder.map((item) => (
                <button key={item} type="button" className={`mode-tab ${mode === item ? 'active' : ''}`} onClick={() => switchMode(item)}>
                  {modeMeta[item].label}
                </button>
              ))}
            </nav>
          </section>
        </aside>

        <main className="main-column">
          <section className="card section-card">
            {loading ? <div className="empty-card"><h3>正在加载内容</h3><p className="hint">稍等片刻，正在整理浏览模式数据。</p></div> : null}
            {error ? <div className="empty-card"><h3>加载失败</h3><p className="hint">{error}</p></div> : null}

            {!loading && !error ? (
              <div className={modeMeta[mode].className}>
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
                    />
                  );
                }) : <div className="empty-card"><h3>没有可展示内容</h3><p className="hint">试试清空搜索或标签筛选。</p></div>}
              </div>
            ) : null}
          </section>
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
