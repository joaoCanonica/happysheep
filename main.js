import { DAY_KEYS, cafeStatus, dublinNow, heroStatus } from "./src/status.js";

const root = document.documentElement;
root.classList.add("js");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
let paused = reduce.matches;
const motion = document.querySelector("#motion");
const video = document.querySelector("#gift-video");
const play = document.querySelector("#film-start");
const toggle = document.querySelector("#film-toggle");
const pour = document.querySelector("#pour-video");
let pourVisible = false;
function updatePour() {
  if (pourVisible && !paused) {
    pour.play().catch(() => {});
  } else if (!pour.paused) {
    pour.pause();
  }
}
function setMotion(value) {
  paused = value;
  root.classList.toggle("paused", paused);
  motion.setAttribute("aria-pressed", String(paused));
  motion.textContent = paused ? "Play animations" : "Pause animations";
  if (paused) {
    video.pause();
    // Volta ao poster: com animações pausadas só a imagem parada aparece.
    if (pour.currentTime > 0) pour.load();
    document.querySelector(".hero-photo img").style.transform = "";
  }
}
setMotion(paused);
new IntersectionObserver(
  (entries) => {
    pourVisible = entries[0].isIntersecting;
    updatePour();
  },
  { threshold: 0.25 },
).observe(pour);
motion.addEventListener("click", () => {
  setMotion(!paused);
  updatePour();
});
reduce.addEventListener("change", () => {
  setMotion(reduce.matches);
  updatePour();
});
// Menu mobile: painel de tela cheia. Trava o scroll da página, fecha com Esc,
// com o X e ao escolher um link, e prende o foco entre o X e o painel.
const menu = document.querySelector("#menu"),
  panel = document.querySelector("#menu-panel");
