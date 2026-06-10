import { motion } from 'framer-motion';
import { renderText } from '../../content/text';
import { cardMotion } from '../../view/animations';
import { BrowseBlock } from '../blocks/BrowseBlock';

export function BrowseToyCard({ toy, active, onOpenToy, onToggleTag, activeTags }) {
  return (
    <motion.article {...cardMotion} className={`toy-card published ${active ? 'active' : ''}`} onClick={() => onOpenToy(toy.slug)}>
      <div className="item-head">
        <div className="item-main">
          <button
            type="button"
            className="item-title-trigger"
            onClick={(event) => {
              event.stopPropagation();
              onOpenToy(toy.slug);
            }}
          >
            {renderText(toy.title)}
          </button>
          <div className="item-meta">
            <span className="hint item-timestamp">{toy.dateLabel}</span>
          </div>
        </div>
        <div className="item-side item-side-compact">
          <div className="card-status"><span className="status-pill published">Toy</span></div>
        </div>
      </div>

      {toy.summary ? <div className="issue-summary">{renderText(toy.summary)}</div> : null}
      <BrowseBlock block={{ ...toy, type: 'toy', toyId: toy.id }} />

      <div className="card-bottom-row">
        <div className="item-tags">
          {(toy.tags || []).map((tag) => (
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
