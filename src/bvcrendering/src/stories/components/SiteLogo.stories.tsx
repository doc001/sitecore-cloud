import type { Meta, StoryObj } from '@storybook/react';
import { SiteLogo } from 'src/components/SiteLogo';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'components/SiteLogo',
  component: SiteLogo,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
} satisfies Meta<typeof SiteLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    params: {
      RenderingIdentifier: 'Dummy',
      styles: '',
    },
    fields: {
      siteLogoImage: {
        value: 'SiteLogo',
      },
      siteLogoCaption: {
        value: 'Bow Valley Logo',
      },
      siteLogoLink: {
        value: {
          href: 'https://bowvalleycollege.ca',
        },
      },
    },
  },
};
