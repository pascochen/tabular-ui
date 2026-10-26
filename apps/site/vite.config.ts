import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  server: {
    // As in apps/demo: Vite ignores PORT unless the config reads it, so a
    // preview launcher that assigns a port would otherwise be ignored.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
});
