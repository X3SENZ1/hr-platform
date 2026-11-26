import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base keeps the build portable: it works on GitHub Pages,
// in a sub-folder and when opening the build from a static server.
export default defineConfig({
  plugins: [react()],
  base: './',
});
