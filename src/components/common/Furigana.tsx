import { parseFurigana } from '../../utils/furigana';

interface FuriganaProps {
  text: string;
  className?: string;
  showFurigana?: boolean;
}

export function Furigana({ text = '', className = '', showFurigana = true }: FuriganaProps) {
  if (!text) return null;

  if (!showFurigana) {
    // Strip furigana and just show kanji
    return <span className={className}>{text.replace(/\[[^\]]+\]/g, '')}</span>;
  }

  const parts = parseFurigana(text);

  return (
    <span className={`${className} leading-relaxed`}>
      {parts.map((part: any, index: number) => {
        if (part.type === 'ruby') {
          return (
            <ruby key={index} className="ruby-base">
              {part.content}
              <rt className="text-[10px] text-blue-600 font-bold select-none text-center">
                {part.furigana}
              </rt>
            </ruby>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
}
