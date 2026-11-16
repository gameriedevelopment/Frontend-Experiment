import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/geist-mono/index.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "lenis/dist/lenis.css";
import "./styles/theme.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
