import { motion } from 'framer-motion';
import { getIssueBlocks } from '../../content/blocks';
import { renderInlineMarkdown } from '../../content/markdown';
import { cardMotion } from '../../view/animations';
import { BrowseBlock } from '../blocks/BrowseBlock';
import { EmbeddedCapsuleCard } from './EmbeddedCapsuleCard';

export function IssueContent({ issue, capsulesById, onOpenCapsule, onImageClick }) {
  const issueBlocks = getIssueBlocks(issue);
  return (
    <div className="issue-block-list">
      {issueBlocks.map((block, index) => {
        if (block.type === 'capsule-ref') {
          const capsule = capsulesById.get(block.capsuleId);
          if (!capsule) {
            return null;
          }

          return <EmbeddedCapsuleCard key={`${issue.id}-capsule-${index}`} capsule={capsule} onOpenCapsule={onOpenCapsule} />;
        }

        if (block.type === 'note') {
          return (
            <motion.aside key={`${issue.id}-note-${index}`} {...cardMotion} className="issue-note-block">
              <div className="issue-note-label">Editor&apos;s note</div>
              <p>{renderInlineMarkdown(block.content || '', `${issue.id}-note-${index}`)}</p>
            </motion.aside>
          );
        }

        if (block.type === 'link' || block.type === 'image') {
          return <BrowseBlock key={`${issue.id}-${block.type}-${index}`} block={block} onImageClick={onImageClick} />;
        }

        return null;
      })}
    </div>
  );
}
