/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_WEBSITE_URL?: string;
  readonly VITE_TERMS_OF_SERVICE?: string;
  readonly VITE_PRIVACY_POLICY?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_LICHESS_CLIENT_ID?: string;
  readonly VITE_ENZUZO_ID?: string;
  readonly VITE_GTM_ID?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
