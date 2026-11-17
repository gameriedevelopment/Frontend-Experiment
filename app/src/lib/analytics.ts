declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const usesGtm = /^GTM-[A-Z0-9]+$/.test(import.meta.env.VITE_GTM_ID?.trim() ?? "");

/**
 * Reports a route view. With Tag Manager, a `virtual_page_view` event goes to the container (the event
 * the existing Gamerie container listens for); with GA alone, a page_view goes straight to GA. Only the
 * path is sent, since query strings can carry tokens and search terms. Before consent, Consent Mode
 * keeps Google from storing anything.
 */
export function trackPageView(path: string) {
  if (!window.dataLayer) return;
  const page = { page_path: path, page_location: `${window.location.origin}${path}`, page_title: document.title };
  window.dataLayer.push({ event: "virtual_page_view", ...page });
  if (!usesGtm) window.gtag?.("event", "page_view", page);
}
