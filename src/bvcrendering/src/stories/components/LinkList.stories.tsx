import type { Meta, StoryObj } from '@storybook/react';
import { Default as LinkList } from 'src/components/LinkList';

const meta = {
  title: 'components/LinkList',
  component: LinkList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LinkList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rendering: {
      componentName: 'LinkList',
      datasource: 'truthyValue',
      params: {
        RenderingIdentifier: 'LinkListRenderingIdentifier',
      },
    },
    params: {
      styles: '',
    },
  },
};
