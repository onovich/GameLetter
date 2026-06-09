import { getArticleBlocks } from '../../content/blocks';
import { renderInlineMarkdown } from '../../content/markdown';
import { BrowseBlock } from '../blocks/BrowseBlock';
import { EmbeddedCapsuleCard } from './EmbeddedCapsuleCard';

export function ArticleContent({ article, capsulesById, onOpenCapsule, onImageClick, canvasesById }) {
  const articleBlocks = getArticleBlocks(article, { canvasesById });

  return (
    <div className="article-body">
      {articleBlocks.map((block, index) => {
        if (block.type === 'heading') {
          return <h3 key={`${article.id}-heading-${index}`} className="article-section-heading">{renderInlineMarkdown(block.content || '', `${article.id}-heading-${index}`)}</h3>;
        }

        if (block.type === 'quote') {
          return <blockquote key={`${article.id}-quote-${index}`} className="article-quote">{renderInlineMarkdown(block.content || '', `${article.id}-quote-${index}`)}</blockquote>;
        }

        if (block.type === 'paragraph') {
          return <p key={`${article.id}-paragraph-${index}`}>{renderInlineMarkdown(block.content || '', `${article.id}-paragraph-${index}`)}</p>;
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag key={`${article.id}-list-${index}`} className="article-markdown-list">
              {(block.items || []).map((item, itemIndex) => (
                <li key={`${article.id}-list-${index}-${itemIndex}`}>{renderInlineMarkdown(item, `${article.id}-list-${index}-${itemIndex}`)}</li>
              ))}
            </ListTag>
          );
        }

        if (block.type === 'code') {
          return (
            <pre key={`${article.id}-code-${index}`} className="article-code-block">
              <code>{block.content || ''}</code>
            </pre>
          );
        }

        if (block.type === 'capsule-ref' || block.type === 'canvas-ref') {
          const capsule = capsulesById.get(block.capsuleId);
          if (!capsule) {
            return null;
          }
          return <EmbeddedCapsuleCard key={`${article.id}-capsule-${index}`} capsule={capsule} onOpenCapsule={onOpenCapsule} canvasesById={canvasesById} />;
        }

        if (block.type === 'note') {
          return (
            <aside key={`${article.id}-note-${index}`} className="issue-note-block">
              <div className="issue-note-label">Note</div>
              <p>{renderInlineMarkdown(block.content || '', `${article.id}-note-${index}`)}</p>
            </aside>
          );
        }

        if (block.type === 'link' || block.type === 'image' || block.type === 'canvas') {
          return <BrowseBlock key={`${article.id}-${block.type}-${index}`} block={block} onImageClick={onImageClick} />;
        }

        return null;
      })}
    </div>
  );
}
