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
// Status ao vivo dos cafés, sempre no horário de Dublin.
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const dublinClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Dublin",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
function dublinNow() {
  const parts = Object.fromEntries(
    dublinClock.formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  return {
    day: DAY_KEYS.indexOf(parts.weekday.toLowerCase().slice(0, 3)),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}
const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
// "07:00" -> "7am", "15:50" -> "3.50pm"
function formatTime(time) {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}${m ? `.${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}
function cafeStatus(hours, { day, minutes }) {
  const today = hours[DAY_KEYS[day]];
  if (
    today &&
    minutes >= toMinutes(today[0]) &&
    minutes < toMinutes(today[1])
  ) {
    return { open: true, text: `Open now · until ${formatTime(today[1])}` };
  }
  if (today && minutes < toMinutes(today[0])) {
    return {
      open: false,
      text: `Closed · opens ${formatTime(today[0])} today`,
    };
  }
  for (let ahead = 1; ahead <= 7; ahead++) {
    const next = (day + ahead) % 7;
    const hoursNext = hours[DAY_KEYS[next]];
    if (!hoursNext) continue;
    // "tomorrow" só de terça a sexta; sábado e segunda vão pelo nome do dia.
    const when =
      ahead === 1 && next >= 1 && next <= 4 ? "tomorrow" : DAY_NAMES[next];
    return {
      open: false,
      text: `Closed · opens ${formatTime(hoursNext[0])} ${when}`,
    };
  }
  return null;
}
function updateCafes() {
  const now = dublinNow();
  document.querySelectorAll(".cafe-card[data-hours]").forEach((card) => {
    const status = cafeStatus(JSON.parse(card.dataset.hours), now);
    const el = card.querySelector("[data-status]");
    if (status) {
      el.textContent = status.text;
      el.dataset.open = String(status.open);
      el.hidden = false;
    }
    card.querySelectorAll("tr[data-days]").forEach((row) => {
      row.classList.toggle(
        "today",
        row.dataset.days.split(" ").includes(DAY_KEYS[now.day]),
      );
    });
  });
}
updateCafes();
setInterval(updateCafes, 60000);
