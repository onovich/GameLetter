import { applyPanguSpacing } from './text';

const inlineTokenPattern = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*\n]+)\*)/g;

function appendText(nodes, text) {
  if (text) {
    nodes.push(text);
  }
}

export function renderInlineMarkdown(value = '', keyPrefix = 'md') {
  const source = applyPanguSpacing(value);
  const nodes = [];
  let cursor = 0;
  let match;
  let index = 0;

  inlineTokenPattern.lastIndex = 0;
  while ((match = inlineTokenPattern.exec(source)) !== null) {
    appendText(nodes, source.slice(cursor, match.index));

    if (match[2] && match[3]) {
      nodes.push(
        <a
          key={`${keyPrefix}-link-${index}`}
          className="markdown-inline-link"
          href={match[3]}
          target="_blank"
          rel="noreferrer noopener"
        >
          {match[2]}
        </a>
      );
    } else if (match[4]) {
      nodes.push(<code key={`${keyPrefix}-code-${index}`} className="markdown-inline-code">{match[4]}</code>);
    } else if (match[5]) {
      nodes.push(<strong key={`${keyPrefix}-strong-${index}`}>{match[5]}</strong>);
    } else if (match[6]) {
      nodes.push(<em key={`${keyPrefix}-em-${index}`}>{match[6]}</em>);
    }

    cursor = match.index + match[0].length;
    index += 1;
  }

  appendText(nodes, source.slice(cursor));
  return nodes;
}

