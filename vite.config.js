import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const basePath = process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/GameLetter/' : '/');

export default defineConfig({
  plugins: [react()],
  base: basePath
});
