// ../client/vite.config.ts
import tailwindcss from "file:///D:/university/Project/Multi-Services/client/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///D:/university/Project/Multi-Services/client/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { defineConfig } from "file:///D:/university/Project/Multi-Services/client/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "D:\\university\\Project\\Multi-Services\\client";
var vite_config_default = defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, ".")
      }
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
      // Some Windows machines reserve a block covering 5173 for Hyper-V/WSL
      // port forwarding, which makes `listen` fail with EACCES/EADDRINUSE even
      // though nothing owns the port. Check with
      // `netsh interface ipv4 show excludedportrange protocol=tcp` and move
      // this (plus the two server defaults) outside any listed range if so.
      port: 5173,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {}
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vY2xpZW50L3ZpdGUuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcdW5pdmVyc2l0eVxcXFxQcm9qZWN0XFxcXE11bHRpLVNlcnZpY2VzXFxcXGNsaWVudFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcdW5pdmVyc2l0eVxcXFxQcm9qZWN0XFxcXE11bHRpLVNlcnZpY2VzXFxcXGNsaWVudFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovdW5pdmVyc2l0eS9Qcm9qZWN0L011bHRpLVNlcnZpY2VzL2NsaWVudC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQge2RlZmluZUNvbmZpZ30gZnJvbSAndml0ZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoKSA9PiB7XG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4nKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIC8vIEtlZXAgdGhpcyBpbiBzeW5jIHdpdGggdGhlIFBPUlQgZGVmYXVsdCBpbiBgc2VydmVyL3NlcnZlci50c2AgYW5kXG4gICAgICAvLyBgc2VydmVyL2luZGV4LnRzYCBzbyB0aGUgU1BBIHRhbGtzIHRvIHRoZSByaWdodCBvcmlnaW4gZHVyaW5nXG4gICAgICAvLyBgbnBtIHJ1biBkZXZgLlxuICAgICAgLy9cbiAgICAgIC8vIE5vdGU6IHRoaXMgcG9ydCBvbmx5IGFwcGxpZXMgdG8gYG5wbSBydW4gZGV2OmNsaWVudC1vbmx5YC4gVGhlIG5vcm1hbFxuICAgICAgLy8gYG5wbSBydW4gZGV2YCBwYXRoIHJ1bnMgVml0ZSBpbiBtaWRkbGV3YXJlIG1vZGUgaW5zaWRlIHRoZSBFeHByZXNzXG4gICAgICAvLyBzZXJ2ZXIsIHdoZXJlIFZpdGUgbmV2ZXIgb3BlbnMgYSBsaXN0ZW5lciBvZiBpdHMgb3duIGFuZCB0aGUgc2VydmVyJ3NcbiAgICAgIC8vIFBPUlQgaXMgd2hhdCBhY3R1YWxseSBiaW5kcy5cbiAgICAgIC8vXG4gICAgICAvLyBTb21lIFdpbmRvd3MgbWFjaGluZXMgcmVzZXJ2ZSBhIGJsb2NrIGNvdmVyaW5nIDUxNzMgZm9yIEh5cGVyLVYvV1NMXG4gICAgICAvLyBwb3J0IGZvcndhcmRpbmcsIHdoaWNoIG1ha2VzIGBsaXN0ZW5gIGZhaWwgd2l0aCBFQUNDRVMvRUFERFJJTlVTRSBldmVuXG4gICAgICAvLyB0aG91Z2ggbm90aGluZyBvd25zIHRoZSBwb3J0LiBDaGVjayB3aXRoXG4gICAgICAvLyBgbmV0c2ggaW50ZXJmYWNlIGlwdjQgc2hvdyBleGNsdWRlZHBvcnRyYW5nZSBwcm90b2NvbD10Y3BgIGFuZCBtb3ZlXG4gICAgICAvLyB0aGlzIChwbHVzIHRoZSB0d28gc2VydmVyIGRlZmF1bHRzKSBvdXRzaWRlIGFueSBsaXN0ZWQgcmFuZ2UgaWYgc28uXG4gICAgICBwb3J0OiA1MTczLFxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICAgIC8vIEhNUiBpcyBkaXNhYmxlZCBpbiBBSSBTdHVkaW8gdmlhIERJU0FCTEVfSE1SIGVudiB2YXIuXG4gICAgICAvLyBEbyBub3QgbW9kaWZ5XHUyMDE0ZmlsZSB3YXRjaGluZyBpcyBkaXNhYmxlZCB0byBwcmV2ZW50IGZsaWNrZXJpbmcgZHVyaW5nIGFnZW50IGVkaXRzLlxuICAgICAgaG1yOiBwcm9jZXNzLmVudi5ESVNBQkxFX0hNUiAhPT0gJ3RydWUnLFxuICAgICAgLy8gRGlzYWJsZSBmaWxlIHdhdGNoaW5nIHdoZW4gRElTQUJMRV9ITVIgaXMgdHJ1ZSB0byBzYXZlIENQVSBkdXJpbmcgYWdlbnQgZWRpdHMuXG4gICAgICB3YXRjaDogcHJvY2Vzcy5lbnYuRElTQUJMRV9ITVIgPT09ICd0cnVlJyA/IG51bGwgOiB7fSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZULE9BQU8saUJBQWlCO0FBQ3JWLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUSxvQkFBbUI7QUFIM0IsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLE1BQU07QUFDaEMsU0FBTztBQUFBLElBQ0wsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxJQUNoQyxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxHQUFHO0FBQUEsTUFDbEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BZU4sTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBO0FBQUE7QUFBQSxNQUdaLEtBQUssUUFBUSxJQUFJLGdCQUFnQjtBQUFBO0FBQUEsTUFFakMsT0FBTyxRQUFRLElBQUksZ0JBQWdCLFNBQVMsT0FBTyxDQUFDO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
