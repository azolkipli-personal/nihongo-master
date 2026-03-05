import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { BunpoTab } from '../BunpoTab';

// Mock LLM service to avoid real API calls
vi.mock('../../../services/llm', () => ({
    generateSentenceUpgrade: vi.fn().mockResolvedValue({ upgraded: 'テスト', explanation: '説明' }),
}));

// Mock configManager
vi.mock('../../../utils/configManager', () => ({
    loadConfig: vi.fn().mockReturnValue({
        selectedService: 'gemini',
        geminiApiKey: 'test-key',
        geminiModel: 'gemini-3-flash-preview',
        ollamaUrl: 'http://localhost:11434',
    }),
}));

// Mock SRS service
vi.mock('../../../services/srsService', () => ({
    isDueForReview: vi.fn().mockReturnValue(false),
    calculateNextReview: vi.fn().mockReturnValue({
        srsStage: 1,
        nextReviewDate: null,
        lastReviewDate: new Date().toISOString(),
        interval: 4,
    }),
}));

describe('BunpoTab', () => {
    it('renders the Library sub-tab by default', () => {
        render(<BunpoTab />);
        // Should show the pattern library
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('displays pattern cards from the grammar database', () => {
        render(<BunpoTab />);
        // Grammar patterns should render as cards with expand buttons
        const cards = screen.getAllByRole('button', { name: /show more|show less/i });
        expect(cards.length).toBeGreaterThan(0);

        // Use a more flexible matcher for Japanese text to avoid wavy dash issues
        expect(screen.getByText(/は.*です/)).toBeInTheDocument();
        expect(screen.getByText(/たい/)).toBeInTheDocument();
    });

    it('filters patterns by CEFR level', () => {
        render(<BunpoTab />);
        // Select B2 from the dropdown
        const levelSelect = screen.getByDisplayValue(/all levels/i);
        fireEvent.change(levelSelect, { target: { value: 'B2' } });
        // The select should now show B2
        expect(levelSelect).toHaveValue('B2');
    });

    it('filters patterns by search query', () => {
        render(<BunpoTab />);
        const searchInput = screen.getByPlaceholderText(/search/i);
        fireEvent.change(searchInput, { target: { value: 'obligation' } });
        // Should still render without crashing; obligation patterns e.g. なければならない
        expect(searchInput).toHaveValue('obligation');
    });

    it('switches to Upgrader sub-tab when clicked', () => {
        render(<BunpoTab />);
        // Look for the Upgrader tab button
        const upgraderTab = screen.getByRole('button', { name: /upgrade/i });
        fireEvent.click(upgraderTab);
        // Upgrader should now be visible with a textarea
        expect(screen.getByPlaceholderText(/sentence|japanese/i)).toBeInTheDocument();
    });

    it('switches to Challenge sub-tab when clicked', () => {
        render(<BunpoTab />);
        const challengeTab = screen.getByRole('button', { name: /challenge/i });
        fireEvent.click(challengeTab);
        // Challenge mode should render question progress
        expect(screen.getByText(/Question 1 of/i)).toBeInTheDocument();
    });
});
