import React from 'react';
import { LayoutServicePageState, SitecoreContext } from '@sitecore-jss/sitecore-jss-nextjs';
import { componentBuilder } from '../src/temp/componentBuilder';
import type { Preview, StoryFn } from '@storybook/react';
import { withThemeByDataAttribute } from '@storybook/addon-themes';

import '../src/styles/globals.css';


export const mockLayoutData = {
  sitecore: {
    context: {
      pageEditing: false,
      pageState: LayoutServicePageState.Normal,
    },
    setContext: () => {
      // nothing
    },
    route: null,
  },
};

const preview: Preview = {
  parameters: {
    // actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-mode',
    }),
    (Story) => (
      <SitecoreContext
        componentFactory={componentBuilder.getComponentFactory({ isEditing: mockLayoutData.sitecore.context.pageEditing })}
        layoutData={mockLayoutData}
      >
        <Story />
      </SitecoreContext>
    ),
  ],

  tags: ['autodocs']
};

export default preview;