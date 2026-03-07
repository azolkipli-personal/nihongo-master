import type { Meta, StoryObj } from '@storybook/react';
import { TabNavigation } from '../components/common/TabNavigation';
import type { TabType } from '../types';
import { useState } from 'react';

const meta: Meta<typeof TabNavigation> = {
  title: 'Components/TabNavigation',
  component: TabNavigation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TabNavigation>;

const TabNavigationWrapper = ({ activeTab }: { activeTab: TabType }) => {
  const [tab, setTab] = useState<TabType>(activeTab);
  return <TabNavigation activeTab={tab} onTabChange={setTab} />;
};

export const KaiwaActive: Story = {
  render: () => <TabNavigationWrapper activeTab="kaiwa" />,
};

export const BunpoActive: Story = {
  render: () => <TabNavigationWrapper activeTab="bunpo" />,
};

export const TangoActive: Story = {
  render: () => <TabNavigationWrapper activeTab="tango" />,
};

export const ShinchokuActive: Story = {
  render: () => <TabNavigationWrapper activeTab="shinchoku" />,
};
