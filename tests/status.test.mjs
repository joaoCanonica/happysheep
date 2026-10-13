// Testes do status ao vivo. Rode com: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { cafeStatus, dublinNow, heroStatus } from "../src/status.js";

const locations = JSON.parse(
  readFileSync(new URL("../src/data/locations.json", import.meta.url)),
);
const cafes = locations.map((loc) => ({ name: loc.name, hours: loc.hours }));
const [dundrum, terenure] = cafes;

// day: 0 = segunda … 6 = domingo; minutes desde a meia-noite (Dublin)
const at = (day, h, m) => ({ day, minutes: h * 60 + m });

const cases = [
  [
    "segunda 6:59",
    at(0, 6, 59),
    "Closed now · back at 7am today",
    "Closed · opens 7am today",
    "Closed · opens 7am today",
  ],
  [
    "segunda 7:00",
    at(0, 7, 0),
    "Open now in Dundrum & Terenure · until 3.50pm",
    "Open now · until 3.50pm",
    "Open now · until 3.50pm",
  ],
  [
    "sexta 15:49",
    at(4, 15, 49),
    "Open now in Dundrum & Terenure · until 3.50pm",
    "Open now · until 3.50pm",
    "Open now · until 3.50pm",
  ],
  [
    "sexta 15:51",
    at(4, 15, 51),
    "Closed now · back at 8am on Saturday",
    "Closed · opens 8am Saturday",
    "Closed · opens 8am Saturday",
  ],
  [
    "sábado 12:00",
    at(5, 12, 0),
    "Open now · Dundrum until 3pm, Terenure until 3.50pm",
    "Open now · until 3pm",
    "Open now · until 3.50pm",
  ],
  [
    "sábado 15:01",
    at(5, 15, 1),
    "Terenure is open until 3.50pm",
    "Closed · opens 7am Monday",
    "Open now · until 3.50pm",
  ],
  [
    "domingo 11:00",
    at(6, 11, 0),
    "Closed now · back at 7am on Monday",
    "Closed · opens 7am Monday",
    "Closed · opens 7am Monday",
  ],
  [
    "quinta 17:00",
    at(3, 17, 0),
    "Closed now · back at 7am tomorrow",
    "Closed · opens 7am tomorrow",
    "Closed · opens 7am tomorrow",
  ],
];

for (const [name, now, hero, dun, ter] of cases) {
  test(name, () => {
    assert.equal(heroStatus(cafes, now).text, hero);
    assert.equal(cafeStatus(dundrum.hours, now).text, dun);
    assert.equal(cafeStatus(terenure.hours, now).text, ter);
  });
}

test("o ponto da hero segue o estado", () => {
  assert.equal(heroStatus(cafes, at(5, 15, 1)).open, true);
  assert.equal(heroStatus(cafes, at(6, 11, 0)).open, false);
});

test("usa o horário de Dublin, verão (IST) e inverno (GMT)", () => {
  // 06:00 UTC de segunda 12/10/2026 = 7:00 em Dublin (IST, UTC+1)
  assert.deepEqual(dublinNow(new Date("2026-10-12T06:00:00Z")), at(0, 7, 0));
  // 07:00 UTC de segunda 14/12/2026 = 7:00 em Dublin (GMT)
  assert.deepEqual(dublinNow(new Date("2026-12-14T07:00:00Z")), at(0, 7, 0));
});
