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

        return null;
      })}
    </div>
  );
}
