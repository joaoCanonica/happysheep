import { defineConfig } from "vite";
import siteData from "./scripts/site-data-plugin.mjs";

export default defineConfig({
  plugins: [siteData()],
  build: {
    rollupOptions: {
      // review.html é a página do QR code do balcão (/review com cleanUrls).
      // 404.html: a Vercel serve sozinha quando a página não existe.
      input: {
        main: "index.html",
        review: "review.html",
        notFound: "404.html",
      },
    },
  },
});
