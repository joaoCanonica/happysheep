const root = document.documentElement;
root.classList.add("js");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
let paused = reduce.matches;
const motion = document.querySelector("#motion");
const video = document.querySelector("#gift-video");
const play = document.querySelector("#film-start");
function setMotion(value) {
  paused = value;
  root.classList.toggle("paused", paused);
  motion.setAttribute("aria-pressed", String(paused));
  motion.setAttribute(
    "aria-label",
    paused ? "Enable animations" : "Pause animations",
  );
  motion.title = paused ? "Enable animations" : "Pause animations";
  motion.textContent = paused ? "▶" : "Ⅱ";
  if (paused) {
    video.pause();
    document.querySelector(".hero-photo img").style.transform = "";
    document.querySelector(".card-inner").style.transform = "";
  }
}
setMotion(paused);
motion.addEventListener("click", () => setMotion(!paused));
reduce.addEventListener("change", () => setMotion(reduce.matches));
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
  if (document.hidden) video.pause();
});
const gallery = document.querySelector("#gallery"),
  prev = document.querySelector("#gallery-prev"),
  next = document.querySelector("#gallery-next");
function step() {
  return (
    gallery.querySelector("figure").getBoundingClientRect().width +
    parseFloat(getComputedStyle(gallery).gap)
  );
}
function move(dir) {
  gallery.scrollBy({
    left: step() * dir,
    behavior: paused ? "instant" : "smooth",
  });
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
const card = document.querySelector(".gift-card-art"),
  inner = document.querySelector(".card-inner");
card.addEventListener("pointermove", (e) => {
  if (paused || e.pointerType !== "mouse") return;
  const b = card.getBoundingClientRect(),
    x = (e.clientX - b.left) / b.width - 0.5,
    y = (e.clientY - b.top) / b.height - 0.5;
  inner.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
});
card.addEventListener("pointerleave", () => (inner.style.transform = ""));
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
