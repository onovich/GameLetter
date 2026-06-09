import { AnimatePresence, motion } from 'framer-motion';
import { renderText } from '../../content/text';
import { cardMotion } from '../../view/animations';
import { CommentSection } from '../CommentSection';
import { IssueContent } from './IssueContent';

export function BrowseIssueCard({ issue, active, onOpenIssue, onOpenCapsule, onImageClick, onToggleTag, activeTags, capsulesById, canvasesById }) {
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
              <IssueContent issue={issue} capsulesById={capsulesById} onOpenCapsule={onOpenCapsule} onImageClick={onImageClick} canvasesById={canvasesById} />
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
