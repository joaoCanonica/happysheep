import { defineConfig } from "vite";
import siteData from "./scripts/site-data-plugin.mjs";

export default defineConfig({
  plugins: [siteData()],
  build: {
    rollupOptions: {
      // review.html é a página do QR code do balcão (/review com cleanUrls).
      input: { main: "index.html", review: "review.html" },
    },
  },
});
