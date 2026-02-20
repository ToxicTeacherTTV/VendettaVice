import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  test: {
    // Run only files under src/logic/__tests__ — Phaser scenes are excluded by design.
    include: ['src/logic/__tests__/**/*.test.js'],
    environment: 'node',
  },
});
