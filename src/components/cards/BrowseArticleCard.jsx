import { AnimatePresence, motion } from 'framer-motion';
import { renderText } from '../../content/text';
import { cardMotion } from '../../view/animations';
import { ArticleContent } from './ArticleContent';

export function BrowseArticleCard({ article, active, columnTitle, onOpenArticle, onOpenCapsule, onImageClick, onToggleTag, activeTags, capsulesById }) {
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
