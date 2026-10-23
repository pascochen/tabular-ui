import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Vite does not read PORT on its own — verified: with PORT set it still
    // binds its own default. Any host that assigns a port (a preview
    // launcher, a container, a CI harness) is therefore ignored unless the
    // config reads it here. Falls through to Vite's default when unset, so
    // `pnpm dev` is unchanged.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
  // No optimizeDeps entry for tabular-ui. Linked through the workspace, it is
  // already served as source and a rebuild by `pnpm dev` reaches the page.
  // Excluding it (as when this app compiled packages/ui/src) hid its imports
  // from Vite's first scan: Base UI and the rest were found mid-load and
  // re-optimized under the open page, which then failed with "does not
  // provide an export named 't'".
});
