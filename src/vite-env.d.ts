/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_apiKey?: string;
  readonly VITE_authDomain?: string;
  readonly VITE_projectId?: string;
  readonly VITE_storageBucket?: string;
  readonly VITE_messagingSenderId?: string;
  readonly VITE_appId?: string;
  /** When `true`, the register page shows an "Admin" tile and the server is
   *  expected to have been started with `ALLOW_SELF_SERVICE_ADMIN=true`.
   *  Defaults to `true` so the dev experience matches local server config. */
  readonly VITE_ALLOW_SELF_SERVICE_ADMIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
