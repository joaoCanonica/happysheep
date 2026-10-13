import { defineConfig } from "@playwright/test";

// Testes de navegador. Sobe o build de produção numa porta própria.
// Primeira vez num computador novo: npx playwright install chromium
export default defineConfig({
  testDir: "tests",
  testMatch: "*.spec.mjs",
  reporter: "list",
  timeout: 120_000,
  use: { baseURL: "http://localhost:4321" },
  webServer: {
    command: "npm run build && npx vite preview --port 4321 --strictPort",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
