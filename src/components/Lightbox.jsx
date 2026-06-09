import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function Lightbox({ image, onClose }) {
  useEffect(() => {
    if (!image) {
      return undefined;
    }

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [image, onClose]);

  return (
    <AnimatePresence>
      {image ? (
        <motion.div className="lightbox-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.figure
            className="lightbox-figure"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="lightbox-close" onClick={onClose} aria-label="关闭大图预览">×</button>
            <img src={image.url} alt={image.caption || 'Preview'} />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </motion.figure>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
