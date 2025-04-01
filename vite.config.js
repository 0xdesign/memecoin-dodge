import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true,
    host: true
  },
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
}); 