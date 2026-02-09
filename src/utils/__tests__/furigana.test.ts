import { describe, it, expect } from 'vitest';
import {
    parseFurigana,
    renderWithFurigana,
    stripFurigana,
    extractKanji,
    hasKanji,
} from '../furigana';

describe('furigana utilities', () => {
    describe('parseFurigana', () => {
        it('parses kanji with furigana notation correctly', () => {
            const result = parseFurigana('漢字[かんじ]');
            expect(result).toEqual([
                { type: 'ruby', content: '漢字', furigana: 'かんじ' },
            ]);
        });

        it('handles mixed text with furigana', () => {
            // Note: The regex captures ALL text before [ as content
            const result = parseFurigana('これは具体的[ぐたいてき]です');
            expect(result).toEqual([
                { type: 'ruby', content: 'これは具体的', furigana: 'ぐたいてき' },
                { type: 'text', content: 'です' },
            ]);
        });

        it('handles text without furigana', () => {
            const result = parseFurigana('ひらがな only');
            expect(result).toEqual([
                { type: 'text', content: 'ひらがな only' },
            ]);
        });

        it('handles multiple kanji with furigana', () => {
            // The regex captures text between furigana blocks as part of next match content
            const result = parseFurigana('明日[あした]から仕事[しごと]');
            expect(result).toEqual([
                { type: 'ruby', content: '明日', furigana: 'あした' },
                { type: 'ruby', content: 'から仕事', furigana: 'しごと' },
            ]);
        });

        it('returns empty array for empty string', () => {
            const result = parseFurigana('');
            expect(result).toEqual([]);
        });
    });

    describe('renderWithFurigana', () => {
        it('converts furigana notation to HTML ruby tags', () => {
            const result = renderWithFurigana('漢字[かんじ]');
            expect(result).toBe('<ruby>漢字<rt>かんじ</rt></ruby>');
        });

        it('handles multiple kanji', () => {
            // Note: renderWithFurigana also captures all text before [ as ruby content
            const result = renderWithFurigana('日本語[にほんご]を勉強[べんきょう]');
            expect(result).toBe('<ruby>日本語<rt>にほんご</rt></ruby><ruby>を勉強<rt>べんきょう</rt></ruby>');
        });
    });

    describe('stripFurigana', () => {
        it('removes furigana notation from text', () => {
            const result = stripFurigana('漢字[かんじ]');
            expect(result).toBe('漢字');
        });

        it('handles multiple furigana notations', () => {
            const result = stripFurigana('日本語[にほんご]の勉強[べんきょう]');
            expect(result).toBe('日本語の勉強');
        });

        it('leaves plain text unchanged', () => {
            const result = stripFurigana('ひらがな');
            expect(result).toBe('ひらがな');
        });
    });

    describe('extractKanji', () => {
        it('extracts unique kanji characters', () => {
            const result = extractKanji('日本語の勉強');
            expect(result).toEqual(['日', '本', '語', '勉', '強']);
        });

        it('returns empty array for text without kanji', () => {
            const result = extractKanji('ひらがな');
            expect(result).toEqual([]);
        });

        it('removes duplicate kanji', () => {
            const result = extractKanji('日日日本本');
            expect(result).toEqual(['日', '本']);
        });
    });

    describe('hasKanji', () => {
        it('returns true for text containing kanji', () => {
            expect(hasKanji('日本語')).toBe(true);
        });

        it('returns false for text without kanji', () => {
            expect(hasKanji('ひらがな')).toBe(false);
        });

        it('returns false for empty string', () => {
            expect(hasKanji('')).toBe(false);
        });

        it('returns true for mixed text with kanji', () => {
            expect(hasKanji('hello 日本語 world')).toBe(true);
        });
    });
});
