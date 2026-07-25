import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Inköpslistan",
        short_name: "Inköp",
        description: "Familjens delade inköpslista",
        theme_color: "#2e7d32",
        background_color: "#f5f5f5",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        runtimeCaching: [
          {
            // Offline read of the last-known data; never cache mutations.
            urlPattern: /\/api\/(getFoodItems|getStores|getList)/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-reads",
              expiration: { maxEntries: 10, maxAgeSeconds: 3600 },
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern:
              /\/api\/(storeFoodItem|updateFoodItem|deleteFoodItem|storeStore|updateStore|deleteStore|addListItem|updateListItem|deleteListItem|clearChecked|activate)/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  server: {
    port: 3004,
    proxy: {
      "/api": {
        target: "http://localhost:7071",
        changeOrigin: true,
      },
    },
  },
});
