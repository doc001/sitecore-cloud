import { addons } from '@storybook/manager-api';
import bvcTheme from './bvc-theme';
 
addons.setConfig({
  theme: bvcTheme,
});