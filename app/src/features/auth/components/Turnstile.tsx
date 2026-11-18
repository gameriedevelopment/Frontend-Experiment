import { useCallback, useEffect, useRef, useState } from "react";

const scriptSource = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      theme: "dark";
      appearance: "interaction-only";
    },
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __gamerieTurnstileScript?: Promise<void>;
  }
}

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (window.__gamerieTurnstileScript) return window.__gamerieTurnstileScript;
  window.__gamerieTurnstileScript = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptSource}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile failed to load")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = scriptSource;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(script);
  });
  return window.__gamerieTurnstileScript;
}

export function useTurnstile() {
  const required = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [round, setRound] = useState(0);
  const onVerify = useCallback((value: string) => {
    setToken(value);
    setFailed(false);
  }, []);
  const onExpire = useCallback(() => setToken(null), []);
  const onError = useCallback(() => setFailed(true), []);
  // Tokens are single use, so each submission needs a fresh widget.
  const renew = useCallback(() => {
    setToken(null);
    setFailed(false);
    setRound((value) => value + 1);
  }, []);

  return {
    required,
    token,
    failed,
    // If verification can't load, don't trap people on a dead button; the API still checks.
    blocking: required && !token && !failed,
    renew,
    widget: { resetKey: round, onVerify, onExpire, onError },
  };
}

export function Turnstile({
  resetKey = 0,
  onVerify,
  onExpire,
  onError,
}: {
  resetKey?: number;
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError?: () => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const verifiedRef = useRef(false);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !elementRef.current) return;
    let cancelled = false;
    verifiedRef.current = false;
    const element = elementRef.current;
    const handleError = () => {
      onExpire();
      onError?.();
    };
    // Fail open if the widget never resolves (e.g. its script is blocked or the
    // site key isn't allowed on this host): don't leave the form trapped.
    const timeout = window.setTimeout(() => {
      if (!cancelled && !verifiedRef.current) onError?.();
    }, 8000);
    loadTurnstile()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        widgetRef.current = window.turnstile.render(element, {
          sitekey: siteKey,
          theme: "dark",
          appearance: "interaction-only",
          callback: (token: string) => {
            verifiedRef.current = true;
            window.clearTimeout(timeout);
            onVerify(token);
          },
          "expired-callback": onExpire,
          "error-callback": handleError,
        });
      })
      .catch(handleError);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current);
    };
  }, [onError, onExpire, onVerify, resetKey, siteKey]);

  if (!siteKey) return null;
  return <div ref={elementRef} className="empty:hidden" />;
}
