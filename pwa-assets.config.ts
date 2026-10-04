import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Erzeugt aus public/icon.svg alle PNG-Icons:  npm run icons
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#1d3328' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#1d3328' } },
  },
  images: ['public/icon.svg'],
});
