// Status ao vivo das lojas ("Open now", "Closed · opens…"), sempre no horário
// de Dublin, não no do visitante. Usado no navegador (main.js), no build
// (scripts/site-data-plugin.mjs) e nos testes (tests/status.test.mjs).
// hours: { mon: ["07:00", "15:50"], …, sun: null }

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_NAMES = [
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

// Dia da semana (0 = segunda) e minutos desde a meia-noite, em Dublin.
export function dublinNow(date = new Date()) {
  const parts = Object.fromEntries(
    dublinClock.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    day: DAY_KEYS.indexOf(parts.weekday.toLowerCase().slice(0, 3)),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// "07:00" -> "7am", "15:50" -> "3.50pm"
export function formatTime(time) {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}${m ? `.${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

export function isOpen(hours, { day, minutes }) {
  const today = hours[DAY_KEYS[day]];
  return Boolean(
    today && minutes >= toMinutes(today[0]) && minutes < toMinutes(today[1]),
  );
}

export const closingTime = (hours, { day }) => hours[DAY_KEYS[day]][1];

// Próxima abertura: { time, ahead (dias), when }. "tomorrow" só de terça a
// sexta; sábado e segunda vão pelo nome do dia.
export function nextOpening(hours, { day, minutes }) {
  const today = hours[DAY_KEYS[day]];
  if (today && minutes < toMinutes(today[0])) {
    return { time: today[0], ahead: 0, when: "today" };
  }
  for (let ahead = 1; ahead <= 7; ahead++) {
    const next = (day + ahead) % 7;
    const hoursNext = hours[DAY_KEYS[next]];
    if (!hoursNext) continue;
    const when =
      ahead === 1 && next >= 1 && next <= 4 ? "tomorrow" : DAY_NAMES[next];
    return { time: hoursNext[0], ahead, when };
  }
  return null;
}

// Status de uma loja (cards de #cafes e menu mobile).
export function cafeStatus(hours, now) {
  if (isOpen(hours, now)) {
    return {
      open: true,
      text: `Open now · until ${formatTime(closingTime(hours, now))}`,
    };
  }
  const next = nextOpening(hours, now);
  if (!next) return null;
  return {
    open: false,
    text: `Closed · opens ${formatTime(next.time)} ${next.when}`,
  };
}

// Linha da hero, juntando as lojas. cafes: [{ name, hours }]
export function heroStatus(cafes, now) {
  const open = cafes.filter((cafe) => isOpen(cafe.hours, now));
  if (open.length === cafes.length) {
    const closes = open.map((cafe) => closingTime(cafe.hours, now));
    if (closes.every((time) => time === closes[0])) {
      const names = cafes.map((cafe) => cafe.name).join(" & ");
      return {
        open: true,
        text: `Open now in ${names} · until ${formatTime(closes[0])}`,
      };
    }
    const each = open
      .map((cafe, i) => `${cafe.name} until ${formatTime(closes[i])}`)
      .join(", ");
    return { open: true, text: `Open now · ${each}` };
  }
  if (open.length) {
    const each = open
      .map(
        (cafe) =>
          `${cafe.name} is open until ${formatTime(closingTime(cafe.hours, now))}`,
      )
      .join(", ");
    return { open: true, text: each };
  }
  const soonest = cafes
    .map((cafe) => nextOpening(cafe.hours, now))
    .filter(Boolean)
    .sort(
      (a, b) => a.ahead - b.ahead || toMinutes(a.time) - toMinutes(b.time),
    )[0];
  if (!soonest) return null;
  const when =
    soonest.when === "today" || soonest.when === "tomorrow"
      ? soonest.when
      : `on ${soonest.when}`;
  return {
    open: false,
    text: `Closed now · back at ${formatTime(soonest.time)} ${when}`,
  };
}
