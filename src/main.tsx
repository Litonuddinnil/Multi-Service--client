import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';

import { router } from './router/router';
import { AuthProvider } from './provider/AuthProvider';
import { LanguageProvider } from './provider/LanguageProvider';
import { NotificationProvider } from './provider/NotificationProvider';
import { CartProvider } from './provider/CartProvider';
import { ToastProvider } from './components/common/Toast';
import { loadMockSeeds } from './services/mockSeed';
import { StorageService } from './services/storage';

// Expose a few build-time switches as a runtime global so the register page
// can decide whether to surface the dev-only "Admin" tile. Vite injects the
// value at build time; default is `true` so local dev keeps working out of
// the box without extra config.
(window as any).__ALLOW_SELF_SERVICE_ADMIN__ =
  String(import.meta.env.VITE_ALLOW_SELF_SERVICE_ADMIN ?? 'true').toLowerCase() === 'true';

const app = (
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>
          <NotificationProvider>
            <CartProvider>
              <RouterProvider router={router} />
            </CartProvider>
          </NotificationProvider>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>
);

// `StorageService` reads its fixtures synchronously, so the JSON in
// `public/mock/` has to be in memory before the first render. `loadMockSeeds`
// never rejects — a failed fetch degrades that collection to `[]` and logs.
loadMockSeeds().then(() => {
  StorageService.syncSeedFixtures();
  createRoot(document.getElementById('root')!).render(app);
});