const menuOpen = () => menu.getAttribute("aria-expanded") === "true";
function setMenu(open, { returnFocus = false } = {}) {
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  panel.hidden = !open;
  root.classList.toggle("menu-open", open);
  if (open) panel.querySelector("a").focus({ preventScroll: true });
  else if (returnFocus) menu.focus({ preventScroll: true });
}
menu.addEventListener("click", () => setMenu(!menuOpen()));
panel
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => {
  if (!menuOpen()) return;
  if (e.key === "Escape") {
    setMenu(false, { returnFocus: true });
  } else if (e.key === "Tab") {
    const items = [menu, ...panel.querySelectorAll("a")];
    const index = items.indexOf(document.activeElement);
    const next = e.shiftKey
      ? index <= 0
        ? items.length - 1
        : index - 1
      : index === items.length - 1
        ? 0
        : index + 1;
    e.preventDefault();
    items[next].focus();
  }
});
// Se a tela crescer até o layout de desktop com o menu aberto, fecha.
matchMedia("(min-width: 761px)").addEventListener("change", (e) => {
  if (e.matches && menuOpen()) setMenu(false);
});
const reveal = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        reveal.unobserve(entry.target);
      }
    }),
  { threshold: 0.1 },
);
document.querySelectorAll(".reveal").forEach((e) => reveal.observe(e));
// Vídeo Good Vibes sem controles nativos: o botão "Take a closer look" dá o
// play e vira um botão redondo de pausa/play no canto.
play.addEventListener("click", async () => {
  try {
    await video.play();
    toggle.focus();
  } catch {
    // Se o navegador recusar o play, o botão continua lá.
  }
});
toggle.addEventListener("click", () => {
  if (video.paused) video.play().catch(() => {});
  else video.pause();
});
function updateToggle() {
  const playing = !video.paused;
  toggle.setAttribute("aria-label", playing ? "Pause video" : "Play video");
  toggle.firstElementChild.textContent = playing ? "Ⅱ" : "▶";
}
video.addEventListener("play", () => {
  play.hidden = true;
  toggle.hidden = false;
  updateToggle();
});
video.addEventListener("pause", updateToggle);
const filmObserver = new IntersectionObserver(
  (entries) => {
    if (!entries[0].isIntersecting) video.pause();
  },
  { threshold: 0.1 },
);
filmObserver.observe(video);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    video.pause();
    pour.pause();
  } else {
    updatePour();
  }
});
// Carrosséis horizontais (galeria e avaliações): setas, teclado ← → e
// estado dos botões. Os itens têm larguras diferentes, então cada clique vai
// até o começo do próximo (ou do anterior).
function setupCarousel(track, prev, next) {
  function move(dir) {
    const start = track.getBoundingClientRect().left - track.scrollLeft;
    const all = [...track.children].map(
      (item) => item.getBoundingClientRect().left - start,
    );
    const lefts = all.map((l) => l - all[0]);
    const x = track.scrollLeft;
    const target =
      dir > 0
        ? (lefts.find((l) => l > x + 5) ?? track.scrollWidth)
        : (lefts.findLast((l) => l < x - 5) ?? 0);
    track.scrollTo({ left: target, behavior: paused ? "instant" : "smooth" });
  }
  function state() {
    prev.disabled = track.scrollLeft < 5;
    next.disabled =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
  }
  prev.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      move(e.key === "ArrowRight" ? 1 : -1);
    }
  });
  track.addEventListener("scroll", state, { passive: true });
  window.addEventListener("resize", state);
  state();
}
setupCarousel(
  document.querySelector("#gallery"),
  document.querySelector("#gallery-prev"),
  document.querySelector("#gallery-next"),
);
setupCarousel(
  document.querySelector("#review-track"),
  document.querySelector("#reviews-prev"),
  document.querySelector("#reviews-next"),
);
let ticking = false;
function scrollEffect() {
  if (!ticking) {
    requestAnimationFrame(() => {
      // Só translateY (máx. 40px, a folga do CSS), sem ampliar a foto.
      if (!paused && window.innerWidth > 1000 && scrollY < 900)
        document.querySelector(".hero-photo img").style.transform =
          `translateY(${Math.min(scrollY * 0.1, 40)}px)`;
      ticking = false;
    });
    ticking = true;
  }
}
window.addEventListener("scroll", scrollEffect, { passive: true });
document.querySelector("#year").textContent = new Date().getFullYear();
// Status ao vivo (src/status.js), sempre no horário de Dublin: cards de
// #cafes, lojas do menu mobile e a linha da hero. Sem JS, nada disso aparece
// e o HTML mostra só a tabela e "Find us in Dundrum & Terenure".
const cafeCards = [...document.querySelectorAll(".cafe-card[data-hours]")];
const heroLine = document.querySelector("[data-hero-status]");
function setStatus(el, status) {
  el.dataset.open = String(status.open);
  el.replaceChildren();
  if (el === heroLine) {
    const dot = document.createElement("span");
    dot.className = "status-dot";
    dot.setAttribute("aria-hidden", "true");
    el.append(dot);
  }
  el.append(status.text);
  el.hidden = false;
}
function updateStatus() {
  const now = dublinNow();
  document.querySelectorAll("[data-hours]").forEach((place) => {
    const status = cafeStatus(JSON.parse(place.dataset.hours), now);
    if (status) setStatus(place.querySelector("[data-status]"), status);
    place.querySelectorAll("tr[data-days]").forEach((row) => {
      row.classList.toggle(
        "today",
        row.dataset.days.split(" ").includes(DAY_KEYS[now.day]),
      );
    });
  });
  const hero = heroStatus(
    cafeCards.map((card) => ({
      name: card.querySelector(".cafe-name").textContent,
      hours: JSON.parse(card.dataset.hours),
    })),
    now,
  );
  if (hero) setStatus(heroLine, hero);
}
updateStatus();
setInterval(updateStatus, 60000);

// Link do header da seção que está na tela.
const navSections = ["cafes", "coffee", "gifts", "reviews"];
const onScreen = new Set();
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) =>
      entry.isIntersecting
        ? onScreen.add(entry.target.id)
        : onScreen.delete(entry.target.id),
    );
    const active = navSections.find((id) => onScreen.has(id));
    document.querySelectorAll("#nav a, .menu-links a").forEach((link) => {
      const isActive = link.getAttribute("href") === `#${active}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  },
  { rootMargin: "-40% 0px -55% 0px" },
);
navSections.forEach((id) =>
  sectionObserver.observe(document.getElementById(id)),
);
