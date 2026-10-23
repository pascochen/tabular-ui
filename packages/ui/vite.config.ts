import { cpSync, mkdirSync } from 'node:fs';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import pkg from './package.json' with { type: 'json' };

const dirname = import.meta.dirname;

// Everything the package depends on stays an import, resolved by the
// consuming app: bundling React or Base UI in would give the app a second
// copy, and a second React breaks hooks while a second Phosphor breaks the
// IconContext that Button uses to set icon weight (§11.2).
const external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];
const isExternal = (id: string) => external.some((dep) => id === dep || id.startsWith(`${dep}/`));

export default defineConfig({
  plugins: [
    react(),
    {
      // The CSS ships as source, not compiled: it is Tailwind v4 input
      // (@import 'tailwindcss', @theme, @custom-variant), and the consuming
      // app's Tailwind compiles it with that app's own class list.
      name: 'tui:copy-css',
      closeBundle() {
        mkdirSync(path.join(dirname, 'dist/styles'), { recursive: true });
        cpSync(path.join(dirname, 'src/index.css'), path.join(dirname, 'dist/index.css'));
        for (const file of ['theme.css', 'palette.css', 'shadcn.css']) {
          cpSync(path.join(dirname, 'src/styles', file), path.join(dirname, 'dist/styles', file));
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    // Readable output: the class strings Tailwind scans in dist/ stay whole,
    // and a stack trace in a consuming app reads like the source.
    minify: false,
    lib: {
      entry: path.join(dirname, 'src/index.ts'),
      formats: ['es'],
    },
    rolldownOptions: {
      external: isExternal,
      output: {
        // One file per module, so an app's bundler drops the components it
        // never imports.
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
  },
});
