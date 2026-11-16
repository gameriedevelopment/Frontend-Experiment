/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WEBSITE_URL?: string;
  readonly VITE_LIVE_APP_URL?: string;
  readonly VITE_TERMS_OF_SERVICE?: string;
  readonly VITE_PRIVACY_POLICY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
