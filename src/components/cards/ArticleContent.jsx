import { getArticleBlocks } from '../../content/blocks';
import { renderText } from '../../content/text';
import { BrowseBlock } from '../blocks/BrowseBlock';
import { EmbeddedCapsuleCard } from './EmbeddedCapsuleCard';

export function ArticleContent({ article, capsulesById, onOpenCapsule, onImageClick }) {
  const articleBlocks = getArticleBlocks(article);

  return (
    <div className="article-body">
      {articleBlocks.map((block, index) => {
        if (block.type === 'heading') {
          return <h3 key={`${article.id}-heading-${index}`} className="article-section-heading">{renderText(block.content || '')}</h3>;
        }

        if (block.type === 'quote') {
          return <blockquote key={`${article.id}-quote-${index}`} className="article-quote">{renderText(block.content || '')}</blockquote>;
        }

        if (block.type === 'paragraph') {
          return <p key={`${article.id}-paragraph-${index}`}>{renderText(block.content || '')}</p>;
        }

        if (block.type === 'capsule-ref' || block.type === 'canvas-ref') {
          const capsule = capsulesById.get(block.capsuleId);
          if (!capsule) {
            return null;
          }
          return <EmbeddedCapsuleCard key={`${article.id}-capsule-${index}`} capsule={capsule} onOpenCapsule={onOpenCapsule} />;
        }

        if (block.type === 'note') {
          return (
            <aside key={`${article.id}-note-${index}`} className="issue-note-block">
              <div className="issue-note-label">Note</div>
              <p>{renderText(block.content || '')}</p>
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
