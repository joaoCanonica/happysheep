import { defineConfig } from "vite";
import siteData from "./scripts/site-data-plugin.mjs";

export default defineConfig({
  plugins: [siteData()],
});
