declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Reports a route view to GTM or GA. Only the path is sent; query strings can carry tokens and search
 * terms. Before consent, Consent Mode keeps Google from storing anything.
 */
export function trackPageView(path: string) {
  if (!window.dataLayer) return;
  const page = { page_path: path, page_location: `${window.location.origin}${path}`, page_title: document.title };
  window.dataLayer.push({ event: "page_view", ...page });
  window.gtag?.("event", "page_view", page);
}
