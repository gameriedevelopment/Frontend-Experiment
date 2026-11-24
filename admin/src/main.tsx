import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/geist-mono/index.css";
import "./styles/theme.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/Toaster";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 20_000, refetchOnWindowFocus: true },
    mutations: { retry: 0 },
  },
});

const loadMotionFeatures = () => import("./lib/motionFeatures").then((module) => module.default);

const root = document.getElementById("root");
if (!root) throw new Error("Admin root element was not found");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadMotionFeatures}>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
            <Toaster />
          </BrowserRouter>
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  </StrictMode>,
);
