import { describe, it, expect } from 'vitest';
import { buildConversationPrompt, buildUpgradePrompt } from '../llm';

describe('LLM prompt builders', () => {
    describe('buildConversationPrompt', () => {
        it('includes all provided words in the prompt', () => {
            const prompt = buildConversationPrompt(['具体的', '基本的'], 'work meeting', 'B1');
            expect(prompt).toContain('具体的');
            expect(prompt).toContain('基本的');
        });

        it('includes the scenario in the prompt', () => {
            const prompt = buildConversationPrompt(['日本語'], 'business negotiation', 'B2');
            expect(prompt).toContain('business negotiation');
        });

        it('includes the CEFR level in the prompt', () => {
            const prompt = buildConversationPrompt(['勉強'], '', 'C1');
            expect(prompt).toContain('C1');
        });

        it('uses "Daily conversation" when scenario is empty', () => {
            const prompt = buildConversationPrompt(['練習'], '', 'B1');
            expect(prompt).toContain('Daily conversation');
        });

        it('instructs to return JSON with results array', () => {
            const prompt = buildConversationPrompt(['連絡'], 'daily life', 'B1');
            expect(prompt).toContain('"results"');
        });

        it('instructs to use furigana format 漢字[ふりがな]', () => {
            const prompt = buildConversationPrompt(['確認'], '', 'B2');
            expect(prompt).toContain('漢字[ふりがな]');
        });
    });

    describe('buildUpgradePrompt', () => {
        it('includes the original sentence in the prompt', () => {
            const prompt = buildUpgradePrompt('明日終わります', 'B2');
            expect(prompt).toContain('明日終わります');
        });

        it('includes the target CEFR level in the prompt', () => {
            const prompt = buildUpgradePrompt('明日終わります', 'C1');
            expect(prompt).toContain('C1');
        });

        it('requests upgraded and explanation fields in JSON', () => {
            const prompt = buildUpgradePrompt('行きます', 'B2');
            expect(prompt).toContain('"upgraded"');
            expect(prompt).toContain('"explanation"');
        });

        it('instructs to maintain the same meaning', () => {
            const prompt = buildUpgradePrompt('手伝います', 'B2');
            expect(prompt).toContain('same meaning');
        });
    });
});
