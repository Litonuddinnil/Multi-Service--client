import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    build: {
      // Default is 500. The ONLY chunk above it is ThreeCanvas3D (~505 kB),
      // which is Three.js itself: `WebGLRenderer` and its shaders are the bulk
      // and there is no smaller entry point, so 500 is unreachable while the
      // 3D background exists. It is lazy — `LazyThreeCanvas3D` is the sole
      // importer and it only mounts on Login and Register — so it costs
      // nothing on first paint of any other route.
      //
      // Deliberately 520, not 2000: if a SECOND chunk ever trips this, that is
      // a real regression and the build should say so.
      chunkSizeWarningLimit: 520,
      rollupOptions: {
        output: {
          // Split by vendor so a release touching only app code leaves these
          // cached.
          //
          // NOTE the omissions. Naming a package here pulls its ENTIRE module
          // graph into that chunk, which silently disables tree-shaking for it:
          // `three: ['three']` shipped all 514 kB of Three.js even though the
          // canvas imports 17 symbols. Leaving a package out lets Rollup keep
          // only what is reachable and co-locate it with the lazy route that
          // pulled it in. That is why `three` is absent.
          //
          // jspdf and html2canvas are listed SEPARATELY rather than as one
          // `pdf` chunk: together they were a single 594 kB file, and they are
          // needed at different moments (html2canvas only for the DOM-capture
          // path).
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/auth'],
            jspdf: ['jspdf'],
            html2canvas: ['html2canvas'],
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
