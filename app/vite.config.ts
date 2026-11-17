import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { analytics } from "./plugins/analytics";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [react(), analytics({ enzuzoId: env.VITE_ENZUZO_ID, gtmId: env.VITE_GTM_ID, gaMeasurementId: env.VITE_GA_MEASUREMENT_ID })],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      // Local development calls the API through this origin, so backend CORS lists don't need the dev port.
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:8000",
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (request) => request.removeHeader("origin"));
          },
        },
        // Realtime (socket.io) for messages and notifications, on the same origin as the API.
        "/socket.io": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:8000",
          changeOrigin: true,
          ws: true,
          configure: (proxy) => {
            proxy.on("proxyReqWs", (request) => request.removeHeader("origin"));
            proxy.on("proxyReq", (request) => request.removeHeader("origin"));
          },
        },
      },
    },
  };
});
