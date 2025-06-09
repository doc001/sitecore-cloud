import flowbite from 'flowbite-react/tailwind'
import type { Config } from 'tailwindcss'
import brand from '@/lib/config/colors';

const config: Config = {
  content: [
    "./src/app/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    flowbite.content(),
  ],
  theme: {
    backgroundSize: {
      'auto': 'auto',
      'cover': 'cover',
      'contain': 'contain',
      '50%': '50%',
      '16': '4rem',
    },
    extend: {
      backgroundColor: {
        'navy-100': brand.colors.navy[100],
        'navy-200': brand.colors.navy[200],

      },
      fontFamily: {
        'sans': ['Poppins'],
        'serif': ['Bitter'],
      }
    },
  },
  plugins: [
    //
    flowbite.plugin(),
  ],
};
export default config;
