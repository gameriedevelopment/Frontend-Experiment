/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL?: string;
  readonly VITE_DISCORD_INVITE_LINK?: string;
  readonly VITE_PARTNERS_PAGE?: string;
  readonly VITE_X_URL?: string;
  readonly VITE_INSTAGRAM_URL?: string;
  readonly VITE_TIKTOK_URL?: string;
  readonly VITE_YOUTUBE_URL?: string;
  readonly VITE_LINKEDIN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
