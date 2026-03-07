import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { AlertTriangle } from 'lucide-react';

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

export const Default: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-8 text-center">
        <p className="text-gray-600">This component has no errors</p>
      </div>
    </ErrorBoundary>
  ),
};

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <button
        onClick={() => {
          throw new Error('Test error thrown by user');
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Throw Error
      </button>
    </ErrorBoundary>
  ),
};

export const WithCustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-yellow-700">Custom error message here</p>
        </div>
      }
    >
      <button
        onClick={() => {
          throw new Error('Custom fallback shown');
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Throw Error
      </button>
    </ErrorBoundary>
  ),
};
