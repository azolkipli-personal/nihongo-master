import type { Meta, StoryObj } from '@storybook/react';
import { ToggleButton } from '../components/common/ToggleButton';

const meta: Meta<typeof ToggleButton> = {
  title: 'Components/ToggleButton',
  component: ToggleButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    active: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleButton>;

export const Default: Story = {
  args: {
    label: 'Toggle Me',
    active: false,
    disabled: false,
  },
};

export const Active: Story = {
  args: {
    label: 'Active State',
    active: true,
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    active: false,
    disabled: true,
  },
};
