import { motion } from 'framer-motion';
import { getCapsuleBlocks, getCapsuleEmbedPreview } from '../../content/blocks';
import { renderInlineMarkdown } from '../../content/markdown';
import { renderText } from '../../content/text';
import { cardMotion } from '../../view/animations';

export function EmbeddedCapsuleCard({ capsule, onOpenCapsule }) {
  const blocks = getCapsuleBlocks(capsule);
  const preview = getCapsuleEmbedPreview(capsule, blocks);

  return (
    <motion.article
      {...cardMotion}
      role="button"
      tabIndex={0}
      className={`capsule-embed-compact ${preview.image ? 'has-media' : 'text-only'}`}
      onClick={() => onOpenCapsule(capsule.slug)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenCapsule(capsule.slug);
        }
      }}
    >
      {preview.image ? (
        <div className="capsule-embed-media" aria-hidden="true">
          <img src={preview.image.url} alt="" loading="lazy" />
        </div>
      ) : null}

      <div className="capsule-embed-copy">
        <div className="capsule-embed-meta">{preview.eyebrow}</div>
        <h3>{renderText(capsule.title)}</h3>
        {preview.text ? <p>{renderInlineMarkdown(preview.text, `${capsule.id}-embed`)}</p> : null}
        <div className="item-tags">
          {(capsule.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="tag-chip">#{tag}</span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
