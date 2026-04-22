import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const cardMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 }
};

export function NewsItem({ item, onImageClick }) {
  if (item.type === 'link') {
    return (
      <motion.a
        {...cardMotion}
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="news-card link-card"
      >
        {item.image ? (
          <div className="link-card-image-wrap">
            <img src={item.image} alt={item.title} className="link-card-image" />
          </div>
        ) : null}
        <div className="link-card-content">
          <h3>
            {item.title}
            <ArrowUpRight size={16} />
          </h3>
          <p>{item.description}</p>
        </div>
      </motion.a>
    );
  }

  if (item.type === 'thought') {
    return (
      <motion.blockquote {...cardMotion} className="news-card thought-card">
        <p>“{item.content}”</p>
        <footer>— {item.author}</footer>
      </motion.blockquote>
    );
  }

  if (item.type === 'image') {
    return (
      <motion.figure {...cardMotion} className="news-card image-card image-card-clickable">
        <button type="button" className="image-card-button" onClick={() => onImageClick?.(item)}>
          <img src={item.url} alt={item.caption || 'GameLetter visual'} />
        </button>
        {item.caption ? <figcaption>{item.caption}</figcaption> : null}
      </motion.figure>
    );
  }

  return null;
}
