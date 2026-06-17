import { build } from 'vite';
import { resolve } from 'path';

async function run() {
  console.log('Building popup...');
  // 1. Build popup (uses vite.config.ts automatically)
  await build({
    configFile: resolve('vite.config.ts'),
  });

  console.log('Building background service worker...');
  // 2. Build background service worker as a self-contained IIFE
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve('src/background/serviceWorker.ts'),
        name: 'background',
        formats: ['iife'],
      },
      rollupOptions: {
        output: {
          entryFileNames: 'background.js',
          extend: true,
        },
      },
    },
  });

  console.log('Building content observer...');
  // 3. Build content observer as a self-contained IIFE
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve('src/content/observer.ts'),
        name: 'observer',
        formats: ['iife'],
      },
      rollupOptions: {
        output: {
          entryFileNames: 'observer.js',
          extend: true,
        },
      },
    },
  });

  console.log('Build completed successfully!');
}

run().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
