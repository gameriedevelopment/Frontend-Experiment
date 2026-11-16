declare global {
  interface Window {
    __enzuzoApi?: { prefCenter?: { show?: () => void } };
  }
}

export const hasCookiePreferences = Boolean(import.meta.env.VITE_ENZUZO_ID?.trim());

export function openCookiePreferences() {
  window.__enzuzoApi?.prefCenter?.show?.();
}
