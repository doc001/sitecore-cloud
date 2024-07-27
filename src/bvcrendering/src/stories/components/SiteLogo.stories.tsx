import type { Meta, StoryObj } from '@storybook/react';
import { Default as SiteLogo } from 'src/components/SiteLogo';

const meta = {
  title: 'components/SiteLogo',
  component: SiteLogo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SiteLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rendering: {
      componentName: 'SiteLogo',
      datasource: 'truthyValue',
      params: {
        RenderingIdentifier: 'SiteLogoRenderingIdentifier',
      },
    },
    params: {
      styles: '',
    },
  },
};
