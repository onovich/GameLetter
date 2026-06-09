import { motion } from 'framer-motion';
import { getCapsuleBlocks } from '../../content/blocks';
import { cardMotion } from '../../view/animations';
import { BrowseBlock } from '../blocks/BrowseBlock';

export function BrowseCapsuleCard({ capsule, onOpenCapsule, onImageClick, onToggleTag, activeTags, canvasesById }) {
  const blocks = getCapsuleBlocks(capsule, { canvasesById });

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
