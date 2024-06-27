import React from 'react';
import { StoryObj, Meta } from '@storybook/react';

import ContentBlock from '../components/ContentBlock';


const meta: Meta<typeof ContentBlock> = {
  component: ContentBlock,
};

export default meta;
type Story = StoryObj<typeof ContentBlock>;

export const Primary: Story = {
  args: {
    primary: true,
    label: 'ContentBlock',
    params: {
      name: 'ContentBlock',
    },
    rendering: {
      uid: '{00000000-0000-0000-0000-000000000000}',
      componentName: 'ContentBlock',
    },
    fields: {
      heading: {
        value: 'Heading',
      },
      content: {
        value: 'Content',
      },
    },
  },
};