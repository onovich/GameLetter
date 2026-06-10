import { resolveAssetUrl } from '../../content/assets';
import { capsuleNeedsCollapse } from '../../content/blocks';
import { renderInlineMarkdown } from '../../content/markdown';

export function BrowseBlock({ block, onImageClick, collapsed = false }) {
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
        {block.caption ? <div className="image-caption">{renderInlineMarkdown(block.caption, `image-caption-${block.url}`)}</div> : null}
      </div>
    );
  }

  if (block.type === 'link') {
    return (
      <div className="link-block-preview" onClick={(event) => event.stopPropagation()}>
        <a className="link-block-surface" href={block.url} target="_blank" rel="noreferrer noopener">
          <div className="link-block-copy">
            <span className="link-block-badge">LINK</span>
            <div className="link-block-title">{renderInlineMarkdown(block.text || block.url, `link-title-${block.url}`)}</div>
            <div className="link-block-url">{block.url}</div>
          </div>
          <span className="link-block-arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    );
  }

  if (block.type === 'toy') {
    const toyUrl = resolveAssetUrl(block.entry);
    return (
      <div className="toy-block-preview" onClick={(event) => event.stopPropagation()}>
        <div className="toy-frame-wrap" style={{ aspectRatio: block.aspectRatio || '16 / 9' }}>
          {block.allowFullscreen && toyUrl ? (
            <a className="toy-fullscreen-link" href={toyUrl} target="_blank" rel="noreferrer noopener" aria-label="全屏打开 Toy">
              全屏打开
            </a>
          ) : null}
          <iframe
            className="toy-frame"
            src={toyUrl}
            title={block.title || 'Toy'}
            loading="lazy"
            allow="fullscreen"
            sandbox="allow-scripts allow-pointer-lock allow-popups"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`capsule-content ${collapsed || capsuleNeedsCollapse(block.text) ? 'collapsed' : ''}`}>
      {renderInlineMarkdown(block.text || '', `capsule-text-${String(block.text || '').slice(0, 24)}`)}
    </div>
  );
}
