import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { siteHead } from "./plugins/site-head";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [
      react(),
      siteHead({
        siteUrl: env.VITE_SITE_URL || "https://gamerie.gg",
        indexable: env.VITE_SITE_INDEXABLE === "true",
        shareImage: {
          path: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Gamerie: your game, on the record.",
        },
        enzuzoId: env.VITE_ENZUZO_ID,
        gtmId: env.VITE_GTM_ID,
        gaMeasurementId: env.VITE_GA_MEASUREMENT_ID,
      }),
    ],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
  };
});
