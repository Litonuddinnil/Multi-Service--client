import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // Everything shipped as one 2.5 MB chunk before this, so a visitor
          // downloaded Three.js, Firebase and the PDF stack to see the home page.
          // Splitting by vendor also means a release that only touches app code
          // leaves these cached.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            three: ['three'],
            firebase: ['firebase/app', 'firebase/auth'],
            pdf: ['jspdf', 'html2canvas'],
            motion: ['motion/react'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Keep this in sync with the PORT default in `server/server.ts` and
      // `server/index.ts` so the SPA talks to the right origin during
      // `npm run dev`.
      //
      // Note: this port only applies to `npm run dev:client-only`. The normal
      // `npm run dev` path runs Vite in middleware mode inside the Express
      // server, where Vite never opens a listener of its own and the server's
      // PORT is what actually binds.
      //
      // Some Windows machines reserve a block covering 5173 (5167–5594) for
      // Hyper-V/WSL port forwarding, which makes `listen` fail with EACCES
      // even though nothing owns the port. We default to 4174 to stay below
      // that block. Check with
      // `netsh interface ipv4 show excludedportrange protocol=tcp` and move
      // this (plus the two server defaults) outside any listed range if so.
      port: 4174,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
