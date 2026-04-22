import { motion } from 'framer-motion';
import { ArrowUpRight, Link2 } from 'lucide-react';

const cardMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 }
};

function PayloadRenderer({ capsule, onImageClick }) {
  const { payload } = capsule;

  if (payload.type === 'link') {
    return (
      <>
        {payload.image ? (
          <div className="capsule-media-wrap">
            <img src={payload.image} alt={capsule.title} className="capsule-media" />
          </div>
        ) : null}
        <div className="capsule-content">
          <div className="capsule-source-row">
            <Link2 size={14} />
            <a href={payload.url} target="_blank" rel="noreferrer">
              打开原文
              <ArrowUpRight size={14} />
            </a>
          </div>
          <p>{capsule.summary}</p>
          {payload.commentary ? <blockquote className="capsule-commentary">{payload.commentary}</blockquote> : null}
        </div>
      </>
    );
  }

  if (payload.type === 'image') {
    return (
      <>
        <button type="button" className="image-card-button capsule-image-button" onClick={() => onImageClick?.({ url: payload.url, caption: payload.caption || capsule.title })}>
          <img src={payload.url} alt={payload.caption || capsule.title} className="capsule-media" />
        </button>
        <div className="capsule-content">
          {payload.caption ? <p>{payload.caption}</p> : null}
          {payload.commentary ? <blockquote className="capsule-commentary">{payload.commentary}</blockquote> : null}
        </div>
      </>
    );
  }

  if (payload.type === 'thought') {
    return (
      <div className="capsule-content only-text">
        <blockquote className="capsule-thought">“{payload.content}”</blockquote>
        {payload.author ? <div className="capsule-author">— {payload.author}</div> : null}
      </div>
    );
  }

  return null;
}

export function CapsuleCard({ capsule, embedded = false, onOpenCapsule, onImageClick }) {
  return (
    <motion.article {...cardMotion} className={`capsule-card ${embedded ? 'embedded' : 'standalone'}`}>
      <div className="capsule-card-top">
        <div>
          <div className="capsule-eyebrow">Capsule</div>
          <h3>{capsule.title}</h3>
          <p className="capsule-date">{capsule.dateLabel}</p>
        </div>
        {embedded ? (
          <button type="button" className="capsule-open-button" onClick={() => onOpenCapsule?.(capsule.slug)}>
            独立查看
          </button>
        ) : null}
      </div>

      <div className="tag-row capsule-tags">
        {capsule.tags?.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
          </span>
        ))}
      </div>

      <PayloadRenderer capsule={capsule} onImageClick={onImageClick} />
    </motion.article>
  );
}
