import type { Meta, StoryObj } from '@storybook/react';
import { Header } from '../components/common/Header';
import { ThemeProvider } from '../utils/ThemeContext';

const meta: Meta<typeof Header> = {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Header>;

const HeaderWithTheme = (args: { onOpenSettings: () => void }) => {
  return (
    <ThemeProvider>
      <Header {...args} />
    </ThemeProvider>
  );
};

export const Default: Story = {
  render: (args) => <HeaderWithTheme {...args} />,
  args: {
    onOpenSettings: () => console.log('Settings opened'),
  },
};

export const SettingsOpen: Story = {
  render: (args) => <HeaderWithTheme {...args} />,
  args: {
    onOpenSettings: () => alert('Settings clicked!'),
  },
};
