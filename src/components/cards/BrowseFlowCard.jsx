import { motion } from 'framer-motion';
import { normalizeLineEndings, renderText } from '../../content/text';
import { cardMotion } from '../../view/animations';

export function BrowseFlowCard({ flow, onOpenFlow, onToggleTag, activeTags }) {
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
