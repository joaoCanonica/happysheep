// Vercel Web Analytics: visitas e eventos de clique, sem cookies e sem banner
// de consentimento. Usado pela home (main.js), pela /review e pela 404.
//
// Eventos: qualquer elemento com data-track="nome" dispara track("nome") ao
// ser clicado; os atributos data-track-* viram as propriedades do evento:
//   <a data-track="directions" data-track-cafe="dundrum" data-track-place="cafes">
import { inject, track } from "@vercel/analytics";

export { track };

export function setupAnalytics() {
  // O script /_vercel/insights só existe no deploy da Vercel; no preview
  // local daria 404 (e um erro no console).
  if (["localhost", "127.0.0.1"].includes(location.hostname)) return;
  inject({ mode: import.meta.env.DEV ? "development" : "production" });
}

// Um único listener para a página toda.
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-track]");
  if (!el) return;
  const props = {};
  for (const [key, value] of Object.entries(el.dataset)) {
    if (key.startsWith("track") && key !== "track") {
      props[key.slice(5).toLowerCase()] = value;
    }
  }
  track(el.dataset.track, props);
});
