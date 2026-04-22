import { motion } from 'framer-motion';
import { CapsuleCard } from './CapsuleCard';

const itemMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 }
};

export function IssueComposer({ issue, capsulesById, onOpenCapsule, onImageClick }) {
  return (
    <div className="news-flow issue-blocks">
      {issue.blocks.map((block, index) => {
        if (block.type === 'capsule-ref') {
          const capsule = capsulesById.get(block.capsuleId);
          if (!capsule) {
            return null;
          }

          return (
            <CapsuleCard
              key={`${issue.id}-capsule-${index}`}
              capsule={capsule}
              embedded
              onOpenCapsule={onOpenCapsule}
              onImageClick={onImageClick}
            />
          );
        }

        if (block.type === 'note') {
          return (
            <motion.aside key={`${issue.id}-note-${index}`} {...itemMotion} className="issue-note-block">
              <div className="issue-note-label">Editor&apos;s note</div>
              <p>{block.content}</p>
            </motion.aside>
          );
        }

        if (block.type === 'link') {
          return (
            <motion.a
              key={`${issue.id}-link-${index}`}
              {...itemMotion}
              href={block.url}
              target="_blank"
              rel="noreferrer"
              className="news-card link-card issue-inline-link-card"
            >
              <div className="link-card-content">
                <span className="link-inline-badge">Link</span>
                <h3>{block.text || block.url}</h3>
                <p>{block.url}</p>
              </div>
            </motion.a>
          );
        }

        if (block.type === 'image') {
          return (
            <motion.figure key={`${issue.id}-image-${index}`} {...itemMotion} className="news-card image-card image-card-clickable">
              <button type="button" className="image-card-button" onClick={() => onImageClick?.({ url: block.url, caption: block.caption || issue.title })}>
                <img src={block.url} alt={block.caption || issue.title} />
              </button>
              {block.caption ? <figcaption>{block.caption}</figcaption> : null}
            </motion.figure>
          );
        }

        return null;
      })}
    </div>
  );
}
