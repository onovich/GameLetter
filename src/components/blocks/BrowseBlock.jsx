import { useEffect, useState } from 'react';
import { resolveAssetUrl } from '../../content/assets';
import { capsuleNeedsCollapse } from '../../content/blocks';
import { renderInlineMarkdown } from '../../content/markdown';

export function BrowseBlock({ block, onImageClick, collapsed = false, toyKey = '', isPlaying = true, onPlayToy }) {
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
    return <ToyBlock block={block} toyKey={toyKey} isPlaying={isPlaying} onPlayToy={onPlayToy} />;
  }

  return (
    <div className={`capsule-content ${collapsed || capsuleNeedsCollapse(block.text) ? 'collapsed' : ''}`}>
      {renderInlineMarkdown(block.text || '', `capsule-text-${String(block.text || '').slice(0, 24)}`)}
    </div>
  );
}

function ToyBlock({ block, toyKey, isPlaying, onPlayToy }) {
  const toyUrl = resolveAssetUrl(block.entry);
  const posterUrl = resolveAssetUrl(block.poster || block.previewImage || block.image || block.thumbnail || '');
  const [toyLoaded, setToyLoaded] = useState(false);

  useEffect(() => {
    setToyLoaded(false);
  }, [isPlaying, toyUrl]);

  const handlePlay = (event) => {
    event.stopPropagation();
    if (isPlaying) {
      return;
    }
    onPlayToy?.(toyKey || block.toyId || block.entry || '');
  };

  return (
    <div className="toy-block-preview" onClick={(event) => event.stopPropagation()}>
      <div className="toy-frame-wrap" style={{ aspectRatio: block.aspectRatio || '16 / 9' }}>
        {isPlaying && block.allowFullscreen && toyUrl ? (
          <a className="toy-fullscreen-link" href={toyUrl} target="_blank" rel="noreferrer noopener" aria-label="全屏打开 Toy">
            全屏打开
          </a>
        ) : null}
        {isPlaying && toyUrl ? (
          <iframe
            className="toy-frame"
            src={toyUrl}
            title={block.title || 'Toy'}
            loading="lazy"
            allow="fullscreen"
            sandbox="allow-scripts allow-pointer-lock allow-popups"
            onLoad={() => setToyLoaded(true)}
          />
        ) : null}
        <button
          type="button"
          className={`toy-poster-overlay ${isPlaying ? 'is-loading' : ''} ${isPlaying && toyLoaded ? 'is-playing' : ''}`}
          onClick={handlePlay}
          disabled={isPlaying}
          aria-label={`播放 ${block.title || 'Toy'}`}
        >
          {posterUrl ? <img className="toy-poster-image" src={posterUrl} alt="" loading="lazy" /> : <span className="toy-poster-fallback" aria-hidden="true" />}
          <span className="toy-play-button" aria-hidden="true"><span /></span>
        </button>
      </div>
    </div>
  );
}
