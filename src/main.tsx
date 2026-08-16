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

createRoot(document.getElementById('root')!).render(
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
  </StrictMode>,
);

