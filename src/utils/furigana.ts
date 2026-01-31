export function parseFurigana(text: string): Array<{ type: 'text' | 'ruby'; content: string; furigana?: string }> {
  const result: Array<{ type: 'text' | 'ruby'; content: string; furigana?: string }> = [];
  const regex = /([^\[]+)\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      result.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add the ruby element
    result.push({
      type: 'ruby',
      content: match[1],
      furigana: match[2],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return result;
}

export function renderWithFurigana(text: string): string {
  return text.replace(/([^\[]+)\[([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
}

export function stripFurigana(text: string): string {
  return text.replace(/\[([^\]]+)\]/g, '');
}

export function extractKanji(text: string): string[] {
  const kanjiRegex = /[\u4e00-\u9faf]/g;
  const matches = text.match(kanjiRegex);
  return matches ? [...new Set(matches)] : [];
}

export function hasKanji(text: string): boolean {
  return /[\u4e00-\u9faf]/.test(text);
}
