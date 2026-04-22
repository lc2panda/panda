import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'dist-electron/**'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
