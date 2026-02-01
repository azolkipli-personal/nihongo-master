import { parseFurigana } from '../../utils/furigana';

interface FuriganaProps {
  text: string;
  className?: string;
  showFurigana?: boolean;
}

export function Furigana({ text, className = '', showFurigana = true }: FuriganaProps) {
  if (!showFurigana) {
    // Strip furigana and just show kanji
    return <span className={className}>{text.replace(/\[[^\]]+\]/g, '')}</span>;
  }

  const parts = parseFurigana(text);

  return (
    <span className={className}>
      {parts.map((part: any, index: number) => {
        if (part.type === 'ruby') {
          return (
            <ruby key={index} className="furigana-text">
              {part.content}
              <rt className="text-xs text-gray-500">{part.furigana}</rt>
            </ruby>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
}
