const root = document.documentElement;
root.classList.add("js");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
let paused = reduce.matches;
const motion = document.querySelector("#motion");
const video = document.querySelector("#gift-video");
const play = document.querySelector("#film-start");
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
const menu = document.querySelector("#menu"),
  nav = document.querySelector("#nav");
function closeMenu() {
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Open menu");
  nav.classList.remove("open");
}
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  nav.classList.toggle("open", open);
});
nav
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", closeMenu));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeMenu();
    menu.focus();
  }
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
play.addEventListener("click", async () => {
  try {
    await video.play();
    play.hidden = true;
  } catch {
    play.textContent = "Tap the video controls to play";
  }
});
video.addEventListener("play", () => (play.hidden = true));
video.addEventListener("pause", () => {
  if (video.currentTime === 0) play.hidden = false;
});
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
const gallery = document.querySelector("#gallery"),
  prev = document.querySelector("#gallery-prev"),
  next = document.querySelector("#gallery-next");
// As fotos têm larguras diferentes: vai até o começo da próxima (ou anterior).
function move(dir) {
  const start = gallery.getBoundingClientRect().left - gallery.scrollLeft;
  const lefts = [...gallery.children].map(
    (fig) => fig.getBoundingClientRect().left - start,
  );
  const x = gallery.scrollLeft;
  const target =
    dir > 0
      ? (lefts.find((l) => l > x + 5) ?? gallery.scrollWidth)
      : (lefts.findLast((l) => l < x - 5) ?? 0);
  gallery.scrollTo({ left: target, behavior: paused ? "instant" : "smooth" });
}
prev.addEventListener("click", () => move(-1));
next.addEventListener("click", () => move(1));
gallery.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    move(e.key === "ArrowRight" ? 1 : -1);
  }
});
function galleryState() {
  prev.disabled = gallery.scrollLeft < 5;
  next.disabled =
    gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 5;
}
gallery.addEventListener("scroll", galleryState, { passive: true });
window.addEventListener("resize", galleryState);
galleryState();
let ticking = false;
function scrollEffect() {
  if (!ticking) {
    requestAnimationFrame(() => {
      if (!paused && window.innerWidth > 1000 && scrollY < 900)
        document.querySelector(".hero-photo img").style.transform =
          `translateY(${Math.min(scrollY * 0.1, 70)}px) scale(1.15)`;
      ticking = false;
    });
    ticking = true;
  }
}
window.addEventListener("scroll", scrollEffect, { passive: true });
document.querySelector("#year").textContent = new Date().getFullYear();
