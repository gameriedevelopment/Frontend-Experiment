import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/geist-mono/index.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./styles/theme.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { SessionBoundary } from "./features/auth/SessionBoundary";
import { isSessionError } from "./lib/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !isSessionError(error) && failureCount < 1,
    },
    mutations: { retry: 0 },
  },
});

const root = document.getElementById("root");
if (!root) throw new Error("App root element was not found");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <SessionBoundary />
        <App />
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
