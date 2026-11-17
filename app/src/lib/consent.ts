declare global {
  interface Window {
    __enzuzoApi?: { prefCenter?: { show: (options?: unknown) => void } };
  }
}

/** True when the Enzuzo consent banner is configured for this build. */
export const cookiePreferencesEnabled = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
  import.meta.env.VITE_ENZUZO_ID?.trim() ?? "",
);

/**
 * Opens Enzuzo's preference centre. The app hides Enzuzo's floating button (it sits on the sidebar and the
 * phone dock), so Settings and the sign-in footer call this instead; consent stays one tap away.
 */
export function openCookiePreferences() {
  if (window.__enzuzoApi?.prefCenter) return window.__enzuzoApi.prefCenter.show();
  document.querySelector<HTMLElement>('[id$="-cookie-manager-button"]')?.click();
}
