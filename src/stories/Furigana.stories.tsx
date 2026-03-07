import type { Meta, StoryObj } from '@storybook/react';
import { Furigana } from '../components/common/Furigana';

const meta: Meta<typeof Furigana> = {
  title: 'Components/Furigana',
  component: Furigana,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    showFurigana: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Furigana>;

export const Default: Story = {
  args: {
    text: '日本語[にほんご]',
    showFurigana: true,
  },
};

export const WithoutFurigana: Story = {
  args: {
    text: '日本語[にほんご]',
    showFurigana: false,
  },
};

export const MultipleWords: Story = {
  args: {
    text: '私[わたし]は学生[がくせい]です',
    showFurigana: true,
  },
};

export const NoFuriganaText: Story = {
  args: {
    text: 'こんにちは',
    showFurigana: true,
  },
};

export const LongText: Story = {
  args: {
    text: '今日[きょう]は良い[いい]天気[てんき]ですね',
    showFurigana: true,
  },
};

export const EmptyText: Story = {
  args: {
    text: '',
    showFurigana: true,
  },
};
