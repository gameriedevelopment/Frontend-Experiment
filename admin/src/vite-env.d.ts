/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_PLAYER_APP_URL?: string;
  readonly VITE_ADMIN_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
