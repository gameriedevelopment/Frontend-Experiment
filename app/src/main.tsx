import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/geist-mono/index.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./styles/theme.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/Toaster";
import { SessionBoundary } from "./features/auth/SessionBoundary";
import { isSessionError } from "./lib/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !isSessionError(error) && failureCount < 1,
      // Queries without their own staleTime don't refetch on every focus and remount.
      staleTime: 20_000,
    },
    mutations: { retry: 0 },
  },
});

// Animation features download alongside the first screen instead of inside it.
const loadMotionFeatures = () => import("./lib/motionFeatures").then((module) => module.default);

const root = document.getElementById("root");
if (!root) throw new Error("App root element was not found");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadMotionFeatures}>
        <MotionConfig reducedMotion="user">
          <SessionBoundary />
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
          <Toaster />
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  </StrictMode>,
);
