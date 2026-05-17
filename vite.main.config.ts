import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      // sql.js must not be bundled — the WASM file is resolved at runtime
      external: ['sql.js'],
    },
  },
});
