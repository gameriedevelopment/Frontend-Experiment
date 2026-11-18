import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/geist-mono/index.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "lenis/dist/lenis.css";
import "./styles/theme.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { links } from "./config/links";

// The cookie banner links to these paths on this site; the policies themselves live on the legal site.
const legalPages: Record<string, string> = {
  "/privacy-policy": links.privacy,
  "/privacy": links.privacy,
  "/cookie-policy": links.cookies,
  "/cookies": links.cookies,
  "/terms": links.terms,
  "/terms-of-service": links.terms,
};
const legalPage = legalPages[window.location.pathname.replace(/\/+$/, "").toLowerCase()];

if (legalPage) {
  window.location.replace(legalPage);
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
