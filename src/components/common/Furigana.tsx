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
    <span className={`${className} inline-flex items-baseline flex-wrap gap-x-0.5`}>
      {parts.map((part: any, index: number) => {
        if (part.type === 'ruby') {
          return (
            <ruby key={index} className="inline-flex flex-col-reverse items-center align-bottom px-1 group">
              <span className="text-gray-900 leading-none">{part.content}</span>
              <rt className="text-[10px] text-blue-600 font-bold leading-none mb-1 select-none text-center w-full block">
                {part.furigana}
              </rt>
            </ruby>
          );
        }
        return <span key={index} className="text-gray-900">{part.content}</span>;
      })}
    </span>
  );
}
